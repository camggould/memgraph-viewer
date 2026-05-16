import { Chip, Tooltip } from '@heroui/react';
import type { NodeOut } from '@/api/types';

export function ConflictBadge({ node }: { node: NodeOut }) {
  if (!node.conflicts || node.conflicts.length === 0) return null;
  return (
    <Tooltip content={`Conflicts with: ${node.conflicts.join(', ')}`}>
      <Chip size="sm" variant="flat" color="danger">
        {node.conflicts.length} conflict{node.conflicts.length === 1 ? '' : 's'}
      </Chip>
    </Tooltip>
  );
}
