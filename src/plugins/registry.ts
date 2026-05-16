import type { ReactNode } from 'react';
import type { ApiClient } from '@/api/client';
import type { NodeOut } from '@/api/types';

export type NodeData = NodeOut;

export interface SigmaNodeAttrs {
  label?: string;
  size?: number;
  color?: string;
  type?: 'circle' | 'square' | 'triangle';
  image?: string;
}

export interface PluginAPI {
  api: ApiClient;
  navigate(lineageId: string): void;
  close(): void;
}

export interface ViewerPlugin {
  name: string;
  matches(node: NodeData): boolean;
  renderNodeAttrs?(node: NodeData): Partial<SigmaNodeAttrs>;
  renderDetailPanel?(node: NodeData, api: PluginAPI): ReactNode;
  shouldHideInGraph?(node: NodeData): boolean;
}

const registry: ViewerPlugin[] = [];

export function register(p: ViewerPlugin) {
  registry.push(p);
}

// First match wins. The default plugin must be registered LAST so it acts
// as the catch-all fallback.
export function resolvePlugin(node: NodeData): ViewerPlugin | undefined {
  for (const p of registry) {
    if (p.matches(node)) return p;
  }
  return undefined;
}

export function shouldHideInGraph(node: NodeData): boolean {
  for (const p of registry) {
    if (p.matches(node)) {
      return p.shouldHideInGraph?.(node) === true;
    }
  }
  return false;
}

export function listPlugins(): ReadonlyArray<ViewerPlugin> {
  return registry;
}
