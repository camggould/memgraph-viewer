# memgraph-viewer

A React SPA for visualizing a [memgraph](https://github.com/camggould/memgraph)
deployment over the REST API exposed by
[memgraph-rest](https://github.com/camggould/memgraph-rest).

> **Most users don't install this directly.** The `memgraph-rest` binary
> bundles a pre-built copy of this viewer and serves it at `GET /`. Install
> memgraph-rest with the one-liner and you have the viewer immediately:
>
> ```sh
> curl -fsSL https://raw.githubusercontent.com/camggould/memgraph-rest/main/install.sh | sh
> memgraph-rest serve --sqlite ~/.memgraph/store.db
> # open http://localhost:8080
> ```
>
> This repo is for **developing the viewer itself** or building a custom
> static deploy.

Sigma.js graph canvas, HeroUI components, Tanstack Query for API state, and
a small plugin system that lets clients (`memgraph-docs`, future
`memgraph-tasks`, etc.) render their own kinds of nodes in a domain-aware
way.

## Screenshots

_(placeholder — add after first deploy)_

## Quick start

You need a running `memgraph-rest` server. The default dev proxy points at
`http://localhost:8080`.

```sh
# in the memgraph-rest repo:
go run ./cmd/memgraph-rest serve --sqlite ./memgraph.db --addr :8080

# in this repo:
npm install
npm run dev
# open http://localhost:5173
```

If `memgraph-rest` is started with `MEMGRAPH_HTTP_TOKEN`, open Settings in
the viewer's top bar and paste the token in.

## Build

```sh
npm run build      # emits ./dist
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
```

The build output (`dist/`) is portable static assets. Drop it into
`memgraph-rest/viewer/static/` to ship the bundled-binary experience —
memgraph-rest already serves that directory via its `embed.FS`.

## UI layout

- **Top bar.** Server URL, store kind, auth lock, settings button.
- **Left sidebar.** Graph list, search input, kind/tag filter chips.
- **Center.** Sigma canvas with a layout selector (ForceAtlas2 / Grid),
  edge-label toggle, reset-zoom button, and a status strip with the SSE
  live dot.
- **Right drawer (on node click).** `kind` badge, lineage id, version,
  freshness/conflict/current chips, and four tabs: Content (plugin-rendered),
  Metadata, Edges, History.

## Plugin system

The viewer renders nodes through a small plugin registry. Each plugin can:

- mark which nodes it claims (`matches`)
- customize how the node looks on the canvas (`renderNodeAttrs`)
- render the right-drawer content tab (`renderDetailPanel`)
- hide nodes from the graph entirely (`shouldHideInGraph`)

Plugins are statically imported and registered in `src/main.tsx`. First
match wins; the catch-all `defaultPlugin` is registered last.

### Worked example: the docs plugin

`memgraph-docs` stores rich-document content as a tree of memgraph nodes
(`doc.document` root, `doc.heading`/`doc.paragraph`/`doc.list`/... children,
linked by `doc.contains` edges with `ordinal` for sibling order). The
included docs plugin (`src/plugins/docs/`) does three things:

1. **Renders the root as a single square node** with a purple color and a
   `📄`-prefixed label.
2. **Hides every other `doc.*` kind from the graph** (`shouldHideInGraph`),
   so a 200-paragraph document doesn't bury the canvas.
3. **In the detail drawer's Content tab**, offers an "Open document" button
   that opens a full-width modal. The modal walks the `doc.contains`
   subtree, materializes a markdown string in the browser, and renders it
   via `marked`. Tabs: **Rendered**, **Outline**, **Raw tree**.

To add your own plugin, copy `src/plugins/default/` as a starting point,
implement `ViewerPlugin`, and `register(...)` it in `main.tsx` BEFORE
`defaultPlugin`.

## Stack

- React 18 + TypeScript (strict)
- Vite
- HeroUI (Tailwind preset)
- Sigma.js + graphology + `@react-sigma/core`
- Tanstack Query
- react-router (data router API)
- marked (docs plugin)

## License

MIT — see `LICENSE`.
