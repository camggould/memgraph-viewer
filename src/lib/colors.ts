// Stable kind -> color mapping. Default plugin uses this to color nodes by
// their kind. Plugins may override per-node via renderNodeAttrs.

const KIND_COLORS: Record<string, string> = {
  fact: '#f59e0b', // warm amber
  decision: '#8b5cf6', // violet
  event: '#3b82f6', // blue
  segment: '#10b981', // emerald
  image_ref: '#ec4899', // pink
  note: '#94a3b8', // slate
};

const PREFIX_COLORS: Array<[string, string]> = [
  ['entity:', '#14b8a6'], // teal
  ['doc.', '#a78bfa'], // doc nodes (default; docs plugin overrides root)
];

const FALLBACK_PALETTE = [
  '#60a5fa',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#a78bfa',
  '#22d3ee',
  '#fb7185',
  '#facc15',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function colorForKind(kind: string): string {
  if (KIND_COLORS[kind]) return KIND_COLORS[kind];
  for (const [prefix, color] of PREFIX_COLORS) {
    if (kind.startsWith(prefix)) return color;
  }
  return FALLBACK_PALETTE[hash(kind) % FALLBACK_PALETTE.length];
}
