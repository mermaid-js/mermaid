import type { LayoutData } from '../../types.js';
import { layout as runDomusBrowserLayout } from '../domus/index.js';
import { injectHolaEdgeLabelNodes } from '../hola/injectEdgeLabelNodes.js';
import { runHolaLayoutCore } from '../hola/layoutCore.js';
import { runHolaFaithfulLayoutCore } from '../hola-faithful/layoutCore.js';
import { createEdgeLabelNodes } from '../swimlanes/edgeLabelNodes.js';
import { prepareLayoutForSwimlanes } from '../swimlanes/helpers.js';
import { runSwimlaneLayoutCore } from '../swimlanes/layoutCore.js';
import type { LayoutTestBackend, LayoutTestBackendId, OrthogonalTrace } from './types.js';
import { applyFixtureContentSizesStrict, applyFixtureLabelSizesStrict } from './fixtureSizes.js';
import { injectDomusEdgeLabelNodes } from '../domus/injectEdgeLabelNodes.js';
import { parseMmdFileToLayoutData } from './parseToLayoutData.js';
import type { DdltFixtureProfile, SizesFixture } from './types.js';

function topUpSwimlaneFlowchartConfig(layout: LayoutData): void {
  const cfg = (layout.config ??= {} as LayoutData['config']);
  const flowchartCfg = ((cfg as { flowchart?: Record<string, unknown> }).flowchart ??= {});
  flowchartCfg.nodeSpacing = (flowchartCfg.nodeSpacing as number | undefined) ?? 40;
  flowchartCfg.rankSpacing = (flowchartCfg.rankSpacing as number | undefined) ?? 100;
}

/**
 * DOMUS orthogonal layout via the same DOM-free entry point the browser calls.
 * Caller must already have injected label dummy nodes and applied fixture sizes
 * when using DDLT.
 */
export async function runDomusOrthogonalDdlt(
  layout: LayoutData,
  _options?: { trace?: OrthogonalTrace }
): Promise<void> {
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'domus';
  runDomusBrowserLayout(layout);
}

/**
 * HOLA layout via the same DOM-free entry point the browser calls
 * (`runHolaLayoutCore` — see its docstring: "DOM-free by contract"). Caller
 * must already have injected label dummy nodes and applied fixture sizes.
 */
export function runHolaOrthogonalDdlt(layout: LayoutData): void {
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'hola';
  runHolaLayoutCore(layout);
}

/**
 * Faithful HOLA via the same DOM-free entry point the browser calls.
 *
 * Note the deliberate difference from the `hola-orthogonal` backend: this
 * layout never turns an edge label into a node, so the caller applies label
 * sizes to `edge.width/height` (what `insertEdgeLabel` sets in the browser)
 * rather than injecting label dummies.
 */
export function runHolaFaithfulDdlt(layout: LayoutData): void {
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'hola-faithful';
  runHolaFaithfulLayoutCore(layout);
}

/**
 * Apply fixture label sizes to the edges themselves.
 *
 * Sizes fixtures are captured from a pipeline that injects `edge-label-*`
 * dummy nodes, so the label entry is keyed by that dummy's id. Recreate the id
 * to find it; fall back to matching on the edge id so a fixture captured by a
 * different injector still lines up.
 */
export function applyFixtureEdgeLabelSizes(layout: LayoutData, fixture: SizesFixture): void {
  for (const edge of layout.edges) {
    if (!edge.label) {
      continue;
    }
    const holaId = `edge-label-${edge.start}-${edge.end}-${edge.id}`;
    const size =
      fixture.nodes.find((n) => n.id === holaId) ??
      fixture.nodes.find((n) => n.id.startsWith('edge-label-') && n.id.endsWith(edge.id));
    if (!size) {
      continue;
    }
    edge.width = size.width;
    edge.height = size.height;
  }
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

  if (backendId === 'hola-faithful') {
    (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'hola-faithful';
    applyFixtureContentSizesStrict(layout, sizes);
    applyFixtureEdgeLabelSizes(layout, sizes);
    runHolaFaithfulDdlt(layout);
    return layout;
  }

  if (backendId === 'hola-orthogonal') {
    (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'hola';
    applyFixtureContentSizesStrict(layout, sizes);
    injectHolaEdgeLabelNodes(layout);
    applyFixtureLabelSizesStrict(layout, sizes);
    runHolaOrthogonalDdlt(layout);
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
    return (layout) => {
      void runDomusOrthogonalDdlt(layout);
    };
  }
  if (id === 'hola-orthogonal') {
    return (layout) => {
      runHolaOrthogonalDdlt(layout);
    };
  }
  if (id === 'hola-faithful') {
    return (layout) => {
      runHolaFaithfulDdlt(layout);
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
  if (profile === 'flowchart-hola') {
    return ['hola-orthogonal'];
  }
  if (profile === 'flowchart-hola-faithful') {
    return ['hola-faithful'];
  }
  return ['domus-orthogonal'];
}
