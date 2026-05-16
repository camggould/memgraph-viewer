import { useIncoming, useOutgoing } from '@/api/hooks';
import type { EdgeOut } from '@/api/types';
import { Spinner } from '@heroui/react';

function EdgeRow({
  edge,
  direction,
  onNavigate,
}: {
  edge: EdgeOut;
  direction: 'out' | 'in';
  onNavigate: (lineageId: string) => void;
}) {
  const target = direction === 'out' ? edge.to_lineage : edge.from_lineage;
  const arrow = direction === 'out' ? '→' : '←';
  return (
    <li className="py-1 px-2 hover:bg-default-100 rounded cursor-pointer" onClick={() => onNavigate(target)}>
      <div className="flex items-center gap-2 text-xs">
        <span className="mono text-primary">{edge.kind}</span>
        <span className="text-default-400">{arrow}</span>
        <span className="mono text-default-500 truncate">{target}</span>
        {edge.ordinal != null && (
          <span className="mono text-default-400 ml-auto">#{edge.ordinal}</span>
        )}
      </div>
    </li>
  );
}

export function EdgeListPanel({
  lineageId,
  onNavigate,
}: {
  lineageId: string;
  onNavigate: (lineageId: string) => void;
}) {
  const outgoing = useOutgoing(lineageId);
  const incoming = useIncoming(lineageId);

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="text-xs text-default-500 mb-1">Outgoing</div>
        {outgoing.isLoading && <Spinner size="sm" />}
        {outgoing.data && outgoing.data.edges.length === 0 && (
          <div className="text-default-400 text-xs">no outgoing edges</div>
        )}
        <ul>
          {outgoing.data?.edges.map((e) => (
            <EdgeRow key={e.id} edge={e} direction="out" onNavigate={onNavigate} />
          ))}
        </ul>
      </section>
      <section>
        <div className="text-xs text-default-500 mb-1">Incoming</div>
        {incoming.isLoading && <Spinner size="sm" />}
        {incoming.data && incoming.data.edges.length === 0 && (
          <div className="text-default-400 text-xs">no incoming edges</div>
        )}
        <ul>
          {incoming.data?.edges.map((e) => (
            <EdgeRow key={e.id} edge={e} direction="in" onNavigate={onNavigate} />
          ))}
        </ul>
      </section>
    </div>
  );
}
