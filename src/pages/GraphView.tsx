import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@heroui/react';
import { AppShell, type AuthState } from '@/components/AppShell';
import { GraphsList as GraphsListSidebar } from '@/components/GraphsList';
import { SearchBar } from '@/components/SearchBar';
import { FilterChips } from '@/components/FilterChips';
import { GraphCanvas, type CanvasGraph } from '@/components/GraphCanvas';
import { NodeDetailDrawer } from '@/components/NodeDetailDrawer';
import { LiveDot } from '@/components/LiveDot';
import { ApiError, api } from '@/api/client';
import { useGraph, useGraphNodes, useNode } from '@/api/hooks';
import { useEventStream } from '@/api/sse';
import type { EdgeOut, NodeOut } from '@/api/types';

const BATCH_SIZE = 25;

async function fetchEdgesForNodes(lineageIds: string[]): Promise<EdgeOut[]> {
  const out: EdgeOut[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < lineageIds.length; i += BATCH_SIZE) {
    const batch = lineageIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((id) => api.getOutgoing(id).catch(() => null)));
    for (const r of results) {
      if (!r) continue;
      for (const e of r.edges) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        out.push(e);
      }
    }
  }
  return out;
}

export function GraphViewPage() {
  const { graphId, lineageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLineage, setSelectedLineage] = useState<string | null>(lineageId ?? null);
  const [kindFilters, setKindFilters] = useState<Set<string>>(new Set());
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedLineage(lineageId ?? null);
  }, [lineageId]);

  const graph = useGraph(graphId);
  const nodesQuery = useGraphNodes(graphId, { limit: 200 });

  const allNodes = nodesQuery.data?.nodes ?? [];
  const lineageIds = useMemo(() => allNodes.map((n) => n.lineage_id), [allNodes]);

  const edgesQuery = useQuery({
    queryKey: ['bulk-edges', graphId, lineageIds],
    queryFn: () => fetchEdgesForNodes(lineageIds),
    enabled: lineageIds.length > 0,
  });

  // Merge in extra nodes/edges from neighborhood expansions and SSE upserts.
  const [extraNodes, setExtraNodes] = useState<Record<string, NodeOut>>({});
  const [extraEdges, setExtraEdges] = useState<Record<string, EdgeOut>>({});

  // Reset extras when graph changes.
  useEffect(() => {
    setExtraNodes({});
    setExtraEdges({});
  }, [graphId]);

  const selectedNodeQuery = useNode(selectedLineage ?? undefined);
  const selectedNode = selectedNodeQuery.data ?? null;

  const authState: AuthState = useMemo(() => {
    const err = (graph.error || nodesQuery.error) as ApiError | undefined;
    if (err && (err.status === 401 || err.status === 403)) return 'denied';
    if (graph.data) return 'ok';
    return 'no-token';
  }, [graph.error, nodesQuery.error, graph.data]);

  const sseStatus = useEventStream(!!graphId && authState !== 'denied', {
    onNode: (n) => {
      if (n.graph_id !== graphId) return;
      setExtraNodes((cur) => ({ ...cur, [n.lineage_id]: n }));
      if (n.lineage_id === selectedLineage) {
        queryClient.invalidateQueries({ queryKey: ['node', n.lineage_id] });
      }
    },
    onEdge: (e) => {
      if (e.graph_id !== graphId) return;
      setExtraEdges((cur) => ({ ...cur, [e.id]: e }));
    },
    onGraph: () => {
      queryClient.invalidateQueries({ queryKey: ['graphs'] });
    },
  });

  const onExpand = async (lid: string) => {
    try {
      const res = await api.getNeighborhood(lid, { depth: 2, max_nodes: 50, follow_symlinks: false });
      setExtraNodes((cur) => {
        const next = { ...cur };
        for (const n of res.nodes) next[n.lineage_id] = n;
        return next;
      });
      setExtraEdges((cur) => {
        const next = { ...cur };
        for (const e of res.edges) next[e.id] = e;
        return next;
      });
    } catch {
      // ignore — user can click again
    }
  };

  const canvasData: CanvasGraph = useMemo(() => {
    const nodeMap = new Map<string, NodeOut>();
    for (const n of allNodes) nodeMap.set(n.lineage_id, n);
    for (const n of Object.values(extraNodes)) nodeMap.set(n.lineage_id, n);

    let nodes = Array.from(nodeMap.values());
    if (kindFilters.size > 0) nodes = nodes.filter((n) => kindFilters.has(n.kind));
    if (tagFilters.size > 0) {
      nodes = nodes.filter((n) => n.tags?.some((t) => tagFilters.has(t)));
    }

    const edgeMap = new Map<string, EdgeOut>();
    for (const e of edgesQuery.data ?? []) edgeMap.set(e.id, e);
    for (const e of Object.values(extraEdges)) edgeMap.set(e.id, e);

    return { nodes, edges: Array.from(edgeMap.values()) };
  }, [allNodes, extraNodes, extraEdges, edgesQuery.data, kindFilters, tagFilters]);

  const availableKinds = useMemo(() => {
    const s = new Set<string>();
    for (const n of allNodes) s.add(n.kind);
    for (const n of Object.values(extraNodes)) s.add(n.kind);
    return Array.from(s).sort();
  }, [allNodes, extraNodes]);

  const availableTags = useMemo(() => {
    const s = new Set<string>();
    for (const n of allNodes) (n.tags ?? []).forEach((t) => s.add(t));
    for (const n of Object.values(extraNodes)) (n.tags ?? []).forEach((t) => s.add(t));
    return Array.from(s).sort();
  }, [allNodes, extraNodes]);

  const handleSelect = (n: NodeOut) => {
    setSelectedLineage(n.lineage_id);
    void onExpand(n.lineage_id);
    if (graphId) navigate(`/graphs/${graphId}/nodes/${n.lineage_id}`, { replace: true });
  };

  const handleNavigateTo = (lid: string) => {
    setSelectedLineage(lid);
    void onExpand(lid);
    if (graphId) navigate(`/graphs/${graphId}/nodes/${lid}`, { replace: true });
  };

  const handleCloseDrawer = () => {
    setSelectedLineage(null);
    if (graphId) navigate(`/graphs/${graphId}`, { replace: true });
  };

  const toggle = (set: Set<string>, v: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next);
  };

  return (
    <AppShell
      authState={authState}
      sidebar={
        <div>
          <GraphsListSidebar />
          {graphId && <SearchBar graphId={graphId} onSelect={handleNavigateTo} />}
          <FilterChips
            label="Kinds"
            values={availableKinds}
            active={kindFilters}
            onToggle={(v) => toggle(kindFilters, v, setKindFilters)}
          />
          <FilterChips
            label="Tags"
            values={availableTags}
            active={tagFilters}
            onToggle={(v) => toggle(tagFilters, v, setTagFilters)}
          />
        </div>
      }
    >
      {authState === 'denied' && (
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-danger-100 text-danger-700 text-sm">
          Authentication required or rejected. Open Settings and set a bearer token.
        </div>
      )}
      <div className="flex h-full min-h-0">
        <div className="flex-1 min-w-0 relative">
          {(nodesQuery.isLoading || graph.isLoading) && (
            <div className="absolute inset-0 flex items-center justify-center text-default-500">
              <Spinner /> <span className="ml-2 text-sm">loading graph</span>
            </div>
          )}
          {graph.data && (
            <GraphCanvas
              data={canvasData}
              onSelect={handleSelect}
              statusStrip={
                <>
                  <span className="truncate">{graph.data.name}</span>
                  <span className="mono">
                    {canvasData.nodes.length} nodes · {canvasData.edges.length} edges
                  </span>
                  <span className="ml-auto">
                    <LiveDot status={sseStatus} />
                  </span>
                </>
              }
            />
          )}
        </div>
        {selectedNode && (
          <NodeDetailDrawer
            node={selectedNode}
            onClose={handleCloseDrawer}
            onNavigate={handleNavigateTo}
          />
        )}
      </div>
    </AppShell>
  );
}
