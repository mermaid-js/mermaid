import type { LayoutData } from '../../types.js';
import { layout as runDomusBrowserLayout } from '../domus/index.js';
import { preloadLibavoidAdapterForLayout } from '../domus/pipeline/libavoidAdapter.js';
import { createEdgeLabelNodes } from '../swimlanes/edgeLabelNodes.js';
import { prepareLayoutForSwimlanes } from '../swimlanes/helpers.js';
import { runSwimlaneLayoutCore } from '../swimlanes/layoutCore.js';
import type { LayoutTestBackend, LayoutTestBackendId, OrthogonalTrace } from './types.js';
import { applyFixtureContentSizesStrict, applyFixtureLabelSizesStrict } from './fixtureSizes.js';
import { injectDomusEdgeLabelNodes } from './domusEdgeLabelInject.js';
import { parseMmdFileToLayoutData } from './parseToLayoutData.js';
import type { DdltFixtureProfile, SizesFixture } from './types.js';

function topUpSwimlaneFlowchartConfig(layout: LayoutData): void {
  const cfg = (layout.config ??= {} as LayoutData['config']);
  const flowchartCfg = ((cfg as { flowchart?: Record<string, unknown> }).flowchart ??= {});
  flowchartCfg.nodeSpacing = (flowchartCfg.nodeSpacing as number | undefined) ?? 40;
  flowchartCfg.rankSpacing = (flowchartCfg.rankSpacing as number | undefined) ?? 100;
}

/**
 * DOMUS orthogonal layout via the same DOM-free entry point the browser calls,
 * including the selective libavoid fallback. `preloadLibavoidAdapterForLayout`
 * loads the WASM runtime (mirrors the browser `measure()` step) so DDLT and the
 * browser stay byte-equivalent. Caller must already have injected label dummy
 * nodes and applied fixture sizes.
 */
export async function runDomusOrthogonalDdlt(
  layout: LayoutData,
  options?: { trace?: OrthogonalTrace }
): Promise<void> {
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'domus';
  await preloadLibavoidAdapterForLayout(layout);
  runDomusBrowserLayout(layout, options as Parameters<typeof runDomusBrowserLayout>[1]);
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
  options?: { trace?: OrthogonalTrace }
): Promise<LayoutData> {
  const layout = await parseMmdFileToLayoutData(mmdPath, { stampFlowchartRendererFields: true });

  if (backendId === 'swimlanes') {
    (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'swimlane';
    runSwimlanesDdlt(layout, sizes);
    return layout;
  }

  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'domus';
  applyFixtureContentSizesStrict(layout, sizes);
  injectDomusEdgeLabelNodes(layout);
  applyFixtureLabelSizesStrict(layout, sizes);
  await runDomusOrthogonalDdlt(layout, options);
  return layout;
}

/** Returns a DOM-free layout runner. `swimlanes` must use `parseApplySizesAndLayout()` (needs fixture sizes mid-pipeline). */
export function getLayoutTestBackend(id: LayoutTestBackendId): LayoutTestBackend {
  if (id === 'domus-orthogonal') {
    return async (layout) => {
      await runDomusOrthogonalDdlt(layout);
    };
  }
  throw new Error(
    'DDLT: getLayoutTestBackend("swimlanes") is not supported — call parseApplySizesAndLayout(..., "swimlanes")'
  );
}

export function backendsForProfile(profile: DdltFixtureProfile): LayoutTestBackendId[] {
  if (profile === 'swimlanes') {
    return ['swimlanes'];
  }
  return ['domus-orthogonal'];
}
