import { getSubGraphTitleMargins } from '../../../utils/subGraphTitleMargins.js';
import type { LayoutData } from '../../types.js';
import {
  prepareLayoutForDagre,
  runDagreLayoutCore,
  shouldMergeSelfLoopSegments,
} from '../dagre/index.js';
import { runLayeredLayoutCore } from '../layered/layoutData.js';
import { createEdgeLabelNodes } from '../swimlanes/edgeLabelNodes.js';
import { prepareLayoutForSwimlanes } from '../swimlanes/helpers.js';
import { runSwimlaneLayoutCore } from '../swimlanes/layoutCore.js';
import type { LayoutTestBackend, LayoutTestBackendId, OrthogonalTrace } from './types.js';
import {
  applyFixtureContentSizesStrict,
  applyFixtureEdgeLabelSizesStrict,
  applyFixtureGroupTitleSizes,
  applyFixtureLabelSizesStrict,
} from './fixtureSizes.js';
import { parseMmdFileToLayoutData } from './parseToLayoutData.js';
import type { DdltFixtureProfile, SizesFixture } from './types.js';

/**
 * The `domus-orthogonal` backend is not available on this branch — the domus
 * subtree (`../domus/`) lands on its own branch. The swimlane-improve-loop
 * only exercises the `'swimlanes'` backend path. When domus merges, replace
 * this stub with the byte-equivalent pair (`runDomusBrowserLayout`,
 * `preloadLibavoidAdapterForLayout`, `injectDomusEdgeLabelNodes`).
 */
function domusBackendUnavailable(): never {
  throw new Error(
    "DDLT: domus-orthogonal backend not available on this branch — use 'swimlanes', 'layered' or 'dagre'"
  );
}

/**
 * Thrown when a backend cannot reproduce the browser layout of a fixture without a DOM. The
 * sweep reports such fixtures as unsupported for that backend instead of scoring them.
 */
export class DdltUnsupportedFixtureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DdltUnsupportedFixtureError';
  }
}

export interface ParseApplySizesAndLayoutOptions {
  trace?: OrthogonalTrace;
  /**
   * Config applied over the fixture's own frontmatter before parsing, e.g.
   * `{ layered: { edgeRouting: 'stepped' } }` (see `ParseToLayoutDataOptions.config`).
   */
  config?: Record<string, unknown>;
}

function topUpSwimlaneFlowchartConfig(layout: LayoutData): void {
  const cfg = (layout.config ??= {} as LayoutData['config']);
  const flowchartCfg = ((cfg as { flowchart?: Record<string, unknown> }).flowchart ??= {});
  flowchartCfg.nodeSpacing = (flowchartCfg.nodeSpacing as number | undefined) ?? 40;
  flowchartCfg.rankSpacing = (flowchartCfg.rankSpacing as number | undefined) ?? 100;
}

/**
 * DOMUS orthogonal routing + overlay finalize. **Not available on this branch.**
 * Throws on call so any accidental usage of the domus backend surfaces as a
 * loud error rather than a silent no-op.
 */
export async function runDomusOrthogonalDdlt(
  _layout: LayoutData,
  _options?: { trace?: OrthogonalTrace }
): Promise<void> {
  domusBackendUnavailable();
}

/**
 * Swimlanes pipeline (mirrors `swimlanes/query-process.ddlt.spec.ts`).
 * Mutates `layout` to hold the finished `LayoutData` from the swimlanes subgraph.
 */
export function runSwimlanesDdlt(layout: LayoutData, sizes: SizesFixture): void {
  topUpSwimlaneFlowchartConfig(layout);
  prepareLayoutForSwimlanes(layout);
  applyFixtureContentSizesStrict(layout, sizes);

  const out = createEdgeLabelNodes(layout);
  (out as LayoutData & { direction?: string }).direction = (
    layout as LayoutData & { direction?: string }
  ).direction;
  applyFixtureLabelSizesStrict(out, sizes);

  const direction = runSwimlaneLayoutCore(out);

  layout.nodes = out.nodes;
  layout.edges = out.edges;
  layout.config = out.config;
  (layout as LayoutData & { direction?: string }).direction = direction;
}

/**
 * The size step shared by every backend that measures on the `LayoutData` itself (`layered`,
 * `dagre`): content sizes onto leaf nodes, centre-label sizes onto labelled edges and, where the
 * fixture has them, title sizes onto subgraphs. This stands in for `createGraphWithElements` /
 * dagre's measure in the browser.
 */
