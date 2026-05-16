// Re-exports of memgraph-docs kind constants. Kept literally in sync with
// memgraph-docs/kinds.go.

export const KindDocument = 'doc.document';
export const KindHeading = 'doc.heading';
export const KindParagraph = 'doc.paragraph';
export const KindList = 'doc.list';
export const KindListItem = 'doc.list_item';
export const KindCodeBlock = 'doc.code_block';
export const KindQuote = 'doc.quote';
export const KindMedia = 'doc.media';
export const KindDivider = 'doc.divider';

export const EdgeContains = 'doc.contains';

export const DOC_KINDS = new Set<string>([
  KindDocument,
  KindHeading,
  KindParagraph,
  KindList,
  KindListItem,
  KindCodeBlock,
  KindQuote,
  KindMedia,
  KindDivider,
]);

export const DOC_SUBTREE_KINDS = new Set<string>([
  KindHeading,
  KindParagraph,
  KindList,
  KindListItem,
  KindCodeBlock,
  KindQuote,
  KindMedia,
  KindDivider,
]);
