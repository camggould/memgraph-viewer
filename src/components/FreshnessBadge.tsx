import { Chip } from '@heroui/react';
import type { NodeOut } from '@/api/types';

export function FreshnessBadge({ node }: { node: NodeOut }) {
  if (!node.freshness_at) {
    return (
      <Chip size="sm" variant="flat" color="default">
        no horizon
      </Chip>
    );
  }
  if (node.is_stale) {
    return (
      <Chip size="sm" variant="flat" color="warning">
        stale
      </Chip>
    );
  }
  return (
    <Chip size="sm" variant="flat" color="success">
      fresh
    </Chip>
  );
}
