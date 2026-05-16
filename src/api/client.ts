import type {
  EdgesListOut,
  GraphOut,
  GraphsListOut,
  HistoryOut,
  InfoOut,
  NeighborhoodOut,
  NodeOut,
  NodesListOut,
  SearchOut,
  SymlinkManifestOut,
} from './types';

const URL_KEY = 'memgraph_api_url';
const TOKEN_KEY = 'memgraph_api_token';

export function getApiUrl(): string {
  if (typeof window === 'undefined') return '/';
  const v = window.localStorage.getItem(URL_KEY);
  if (v && v.trim()) return v.replace(/\/$/, '');
  return '';
}

export function setApiUrl(url: string) {
  window.localStorage.setItem(URL_KEY, url);
}

export function getApiToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function setApiToken(t: string) {
  window.localStorage.setItem(TOKEN_KEY, t);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface FetchOpts {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const base = getApiUrl();
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  const token = getApiToken();
  if (token) headers['authorization'] = `Bearer ${token}`;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : res.statusText) || `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

export interface ApiClient {
  getInfo(): Promise<InfoOut>;
  listGraphs(): Promise<GraphsListOut>;
  getGraph(id: string): Promise<GraphOut>;
  getSymlinks(id: string): Promise<SymlinkManifestOut>;
  listNodes(
    id: string,
    params?: { kinds?: string[]; tags?: string[]; limit?: number; offset?: number },
  ): Promise<NodesListOut>;
  search(
    id: string,
    params: { q: string; kinds?: string[]; tags?: string[]; fresh_only?: boolean; limit?: number },
  ): Promise<SearchOut>;
  getNode(lineageId: string, params?: { version?: number; at?: string }): Promise<NodeOut>;
  getHistory(lineageId: string): Promise<HistoryOut>;
  getOutgoing(lineageId: string, kinds?: string[]): Promise<EdgesListOut>;
  getIncoming(lineageId: string, kinds?: string[]): Promise<EdgesListOut>;
  getNeighborhood(
    lineageId: string,
    params?: { depth?: number; kinds?: string[]; follow_symlinks?: boolean; max_nodes?: number },
  ): Promise<NeighborhoodOut>;
}

function qs(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v.join(','))}`);
    } else if (typeof v === 'boolean') {
      parts.push(`${encodeURIComponent(k)}=${v ? '1' : '0'}`);
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api: ApiClient = {
  getInfo: () => request('/v1/info'),
  listGraphs: () => request('/v1/graphs'),
  getGraph: (id) => request(`/v1/graphs/${encodeURIComponent(id)}`),
  getSymlinks: (id) => request(`/v1/graphs/${encodeURIComponent(id)}/symlinks`),
  listNodes: (id, params = {}) =>
    request(`/v1/graphs/${encodeURIComponent(id)}/nodes${qs(params)}`),
  search: (id, params) =>
    request(`/v1/graphs/${encodeURIComponent(id)}/search${qs(params)}`),
  getNode: (lineageId, params = {}) =>
    request(`/v1/nodes/${encodeURIComponent(lineageId)}${qs(params)}`),
  getHistory: (lineageId) =>
    request(`/v1/nodes/${encodeURIComponent(lineageId)}/history`),
  getOutgoing: (lineageId, kinds) =>
    request(`/v1/nodes/${encodeURIComponent(lineageId)}/outgoing${qs({ kinds })}`),
  getIncoming: (lineageId, kinds) =>
    request(`/v1/nodes/${encodeURIComponent(lineageId)}/incoming${qs({ kinds })}`),
  getNeighborhood: (lineageId, params = {}) =>
    request(`/v1/nodes/${encodeURIComponent(lineageId)}/neighborhood${qs(params)}`),
};
