import { NavLink } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { useGraphs } from '@/api/hooks';

export function GraphsList() {
  const { data, isLoading, error } = useGraphs();

  return (
    <div className="p-3 border-b border-divider">
      <div className="text-xs text-default-500 mb-2">Graphs</div>
      {isLoading && (
        <div className="flex items-center gap-2 text-default-500 text-xs">
          <Spinner size="sm" /> loading
        </div>
      )}
      {error && <div className="text-danger text-xs">{(error as Error).message}</div>}
      {data && data.graphs.length === 0 && (
        <div className="text-default-400 text-xs">No graphs yet.</div>
      )}
      <ul className="flex flex-col">
        {data?.graphs.map((g) => (
          <li key={g.id}>
            <NavLink
              to={`/graphs/${g.id}`}
              className={({ isActive }) =>
                `block py-1.5 px-2 rounded text-sm hover:bg-default-100 ${
                  isActive ? 'bg-default-200 text-foreground' : 'text-default-600'
                }`
              }
            >
              <div className="truncate">{g.name}</div>
              <div className="mono text-[10px] text-default-400 truncate">{g.id}</div>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
