import { useEffect, useRef, useState } from 'react';
import type { EdgeOut, GraphOut, NodeOut } from './types';
import { getApiToken, getApiUrl } from './client';

export type SseStatus = 'connecting' | 'open' | 'reconnecting' | 'paused' | 'unauthenticated';

export interface SseHandlers {
  onNode?: (n: NodeOut) => void;
  onEdge?: (e: EdgeOut) => void;
  onGraph?: (g: GraphOut) => void;
}

// EventSource cannot send custom headers (no auth bearer). When a token is
// set we fall back to fetch + manual parsing of the text/event-stream body.
export function useEventStream(active: boolean, handlers: SseHandlers): SseStatus {
  const [status, setStatus] = useState<SseStatus>('paused');
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!active) {
      setStatus('paused');
      return;
    }

    let cancelled = false;
    let attempt = 0;
    let abort: AbortController | null = null;
    let timer: number | null = null;

    const start = async () => {
      if (cancelled) return;
      const base = getApiUrl();
      const token = getApiToken();
      const url = `${base}/v1/stream`;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      abort = new AbortController();
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            accept: 'text/event-stream',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          signal: abort.signal,
        });
        if (res.status === 401 || res.status === 403) {
          setStatus('unauthenticated');
          schedule();
          return;
        }
        if (!res.ok || !res.body) {
          schedule();
          return;
        }
        setStatus('open');
        attempt = 0;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf('\n\n')) !== -1) {
            const raw = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            dispatch(raw);
          }
        }
        schedule();
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        schedule();
      }
    };

    const dispatch = (raw: string) => {
      let event = 'message';
      let data = '';
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }
      const h = handlersRef.current;
      switch (event) {
        case 'node.written':
          h.onNode?.(parsed as NodeOut);
          break;
        case 'edge.written':
          h.onEdge?.(parsed as EdgeOut);
          break;
        case 'graph.created':
          h.onGraph?.(parsed as GraphOut);
          break;
        case 'ping':
          break;
      }
    };

    const schedule = () => {
      if (cancelled) return;
      attempt += 1;
      setStatus((s) => (s === 'unauthenticated' ? s : 'reconnecting'));
      const base = Math.min(30000, 500 * 2 ** Math.min(attempt, 6));
      const delay = base * (0.5 + Math.random() * 0.5);
      timer = window.setTimeout(start, delay);
    };

    start();
    return () => {
      cancelled = true;
      if (abort) abort.abort();
      if (timer != null) window.clearTimeout(timer);
    };
  }, [active]);

  return status;
}
