import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export function useInfo() {
  return useQuery({ queryKey: ['info'], queryFn: () => api.getInfo() });
}

export function useGraphs() {
  return useQuery({ queryKey: ['graphs'], queryFn: () => api.listGraphs() });
}

export function useGraph(id: string | undefined) {
  return useQuery({
    queryKey: ['graph', id],
    queryFn: () => api.getGraph(id!),
    enabled: !!id,
  });
}

export function useGraphNodes(
  id: string | undefined,
  params: { kinds?: string[]; tags?: string[]; limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: ['graph-nodes', id, params],
    queryFn: () => api.listNodes(id!, params),
    enabled: !!id,
  });
}

export function useNode(lineageId: string | undefined, version?: number) {
  return useQuery({
    queryKey: ['node', lineageId, version],
    queryFn: () => api.getNode(lineageId!, version != null ? { version } : undefined),
    enabled: !!lineageId,
  });
}

export function useHistory(lineageId: string | undefined) {
  return useQuery({
    queryKey: ['history', lineageId],
    queryFn: () => api.getHistory(lineageId!),
    enabled: !!lineageId,
  });
}

export function useOutgoing(lineageId: string | undefined, kinds?: string[]) {
  return useQuery({
    queryKey: ['outgoing', lineageId, kinds],
    queryFn: () => api.getOutgoing(lineageId!, kinds),
    enabled: !!lineageId,
  });
}

export function useIncoming(lineageId: string | undefined, kinds?: string[]) {
  return useQuery({
    queryKey: ['incoming', lineageId, kinds],
    queryFn: () => api.getIncoming(lineageId!, kinds),
    enabled: !!lineageId,
  });
}

export function useNeighborhood(
  lineageId: string | undefined,
  params: { depth?: number; kinds?: string[]; follow_symlinks?: boolean; max_nodes?: number } = {},
) {
  return useQuery({
    queryKey: ['neighborhood', lineageId, params],
    queryFn: () => api.getNeighborhood(lineageId!, params),
    enabled: !!lineageId,
  });
}

export function useSearch(
  graphId: string | undefined,
  q: string,
  params: { kinds?: string[]; tags?: string[]; fresh_only?: boolean; limit?: number } = {},
) {
  return useQuery({
    queryKey: ['search', graphId, q, params],
    queryFn: () => api.search(graphId!, { q, ...params }),
    enabled: !!graphId && q.trim().length > 0,
  });
}
