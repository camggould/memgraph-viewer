import { useEffect, useMemo, useState } from 'react';
import Graph, { MultiDirectedGraph } from 'graphology';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/react-sigma.min.css';
import { Button, Select, SelectItem } from '@heroui/react';
import type { EdgeOut, NodeOut } from '@/api/types';
import { resolvePlugin, shouldHideInGraph } from '@/plugins/registry';
import { defaultPlugin } from '@/plugins/default';
import { applyLayout, type LayoutKind } from '@/lib/layout';
import { colorForKind } from '@/lib/colors';

export interface CanvasGraph {
  nodes: NodeOut[];
  edges: EdgeOut[];
}

function buildGraphology(input: CanvasGraph, layout: LayoutKind, showEdgeLabels: boolean): Graph {
  // MultiDirectedGraph: directed (memgraph edges are from→to) AND multi (the
  // same node pair can be linked by multiple typed edges, e.g. `cites` AND
  // `supports`). Must match the class passed to <SigmaContainer graph={}>
  // below — useLoadGraph imports across mismatched types and fails otherwise.
  const g = new MultiDirectedGraph();
  const visible = new Set<string>();
  for (const n of input.nodes) {
    if (shouldHideInGraph(n)) continue;
    const plugin = resolvePlugin(n) ?? defaultPlugin;
    const attrs = plugin.renderNodeAttrs?.(n) ?? {};
    g.addNode(n.lineage_id, {
      label: attrs.label ?? n.summary ?? n.content ?? n.lineage_id,
      size: attrs.size ?? 10,
      color: attrs.color ?? colorForKind(n.kind),
      type: attrs.type ?? 'circle',
      x: Math.random(),
      y: Math.random(),
      nodeData: n,
    });
    visible.add(n.lineage_id);
  }
  for (const e of input.edges) {
    if (!visible.has(e.from_lineage) || !visible.has(e.to_lineage)) continue;
    if (g.hasEdge(e.id)) continue;
    try {
      g.addDirectedEdgeWithKey(e.id, e.from_lineage, e.to_lineage, {
        label: showEdgeLabels ? e.kind : '',
        size: 1,
        color: '#52525b',
        type: 'arrow',
      });
    } catch {
      // dup edge id; ignore
    }
  }
  applyLayout(g, layout);
  return g;
}

function LoadGraph({
  data,
  layout,
  showEdgeLabels,
}: {
  data: CanvasGraph;
  layout: LayoutKind;
  showEdgeLabels: boolean;
}) {
  const loadGraph = useLoadGraph();
  useEffect(() => {
    const g = buildGraphology(data, layout, showEdgeLabels);
    loadGraph(g);
  }, [data, layout, showEdgeLabels, loadGraph]);
  return null;
}

function GraphEvents({
  onSelect,
}: {
  onSelect: (node: NodeOut) => void;
}) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  useEffect(() => {
    registerEvents({
      clickNode: (e) => {
        const attrs = sigma.getGraph().getNodeAttributes(e.node);
        const nd = attrs.nodeData as NodeOut | undefined;
        if (nd) onSelect(nd);
      },
    });
  }, [registerEvents, sigma, onSelect]);
  return null;
}

function ResetZoom() {
  const sigma = useSigma();
  return (
    <Button
      size="sm"
      variant="flat"
      onPress={() => {
        const camera = sigma.getCamera();
        camera.animatedReset({ duration: 200 });
      }}
    >
      Reset
    </Button>
  );
}

export function GraphCanvas({
  data,
  onSelect,
  statusStrip,
}: {
  data: CanvasGraph;
  onSelect: (node: NodeOut) => void;
  statusStrip?: React.ReactNode;
}) {
  const [layout, setLayout] = useState<LayoutKind>('forceatlas2');
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);

  const settings = useMemo(
    () => ({
      renderLabels: true,
      labelDensity: 0.7,
      labelSize: 11,
      labelColor: { color: '#d4d4d8' },
      defaultEdgeColor: '#52525b',
      defaultNodeColor: '#60a5fa',
    }),
    [],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 h-10 border-b border-divider bg-content1">
        <Select
          aria-label="Layout"
          size="sm"
          selectedKeys={[layout]}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as LayoutKind;
            if (v) setLayout(v);
          }}
          className="max-w-[180px]"
        >
          <SelectItem key="forceatlas2">ForceAtlas2</SelectItem>
          <SelectItem key="grid">Grid</SelectItem>
        </Select>
        <Button
          size="sm"
          variant={showEdgeLabels ? 'solid' : 'flat'}
          onPress={() => setShowEdgeLabels((v) => !v)}
        >
          Edge labels
        </Button>
        <div className="ml-auto" />
      </div>
      <div className="flex-1 relative">
        <SigmaContainer
          className="sigma-container"
          graph={MultiDirectedGraph}
          settings={settings}
          style={{ background: 'transparent' }}
        >
          <LoadGraph data={data} layout={layout} showEdgeLabels={showEdgeLabels} />
          <GraphEvents onSelect={onSelect} />
          <div className="absolute top-2 right-2 z-10">
            <ResetZoom />
          </div>
        </SigmaContainer>
      </div>
      {statusStrip && (
        <div className="h-8 px-3 flex items-center text-xs text-default-500 border-t border-divider bg-content1 gap-3">
          {statusStrip}
        </div>
      )}
    </div>
  );
}
