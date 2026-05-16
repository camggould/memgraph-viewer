import { Spinner } from '@heroui/react';
import { useHistory } from '@/api/hooks';
import type { NodeOut } from '@/api/types';

export function HistoryList({
  lineageId,
  onPick,
}: {
  lineageId: string;
  onPick: (n: NodeOut) => void;
}) {
  const { data, isLoading } = useHistory(lineageId);
  if (isLoading) return <Spinner size="sm" />;
  if (!data) return null;
  if (data.versions.length === 0) {
    return <div className="text-default-400 text-xs">no versions</div>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {data.versions.map((v) => (
        <li
          key={v.id}
          className="py-1.5 px-2 rounded cursor-pointer hover:bg-default-100"
          onClick={() => onPick(v)}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="mono">v{v.version}</span>
            <span className="text-default-400">{new Date(v.created_at).toLocaleString()}</span>
          </div>
          <div className="mono text-[10px] text-default-400 truncate">{v.created_by}</div>
        </li>
      ))}
    </ul>
  );
}
