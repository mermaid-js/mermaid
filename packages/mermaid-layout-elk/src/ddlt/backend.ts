/**
 * DOM-free ELK layout backend for DDLT.
 *
 * ## Why this lives here and not in `packages/mermaid`
 *
 * `mermaid` does not depend on `@mermaid-js/layout-elk` — the dependency runs
 * the other way. The DDLT harness (fixture discovery, size appliers, the
 * validator) is generic and stays in `mermaid`; the piece that knows how to run
 * ELK belongs on the ELK side, and pulls the harness in via the workspace
 * `mermaid` devDependency.
 *
 * ## The single-pipeline rule
 *
 * DDLT must run the same layout entry point the browser does, or it grades
 * something the browser never produces. The browser's entry is
 * `createCommonLayoutRenderer({ prepareLayout, measureLayout, runLayoutCore })`
 * in `render.ts`, whose three steps are:
 *
 *   1. `prepareLayoutForElk`  — DOM-free
 *   2. `defaultMeasureLayout` — DOM-only; this is the step fixtures replace
 *   3. `runElkLayoutCore`     — DOM-free
 *
 * So the seam is exactly step 2, and this backend calls the real 1 and 3 with
 * captured sizes substituted for 2. Nothing about the layout is reimplemented
 * here. If `render.ts` grows a post-pass, this file has to grow the same call —
 * see the "Single Layout Pipeline" section of the `ddlt` skill.
 */
import type { LayoutData } from 'mermaid';
import {
  measureLayoutWithFixture,
  parseMmdFileToLayoutData,
  type SizesFixture,
} from 'mermaid/src/rendering-util/layout-algorithms/ddlt/index.js';
import { prepareLayoutForElk, runElkLayoutCore } from '../render.js';

/** ELK's default algorithm, matching `layouts.ts`'s `elk` entry. */
export const DEFAULT_ELK_ALGORITHM = 'elk.layered';

const noopLog = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

export interface RunElkDdltOptions {
  /** ELK algorithm id, e.g. `elk.layered` (default) or `elk.rectpacking`. */
  algorithm?: string;
  /**
   * Extra `config.elk` entries merged over what the `.mmd` frontmatter set.
   *
   * This is the knob the configuration sweep turns: everything ELK's root graph
   * reads (`nodePlacementStrategy`, `cycleBreakingStrategy`, `considerModelOrder`
   * …) comes off `data4Layout.config.elk`, so a variant is expressed as a config
   * patch rather than as a fork of `createRootElkGraph`.
   */
  elkConfig?: Record<string, unknown>;
  /** Merged over `config.flowchart` — `nodeSpacing`, `rankSpacing`, `wrappingWidth`. */
  flowchartConfig?: Record<string, unknown>;
  /**
   * Raw ELK root-graph `layoutOptions`, merged last over `createRootElkGraph`'s
   * defaults. This reaches the options that are hardcoded there rather than
   * exposed as `config.elk.*` — spacings, edge routing, node placement — which
   * is most of what is worth sweeping.
   */
  rootLayoutOptions?: Record<string, unknown>;
}

/**
 * Minimal stand-in for the `CommonLayoutRenderContext` the browser builds.
 *
 * `getElkLayoutContext` reads only four things off `helpers`, and none of them
 * touch the DOM: the `common` text helpers, `getConfig`, `interpolateToCurve`,
 * and the logger. `element` is never dereferenced before paint, which this
 * backend does not run.
 */
function createElkDdltContext(
  layout: LayoutData,
  algorithm: string,
  rootLayoutOptions?: Record<string, unknown>
) {
  const config = layout.config as Record<string, unknown>;
  return {
    helpers: {
      common: { lineBreakRegex: /<br\s*\/?>/gi },
      getConfig: () => config,
      // Curve selection only affects paint. Returning the requested curve
      // unchanged keeps `applyElkEdgeRenderData` honest without pulling in d3.
      interpolateToCurve: (curve: unknown) => curve,
      log: noopLog,
    },
    options: { algorithm, rootLayoutOptions },
  } as unknown as Parameters<typeof runElkLayoutCore>[1];
}

/**
 * Run the ELK layout over already-parsed, already-sized `LayoutData`.
 *
 * Mutates `layout` in place, exactly as the browser's `runLayoutCore` does.
 */
export async function runElkDdlt(
  layout: LayoutData,
  options: RunElkDdltOptions = {}
): Promise<void> {
  const algorithm = options.algorithm ?? DEFAULT_ELK_ALGORITHM;
  const config = (layout.config ??= {} as LayoutData['config']) as Record<string, unknown>;

  const elkConfig = (config.elk as Record<string, unknown> | undefined) ?? {};
  config.elk = { ...elkConfig, ...options.elkConfig };

  const flowchartConfig = (config.flowchart as Record<string, unknown> | undefined) ?? {};
  config.flowchart = {
    wrappingWidth: 200,
    ...flowchartConfig,
    ...options.flowchartConfig,
  };

  const context = createElkDdltContext(layout, algorithm, options.rootLayoutOptions);
  // `prepareLayoutForElk` also calls `mermaid.mermaidAPI.setConfig`, which is
  // what the browser does; keeping the call means a config-dependent code path
  // in ELK sees the same state under test as it does in a render.
  const preparedLayout = prepareLayoutForElk(layout, context);
  await runElkLayoutCore(layout, { ...context, preparedLayout });
}

/**
 * Parse a `.mmd`, run the real measure step against captured browser sizes, and
 * run ELK. The DDLT counterpart of one browser render.
 *
 * The measure step is `measureLayoutWithFixture`, NOT the `applyFixture*Sizes`
 * appliers it replaced. Writing sizes straight onto the nodes reproduced only
 * the measure step's numbers, and the ELK adapter depends on more than numbers:
 * every shape assigns `node.intersect` inside its draw function, and without it
 * `computeNodeIntersection` silently falls back to clipping along an arbitrary
 * interior line rather than the shape outline. That graded geometry the browser
 * never produces — 251 hard issues over this corpus against the browser's 36.
 */
export async function parseApplySizesAndRunElk(
  mmdPath: string,
  sizes: SizesFixture,
  options: RunElkDdltOptions = {}
): Promise<LayoutData> {
  const layout = await parseMmdFileToLayoutData(mmdPath, {
    stampFlowchartRendererFields: true,
    // The fixture records what it was captured at, and the shapes read `look`
    // when they build their geometry, so the parse has to agree with it or the
    // handlers construct outlines for a configuration the sizes do not describe.
    siteConfig: {
      theme: sizes.metadata?.theme,
      look: sizes.metadata?.look,
    } as Parameters<typeof parseMmdFileToLayoutData>[1]['siteConfig'],
  });
  (layout as { layoutAlgorithm?: string }).layoutAlgorithm = 'elk';

  // `unwrapGroupLabels` mirrors what `render.ts` passes; see the note there.
  const { unresolvedReads } = await measureLayoutWithFixture(layout, sizes, {
    unwrapGroupLabels: true,
  });
  if (unresolvedReads > 0) {
    // Every box the layout consumes should be fixture-backed, so this is a
    // wiring failure rather than a tolerance: the measure stub's ancestry
    // assumptions have drifted from the render code.
    throw new Error(
      `DDLT measure: ${unresolvedReads} size read(s) for ${mmdPath} matched no fixture entry ` +
        'and were answered 0x0. The JSDOM measure stub is out of step with the render path.'
    );
  }

  await runElkDdlt(layout, options);
  return layout;
}
