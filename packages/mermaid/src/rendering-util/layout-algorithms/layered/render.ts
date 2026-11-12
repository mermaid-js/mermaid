// The `layout: layered` renderer: mermaid's common measure → layout → paint pipeline with the
// layered engine as its layout core. Edges come out with axis-tagged route points, so
// `insertEdge` draws them with the shared `routePath`.
//
// If the engine throws, or gets input it cannot lay out, the diagram is drawn by dagre instead,
// a warning says why and the svg gets `data-layout-fallback="dagre"`. The unit tests turn that off (`setLayeredThrowsOnFailure`) so bugs
// fail loudly rather than hiding behind the fallback.
import type { SVG } from '../../../diagram-api/types.js';
import type { InternalHelpers } from '../../../internals.js';
import { log } from '../../../logger.js';
import type { RenderOptions } from '../../render.js';
import type { LayoutData } from '../../types.js';
import {
  clearLayoutRenderState,
  createCommonLayoutRenderer,
  defaultMeasureLayout,
} from '../common/index.js';
import { layeredThrowsOnFailure } from './failureMode.js';
import { runLayeredLayoutCore } from './layoutData.js';

export { setLayeredThrowsOnFailure } from './failureMode.js';

const renderLayered = createCommonLayoutRenderer({
  // The engine sizes a subgraph from its title, so the title is measured as it is painted: on
  // one line, not wrapped at `flowchart.wrappingWidth`.
  measureLayout: (data4Layout, context) =>
    defaultMeasureLayout(data4Layout, context, { unwrapGroupLabels: true }),
  runLayoutCore: runLayeredLayoutCore,
});

interface Snapshot {
  nodes: LayoutData['nodes'];
  edges: LayoutData['edges'];
  copies: Map<object, Record<string, unknown>>;
}

// Copies arrays and plain objects all the way down; anything else (functions, DOM nodes, class
// instances) is kept by reference.
function copyPlain<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(copyPlain) as T;
  }
  if (value !== null && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value) as unknown;
    if (proto === Object.prototype || proto === null) {
      const out: Record<string, unknown> = {};
      for (const [key, v] of Object.entries(value)) {
        if (key === '__proto__') {
          continue;
        }
        out[key] = copyPlain(v);
      }
      return out as T;
    }
  }
  return value;
}

// The layered attempt writes sizes, positions and routes onto the nodes and edges, and may change
// nested fields (`points`, `labelBBox`, style arrays) in place, so each item is copied deeply.
function snapshot(data: LayoutData): Snapshot {
  const copies = new Map<object, Record<string, unknown>>();
  for (const item of [...data.nodes, ...data.edges]) {
    copies.set(item, copyPlain({ ...item }));
  }
  return { nodes: [...data.nodes], edges: [...data.edges], copies };
}

// Puts every item back as it was, keeping each item's identity. The saved copy is copied again so
// the snapshot never shares nested data with what dagre then changes.
function restore(data: LayoutData, { nodes, edges, copies }: Snapshot): void {
  for (const [item, copy] of copies) {
    const target = item as Record<string, unknown>;
    for (const key of Object.keys(target)) {
      if (!(key in copy)) {
        delete target[key];
      }
    }
    Object.assign(target, copyPlain(copy));
  }
  data.nodes = nodes;
  data.edges = edges;
}

export async function render(
  data4Layout: LayoutData,
  svg: SVG,
  helpers?: InternalHelpers,
  options?: RenderOptions
): Promise<void> {
  const before = snapshot(data4Layout);
  try {
    await renderLayered(data4Layout, svg, helpers, options);
  } catch (error) {
    if (layeredThrowsOnFailure()) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    log.warn(`Layered layout failed (${reason}); falling back to dagre.`);
    // Nothing the failed attempt measured or drew may reach dagre.
    restore(data4Layout, before);
    clearLayoutRenderState();
    svg.select('g').selectAll('*').remove();
    // Lets visual tests check that a layered fixture was really drawn by layered.
    svg.attr('data-layout-fallback', 'dagre');
    data4Layout.layoutAlgorithm = 'dagre';
    const dagre = await import('../dagre/index.js');
    await dagre.render(data4Layout, svg, helpers, options);
  }
}
