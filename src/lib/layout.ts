import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';

export type LayoutKind = 'forceatlas2' | 'grid';

export function applyLayout(graph: Graph, kind: LayoutKind) {
  if (kind === 'grid') {
    applyGrid(graph);
    return;
  }
  applyForceAtlas2(graph);
}

function applyGrid(graph: Graph) {
  const order = graph.order;
  if (order === 0) return;
  const side = Math.max(1, Math.ceil(Math.sqrt(order)));
  let i = 0;
  graph.forEachNode((node) => {
    const row = Math.floor(i / side);
    const col = i % side;
    graph.setNodeAttribute(node, 'x', col);
    graph.setNodeAttribute(node, 'y', -row);
    i++;
  });
}

function applyForceAtlas2(graph: Graph) {
  if (graph.order === 0) return;
  // Initial random positions if missing — required by forceAtlas2.
  graph.forEachNode((node, attrs) => {
    if (attrs.x == null || attrs.y == null) {
      graph.setNodeAttribute(node, 'x', Math.random());
      graph.setNodeAttribute(node, 'y', Math.random());
    }
  });
  try {
    forceAtlas2.assign(graph, {
      iterations: 100,
      settings: {
        gravity: 1,
        scalingRatio: 10,
        slowDown: 5,
        barnesHutOptimize: graph.order > 200,
      },
    });
  } catch {
    applyGrid(graph);
  }
}
