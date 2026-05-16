import type { ApiClient } from '@/api/client';
import type { EdgeOut, NodeOut } from '@/api/types';
import {
  EdgeContains,
  KindCodeBlock,
  KindDivider,
  KindHeading,
  KindList,
  KindListItem,
  KindMedia,
  KindParagraph,
  KindQuote,
} from './kinds';

export interface TreeNode {
  node: NodeOut;
  children: TreeNode[];
  ordinal?: number;
}

const orderEdges = (edges: EdgeOut[]): EdgeOut[] =>
  [...edges].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));

async function buildTree(
  rootId: string,
  api: ApiClient,
  visited = new Set<string>(),
  depthBudget = 200,
): Promise<TreeNode> {
  const node = await api.getNode(rootId);
  const tree: TreeNode = { node, children: [] };
  if (visited.has(node.lineage_id) || depthBudget <= 0) return tree;
  visited.add(node.lineage_id);
  const edgesRes = await api.getOutgoing(node.lineage_id, [EdgeContains]);
  for (const e of orderEdges(edgesRes.edges)) {
    if (visited.has(e.to_lineage)) continue;
    const child = await buildTree(e.to_lineage, api, visited, depthBudget - 1);
    child.ordinal = e.ordinal;
    tree.children.push(child);
  }
  return tree;
}

function escapeFenceLanguage(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s.replace(/[^A-Za-z0-9_+\-#.]/g, '');
}

function renderList(tree: TreeNode, depth: number, out: string[]) {
  const ordered = !!(tree.node.metadata as Record<string, unknown> | undefined)?.['ordered'];
  let i = 1;
  for (const child of tree.children) {
    if (child.node.kind !== KindListItem) {
      // Tolerate stray children — just render them inline.
      renderTree(child, depth + 1, out);
      continue;
    }
    const indent = '  '.repeat(depth);
    const prefix = ordered ? `${i}. ` : '- ';
    const text = (child.node.content || '').replace(/\n+/g, ' ');
    out.push(`${indent}${prefix}${text}\n`);
    for (const nested of child.children) {
      if (nested.node.kind === KindList) {
        renderList(nested, depth + 1, out);
      } else {
        renderTree(nested, depth + 1, out);
      }
    }
    i++;
  }
  out.push('\n');
}

function renderMedia(node: NodeOut, out: string[]) {
  const md = (node.metadata ?? {}) as Record<string, unknown>;
  const src = typeof md.src === 'string' ? md.src : '';
  const alt = typeof md.alt === 'string' ? md.alt : node.content || '';
  const mediaKind = typeof md.kind === 'string' ? md.kind : 'file';
  if (!src) {
    if (node.content) out.push(`${node.content}\n\n`);
    return;
  }
  if (mediaKind === 'image') {
    out.push(`![${alt}](${src})\n\n`);
    if (node.content) out.push(`*${node.content}*\n\n`);
  } else {
    const label = node.content || alt || src;
    out.push(`[${label}](${src})\n\n`);
  }
}

function renderTree(tree: TreeNode, depth: number, out: string[]) {
  const n = tree.node;
  switch (n.kind) {
    case KindHeading: {
      const level = Math.max(
        1,
        Math.min(6, Number((n.metadata as Record<string, unknown> | undefined)?.['level']) || 1),
      );
      out.push(`${'#'.repeat(level)} ${n.content || ''}\n\n`);
      break;
    }
    case KindParagraph:
      if (n.content) out.push(`${n.content}\n\n`);
      break;
    case KindCodeBlock: {
      const lang = escapeFenceLanguage(
        (n.metadata as Record<string, unknown> | undefined)?.['language'],
      );
      out.push('```' + lang + '\n' + (n.content || '') + '\n```\n\n');
      break;
    }
    case KindQuote:
      out.push(
        (n.content || '')
          .split('\n')
          .map((l) => `> ${l}`)
          .join('\n') + '\n\n',
      );
      break;
    case KindDivider:
      out.push('---\n\n');
      break;
    case KindMedia:
      renderMedia(n, out);
      break;
    case KindList:
      renderList(tree, depth, out);
      return; // renderList already walked children
    case KindListItem:
      // Free-standing list item (no surrounding list) — render as a bullet.
      out.push(`- ${n.content || ''}\n\n`);
      break;
    default:
      if (n.content) out.push(`${n.content}\n\n`);
  }
  for (const child of tree.children) {
    if (child.node.kind === KindList) {
      renderList(child, depth + 1, out);
    } else {
      renderTree(child, depth + 1, out);
    }
  }
}

export async function buildDocTree(rootLineageId: string, api: ApiClient): Promise<TreeNode> {
  return buildTree(rootLineageId, api);
}

export function treeToMarkdown(tree: TreeNode): string {
  const out: string[] = [];
  out.push(`# ${tree.node.content || tree.node.summary || 'Untitled'}\n\n`);
  const md = (tree.node.metadata ?? {}) as Record<string, unknown>;
  if (typeof md.author === 'string' && md.author) {
    out.push(`*by ${md.author}*\n\n`);
  }
  if (typeof md.abstract === 'string' && md.abstract) {
    out.push(`> ${md.abstract}\n\n`);
  }
  for (const child of tree.children) {
    if (child.node.kind === KindList) {
      renderList(child, 0, out);
    } else {
      renderTree(child, 0, out);
    }
  }
  return out.join('');
}

export async function renderDocMarkdown(rootLineageId: string, api: ApiClient): Promise<string> {
  const tree = await buildDocTree(rootLineageId, api);
  return treeToMarkdown(tree);
}
