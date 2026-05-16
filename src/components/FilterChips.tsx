import { Chip } from '@heroui/react';

export function FilterChips({
  label,
  values,
  active,
  onToggle,
}: {
  label: string;
  values: string[];
  active: Set<string>;
  onToggle: (v: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <div className="px-3 py-2 border-b border-divider">
      <div className="text-xs text-default-500 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <Chip
            key={v}
            size="sm"
            variant={active.has(v) ? 'solid' : 'flat'}
            color={active.has(v) ? 'primary' : 'default'}
            onClick={() => onToggle(v)}
            className="cursor-pointer mono text-xs"
          >
            {v}
          </Chip>
        ))}
      </div>
    </div>
  );
}
