import type { ReactNode } from 'react';
import type { ViewerPlugin, NodeData, SigmaNodeAttrs } from '../registry';
import { colorForKind } from '@/lib/colors';

function labelFor(node: NodeData): string {
  const head = node.summary?.trim() || node.content?.trim() || node.lineage_id;
  const oneLine = head.replace(/\s+/g, ' ');
  return oneLine.length > 60 ? oneLine.slice(0, 57) + '...' : oneLine;
}

const looksCodey = (s: string): boolean =>
  /^[\s]*[{[]/.test(s) || /;\s*$/m.test(s) || /^\s{2,}\S/m.test(s);

function DefaultDetail({ node }: { node: NodeData }): ReactNode {
  const c = node.content ?? '';
  if (looksCodey(c)) {
    return (
      <pre className="mono text-sm whitespace-pre-wrap break-words bg-default-100 p-3 rounded">
        {c}
      </pre>
    );
  }
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{c}</div>
  );
}

export const defaultPlugin: ViewerPlugin = {
  name: 'default',
  matches: () => true,
  renderNodeAttrs(node: NodeData): Partial<SigmaNodeAttrs> {
    return {
      label: labelFor(node),
      size: 10,
      color: colorForKind(node.kind),
      type: 'circle',
    };
  },
  renderDetailPanel(node) {
    return <DefaultDetail node={node} />;
  },
};
