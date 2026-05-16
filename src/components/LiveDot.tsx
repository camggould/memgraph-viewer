import type { SseStatus } from '@/api/sse';

const COLORS: Record<SseStatus, string> = {
  open: 'bg-success',
  connecting: 'bg-warning',
  reconnecting: 'bg-warning',
  paused: 'bg-default-400',
  unauthenticated: 'bg-default-400',
};

const LABELS: Record<SseStatus, string> = {
  open: 'live',
  connecting: 'connecting',
  reconnecting: 'reconnecting',
  paused: 'paused',
  unauthenticated: 'no auth',
};

export function LiveDot({ status }: { status: SseStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-default-500">
      <span className={`inline-block w-2 h-2 rounded-full ${COLORS[status]}`} />
      {LABELS[status]}
    </span>
  );
}
