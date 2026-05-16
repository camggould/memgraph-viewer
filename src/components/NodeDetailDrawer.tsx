import { useState } from 'react';
import { Button, Chip, Tab, Tabs, Tooltip } from '@heroui/react';
import type { NodeOut } from '@/api/types';
import { api as apiClient } from '@/api/client';
import { resolvePlugin } from '@/plugins/registry';
import { defaultPlugin } from '@/plugins/default';
import { FreshnessBadge } from './FreshnessBadge';
import { ConflictBadge } from './ConflictBadge';
import { EdgeListPanel } from './EdgeListPanel';
import { HistoryList } from './HistoryList';
import { colorForKind } from '@/lib/colors';

export function NodeDetailDrawer({
  node,
  onClose,
  onNavigate,
}: {
  node: NodeOut | null;
  onClose: () => void;
  onNavigate: (lineageId: string) => void;
}) {
  const [historicalVersion, setHistoricalVersion] = useState<NodeOut | null>(null);
  const display = historicalVersion ?? node;

  if (!node || !display) return null;

  const plugin = resolvePlugin(display) ?? defaultPlugin;
  const pluginApi = {
    api: apiClient,
    navigate: onNavigate,
    close: onClose,
  };

  return (
    <aside className="w-[380px] border-l border-divider bg-content1 flex flex-col h-full">
      <header className="flex items-start gap-2 p-3 border-b border-divider">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              size="sm"
              variant="flat"
              style={{ backgroundColor: colorForKind(display.kind) + '33', color: colorForKind(display.kind) }}
              className="mono"
            >
              {display.kind}
            </Chip>
            <Tooltip content="Click to copy">
              <button
                className="mono text-xs text-default-500 truncate hover:text-foreground"
                onClick={() => navigator.clipboard.writeText(display.lineage_id)}
              >
                {display.lineage_id}
              </button>
            </Tooltip>
            <span className="mono text-xs text-default-400">v{display.version}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <FreshnessBadge node={display} />
            <ConflictBadge node={display} />
            <Chip size="sm" variant="flat" color={display.is_current ? 'default' : 'warning'}>
              {display.is_current ? 'current' : 'historical'}
            </Chip>
            {historicalVersion && (
              <Button size="sm" variant="light" onPress={() => setHistoricalVersion(null)}>
                latest
              </Button>
            )}
          </div>
        </div>
        <Button size="sm" variant="light" onPress={onClose}>
          ✕
        </Button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Tabs aria-label="Node detail" variant="underlined" className="px-3 pt-2" fullWidth>
          <Tab key="content" title="Content">
            <div className="px-1 pb-4">{plugin.renderDetailPanel?.(display, pluginApi)}</div>
          </Tab>
          <Tab key="meta" title="Metadata">
            <div className="px-1 pb-4">
              <pre className="mono text-xs whitespace-pre-wrap break-words bg-default-100 p-3 rounded">
                {JSON.stringify(
                  {
                    id: display.id,
                    graph_id: display.graph_id,
                    lineage_id: display.lineage_id,
                    version: display.version,
                    kind: display.kind,
                    tags: display.tags,
                    metadata: display.metadata,
                    freshness_at: display.freshness_at,
                    created_at: display.created_at,
                    created_by: display.created_by,
                    superseded_by: display.superseded_by,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </Tab>
          <Tab key="edges" title="Edges">
            <div className="px-1 pb-4">
              <EdgeListPanel lineageId={display.lineage_id} onNavigate={onNavigate} />
            </div>
          </Tab>
          <Tab key="history" title="History">
            <div className="px-1 pb-4">
              <HistoryList lineageId={display.lineage_id} onPick={setHistoricalVersion} />
            </div>
          </Tab>
        </Tabs>
      </div>
    </aside>
  );
}
