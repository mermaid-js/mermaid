// The `layout: layered` renderer: mermaid's common measure → layout → paint pipeline with the
// layered engine as its layout core. Edges come out with axis-tagged route points, so
// `insertEdge` draws them with the shared `routePath`.
//
// If the engine throws, or gets input it cannot lay out, the diagram is drawn by dagre instead
// and a warning says why. The unit tests turn that off (`setLayeredThrowsOnFailure`) so bugs
// fail loudly rather than hiding behind the fallback.
import type { SVG } from '../../../diagram-api/types.js';
import type { InternalHelpers } from '../../../internals.js';
import { log } from '../../../logger.js';
import type { RenderOptions } from '../../render.js';
import type { LayoutData } from '../../types.js';
import { clearLayoutRenderState, createCommonLayoutRenderer } from '../common/index.js';
import { layeredThrowsOnFailure } from './failureMode.js';
import { runLayeredLayoutCore } from './layoutData.js';

export { setLayeredThrowsOnFailure } from './failureMode.js';

const renderLayered = createCommonLayoutRenderer({
  runLayoutCore: runLayeredLayoutCore,
});

interface Snapshot {
  nodes: LayoutData['nodes'];
  edges: LayoutData['edges'];
  copies: Map<object, Record<string, unknown>>;
}

// The layered attempt writes sizes, positions and routes onto the nodes and edges in place.
function snapshot(data: LayoutData): Snapshot {
  const copies = new Map<object, Record<string, unknown>>();
  for (const item of [...data.nodes, ...data.edges]) {
    copies.set(item, { ...item });
  }
  return { nodes: [...data.nodes], edges: [...data.edges], copies };
}

function restore(data: LayoutData, { nodes, edges, copies }: Snapshot): void {
  for (const [item, copy] of copies) {
    const target = item as Record<string, unknown>;
    for (const key of Object.keys(target)) {
      if (!(key in copy)) {
        delete target[key];
      }
    }
    Object.assign(target, copy);
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
    data4Layout.layoutAlgorithm = 'dagre';
    const dagre = await import('../dagre/index.js');
    await dagre.render(data4Layout, svg, helpers, {});
  }
}
