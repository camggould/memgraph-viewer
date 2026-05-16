// TypeScript mirrors of memgraph-rest's dto.go. Field names match the JSON
// tags exactly so we never have to remap.

export interface NodeOut {
  id: string;
  graph_id: string;
  lineage_id: string;
  version: number;
  kind: string;
  content: string;
  summary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  freshness_at?: string;
  created_at: string;
  created_by: string;
  superseded_by?: string | null;
  is_current: boolean;
  is_stale: boolean;
  conflicts?: string[];
}

export interface EdgeOut {
  id: string;
  graph_id: string;
  from_lineage: string;
  to_graph: string;
  to_lineage: string;
  kind: string;
  metadata?: Record<string, unknown>;
  ordinal?: number;
  created_at: string;
  created_by: string;
}

export interface SymlinkManifestSummary {
  outbound_count: number;
  inbound_count: number;
}

export interface GraphOut {
  id: string;
  name: string;
  conflict_policy: string;
  kind_whitelist?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  symlink_manifest_summary: SymlinkManifestSummary;
}

export interface GraphRefOut {
  graph_id: string;
  edge_count: number;
}

export interface SymlinkManifestOut {
  outbound: GraphRefOut[];
  inbound: GraphRefOut[];
}

export interface SearchHitOut {
  node: NodeOut;
  snippet?: string;
  score: number;
}

export interface GraphsListOut {
  graphs: GraphOut[];
}

export interface NodesListOut {
  nodes: NodeOut[];
  next_offset: number;
}

export interface EdgesListOut {
  edges: EdgeOut[];
}

export interface HistoryOut {
  versions: NodeOut[];
}

export interface NeighborhoodOut {
  nodes: NodeOut[];
  edges: EdgeOut[];
}

export interface SearchOut {
  hits: SearchHitOut[];
}

export interface InfoOut {
  version: string;
  time: string;
  store: string;
}

export interface ErrorOut {
  error: string;
}

export interface ConflictOut {
  error: string;
  node: NodeOut;
  conflicts: string[];
}
