import { readFileSync } from 'node:fs';
import * as configApi from '../../../config.js';
import type { MermaidConfig } from '../../../config.type.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { LayoutData } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { preprocessDiagram } from '../../../preprocess.js';

export interface ParseToLayoutDataOptions {
  /** When true, stamp `type`, `markers`, spacing like `flowRenderer-v3-unified.ts`. */
  stampFlowchartRendererFields?: boolean;
  /**
   * Site config applied before parsing, i.e. what `mermaid.initialize` would
   * have set in the browser.
   *
   * Needed for `theme` and `look`: the diagram DB stamps `look` onto every node
   * at `getData()` time, and shape geometry depends on it. A fixture captured at
   * `look: 'neo'` therefore only reproduces if the parse ran with the same value.
   */
  siteConfig?: MermaidConfig;
}

/**
 * Parse a `.mmd` file through the real diagram pipeline (preprocess → Diagram.fromText → getData).
 * Mirrors production flowchart hand-off; callers should set `direction` / `layoutAlgorithm` as needed.
 */
export async function parseMmdFileToLayoutData(
  mmdPath: string,
  options: ParseToLayoutDataOptions = {}
): Promise<LayoutData> {
  const mmdText = readFileSync(mmdPath, 'utf-8');
  const { code, config } = preprocessDiagram(mmdText);
  // `reset()` restores the site config, so the site config has to be in place
  // first; the diagram's own directives then layer on top, exactly as in a
  // browser render where `initialize` precedes `render`.
  //
  // `setSiteConfig`, not `saveConfigFromInitialize` — the latter only stashes
  // the object for later retrieval and never reaches `siteConfig`, so `reset()`
  // would drop it and the parse would silently run at the default `look`.
  if (options.siteConfig) {
    configApi.setSiteConfig(options.siteConfig);
  }
  configApi.reset();
  configApi.addDirective(config ?? {});
  const diagram = await Diagram.fromText(code);
  const layoutData = (diagram.db as { getData: () => LayoutData }).getData();

  const getDirection = (diagram.db as { getDirection?: () => string }).getDirection;
  const direction = getDirection?.call(diagram.db) ?? 'TB';
  (layoutData as LayoutData & { direction?: string }).direction = direction;

  if (options.stampFlowchartRendererFields) {
    const conf = getConfig().flowchart;
    layoutData.type = diagram.type;
    layoutData.nodeSpacing = conf?.nodeSpacing ?? 50;
    layoutData.rankSpacing = conf?.rankSpacing ?? 50;
    layoutData.markers = ['point', 'circle', 'cross'];
  }

  return layoutData;
}
