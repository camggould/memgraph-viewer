import { useState } from 'react';
import { Input, Listbox, ListboxItem, Spinner } from '@heroui/react';
import { useSearch } from '@/api/hooks';

export function SearchBar({
  graphId,
  onSelect,
}: {
  graphId: string;
  onSelect: (lineageId: string) => void;
}) {
  const [q, setQ] = useState('');
  const search = useSearch(graphId, q, { limit: 10 });

  return (
    <div className="p-3 border-b border-divider">
      <Input
        size="sm"
        placeholder="Search nodes..."
        value={q}
        onValueChange={setQ}
        variant="bordered"
      />
      {q.trim().length > 0 && (
        <div className="mt-2 max-h-60 overflow-y-auto">
          {search.isLoading && (
            <div className="flex items-center gap-2 text-default-500 text-xs">
              <Spinner size="sm" /> searching
            </div>
          )}
          {search.data && search.data.hits.length === 0 && (
            <div className="text-default-400 text-xs">no hits</div>
          )}
          {search.data && search.data.hits.length > 0 && (
            <Listbox
              aria-label="Search results"
              onAction={(key) => onSelect(String(key))}
              variant="flat"
              className="p-0"
            >
              {search.data.hits.map((h) => (
                <ListboxItem
                  key={h.node.lineage_id}
                  description={h.snippet || h.node.kind}
                  className="text-sm"
                >
                  {h.node.summary || h.node.content || h.node.lineage_id}
                </ListboxItem>
              ))}
            </Listbox>
          )}
        </div>
      )}
    </div>
  );
}