export function applyMeasuredSizes(layout: LayoutData, sizes: SizesFixture): void {
  applyFixtureContentSizesStrict(layout, sizes);
  applyFixtureEdgeLabelSizesStrict(layout, sizes);
  applyFixtureGroupTitleSizes(layout, sizes);
}

/**
 * `layout: layered`: the same layout core the browser renderer runs (`layered/render.ts` hands
 * `runLayeredLayoutCore` to the common renderer). Expects sizes already applied.
 */
export function runLayeredDdlt(layout: LayoutData): void {
  layout.layoutAlgorithm = 'layered';
  runLayeredLayoutCore(layout);
}

/**
 * `layout: dagre`: the browser's prepare and layout core (`prepareLayoutForDagre`,
 * `runDagreLayoutCore`), with the DOM measure replaced by the sizes already on `layout`.
 *
 * Subgraphs that dagre renders recursively (`clusterNode`: no edges cross their border) are
 * laid out during the browser's measure, in their own coordinates, and sized from the painted
 * DOM; that cannot be reproduced without a DOM, so such fixtures throw
 * {@link DdltUnsupportedFixtureError}.
 */
export function runDagreDdlt(layout: LayoutData): void {
  layout.layoutAlgorithm = 'dagre';
  const prepared = prepareLayoutForDagre(layout) as {
    graph: {
      nodes: () => string[];
      node: (id: string) => { clusterNode?: boolean } | undefined;
    };
    measuredLayout?: unknown;
  };
  const recursive = prepared.graph.nodes().filter((id) => prepared.graph.node(id)?.clusterNode);
  if (recursive.length > 0) {
    throw new DdltUnsupportedFixtureError(
      `DDLT dagre: subgraph(s) ${recursive.join(', ')} are laid out recursively during the DOM measure`
    );
  }
  // From the layout's own config, as the layered side reads it.
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins(
    (layout.config ?? {}) as Parameters<typeof getSubGraphTitleMargins>[0]
  );
  // What `measureDagreLayout` leaves for the core, minus the DOM groups (paint-only).
  prepared.measuredLayout = {
    graph: prepared.graph,
    diagramType: layout.type,
    id: layout.diagramId,
    mergeSelfLoops: shouldMergeSelfLoopSegments(layout.type),
    subGraphTitleTotalMargin,
  };
  runDagreLayoutCore(layout, { preparedLayout: prepared });
}

/**
 * Parse `.mmd`, apply fixture sizes, then run the given backend (mutates returned `LayoutData`).
 * `layered` and `dagre` share one parse + size path so they see identical inputs;
 * `'domus-orthogonal'` throws.
 */
export async function parseApplySizesAndLayout(
  mmdPath: string,
  sizes: SizesFixture,
  backendId: LayoutTestBackendId,
  options: ParseApplySizesAndLayoutOptions = {}
): Promise<LayoutData> {
  if (backendId === 'domus-orthogonal') {
    domusBackendUnavailable();
  }
  const layout = await parseMmdFileToLayoutData(mmdPath, {
    stampRendererFields: true,
    config: options.config,
  });
  if (backendId === 'swimlanes') {
    layout.layoutAlgorithm = 'swimlane';
    runSwimlanesDdlt(layout, sizes);
    return layout;
  }
  applyMeasuredSizes(layout, sizes);
  if (backendId === 'layered') {
    runLayeredDdlt(layout);
  } else {
    runDagreDdlt(layout);
  }
  return layout;
}

/**
 * Returns a DOM-free layout runner for `LayoutData` that already carries its sizes. `swimlanes`
 * must use `parseApplySizesAndLayout()` (needs fixture sizes mid-pipeline); `domus-orthogonal`
 * throws.
 */
export function getLayoutTestBackend(id: LayoutTestBackendId): LayoutTestBackend {
  switch (id) {
    case 'layered':
      return runLayeredDdlt;
    case 'dagre':
      return runDagreDdlt;
    default:
      return domusBackendUnavailable();
  }
}

export function backendsForProfile(profile: DdltFixtureProfile): LayoutTestBackendId[] {
  if (profile === 'swimlanes') {
    return ['swimlanes'];
  }
  return ['domus-orthogonal'];
}
