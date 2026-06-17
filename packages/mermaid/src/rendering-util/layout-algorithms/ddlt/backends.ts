import type { LayoutData } from '../../types.js';
import { createEdgeLabelNodes } from '../swimlanes/edgeLabelNodes.js';
import { prepareLayoutForSwimlanes } from '../swimlanes/helpers.js';
import { runSwimlaneLayoutCore } from '../swimlanes/layoutCore.js';
import type { LayoutTestBackend, LayoutTestBackendId, OrthogonalTrace } from './types.js';
import { applyFixtureContentSizesStrict, applyFixtureLabelSizesStrict } from './fixtureSizes.js';
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
    "DDLT: domus-orthogonal backend not available on this branch — only 'swimlanes' is supported"
  );
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
 * Parse `.mmd`, apply fixture sizes, then run the given backend (mutates returned `LayoutData`).
 * Only `'swimlanes'` is supported on this branch; `'domus-orthogonal'` throws.
 */
export async function parseApplySizesAndLayout(
  mmdPath: string,
  sizes: SizesFixture,
  backendId: LayoutTestBackendId,
  _options?: { trace?: OrthogonalTrace }
): Promise<LayoutData> {
  if (backendId !== 'swimlanes') {
    domusBackendUnavailable();
  }
  const layout = await parseMmdFileToLayoutData(mmdPath, { stampFlowchartRendererFields: true });
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'swimlane';
  runSwimlanesDdlt(layout, sizes);
  return layout;
}

/** Returns a DOM-free layout runner. `swimlanes` must use `parseApplySizesAndLayout()` (needs fixture sizes mid-pipeline); `domus-orthogonal` throws. */
export function getLayoutTestBackend(_id: LayoutTestBackendId): LayoutTestBackend {
  domusBackendUnavailable();
}

export function backendsForProfile(profile: DdltFixtureProfile): LayoutTestBackendId[] {
  if (profile === 'swimlanes') {
    return ['swimlanes'];
  }
  return ['domus-orthogonal'];
}
