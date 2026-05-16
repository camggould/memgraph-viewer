import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
  Tab,
  Tabs,
} from '@heroui/react';
import { marked } from 'marked';
import type { ViewerPlugin, NodeData, PluginAPI, SigmaNodeAttrs } from '../registry';
import { DOC_SUBTREE_KINDS, KindDocument, KindHeading, KindList } from './kinds';
import { buildDocTree, treeToMarkdown, type TreeNode } from './markdown';

marked.setOptions({ gfm: true, breaks: false });

function docLabel(node: NodeData): string {
  const head = (node.summary || node.content || 'Untitled').replace(/\s+/g, ' ');
  return `📄 ${head.length > 50 ? head.slice(0, 47) + '...' : head}`;
}

function Outline({ tree }: { tree: TreeNode }) {
  const items: { depth: number; text: string }[] = [];
  const walk = (t: TreeNode, depth: number) => {
    if (t.node.kind === KindHeading) {
      const level = Math.max(
        1,
        Math.min(6, Number((t.node.metadata as Record<string, unknown> | undefined)?.['level']) || 1),
      );
      items.push({ depth: level - 1, text: t.node.content || '(untitled heading)' });
    } else if (t.node.kind === KindList) {
      items.push({ depth, text: '(list)' });
    }
    for (const c of t.children) walk(c, depth + 1);
  };
  for (const c of tree.children) walk(c, 0);
  if (items.length === 0) {
    return <div className="text-default-500 text-sm">No headings or lists in this document.</div>;
  }
  return (
    <ul className="text-sm space-y-1">
      {items.map((it, i) => (
        <li key={i} style={{ marginLeft: `${it.depth * 12}px` }}>
          {it.text}
        </li>
      ))}
    </ul>
  );
}

function RawTree({ tree }: { tree: TreeNode }) {
  const slim = (t: TreeNode): unknown => ({
    kind: t.node.kind,
    lineage_id: t.node.lineage_id,
    version: t.node.version,
    content: t.node.content,
    ordinal: t.ordinal,
    children: t.children.map(slim),
  });
  return (
    <pre className="mono text-xs whitespace-pre-wrap break-words bg-default-100 p-3 rounded">
      {JSON.stringify(slim(tree), null, 2)}
    </pre>
  );
}

function RenderedMarkdown({ tree }: { tree: TreeNode }) {
  // Markdown is sourced from the user's own memgraph deployment; the user is
  // already trusted to author its content. Treat as same-origin authored.
  const html = marked.parse(treeToMarkdown(tree)) as string;
  return <div className="prose-doc" dangerouslySetInnerHTML={{ __html: html }} />;
}

function DocModal({
  node,
  api,
  onClose,
}: {
  node: NodeData;
  api: PluginAPI;
  onClose: () => void;
}) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTree(null);
    setError(null);
    buildDocTree(node.lineage_id, api.api)
      .then((t) => {
        if (!cancelled) setTree(t);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [node.lineage_id, api]);

  const title = node.summary || node.content || 'Untitled';

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          <span className="mono text-xs text-default-500">{node.lineage_id}</span>
        </ModalHeader>
        <ModalBody className="pb-6">
          {error && <div className="text-danger text-sm">Failed to load document: {error}</div>}
          {!tree && !error && (
            <div className="flex items-center gap-2 text-default-500 text-sm">
              <Spinner size="sm" /> Building document tree...
            </div>
          )}
          {tree && (
            <Tabs aria-label="Document views" variant="underlined">
              <Tab key="rendered" title="Rendered">
                <RenderedMarkdown tree={tree} />
              </Tab>
              <Tab key="outline" title="Outline">
                <Outline tree={tree} />
              </Tab>
              <Tab key="raw" title="Raw tree">
                <RawTree tree={tree} />
              </Tab>
            </Tabs>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function DocPanel({ node, api }: { node: NodeData; api: PluginAPI }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-default-600">
        Document node — its subtree is hidden from the graph and rendered as a single page.
      </div>
      <div>
        <Button color="primary" onPress={() => setOpen(true)}>
          Open document
        </Button>
      </div>
      {open && <DocModal node={node} api={api} onClose={() => setOpen(false)} />}
    </div>
  );
}

export const docsPlugin: ViewerPlugin = {
  name: 'docs',
  matches: (node) => node.kind === KindDocument,
  renderNodeAttrs(node): Partial<SigmaNodeAttrs> {
    return {
      label: docLabel(node),
      size: 18,
      color: '#a78bfa',
      type: 'square',
    };
  },
  renderDetailPanel(node, api) {
    return <DocPanel node={node} api={api} />;
  },
};

export const docsSubtreePlugin: ViewerPlugin = {
  name: 'docs-subtree',
  matches: (node) => DOC_SUBTREE_KINDS.has(node.kind),
  shouldHideInGraph: () => true,
};
