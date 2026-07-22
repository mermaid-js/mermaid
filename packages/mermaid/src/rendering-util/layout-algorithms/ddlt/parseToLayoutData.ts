import { readFileSync } from 'node:fs';
import * as configApi from '../../../config.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { LayoutData } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { preprocessDiagram } from '../../../preprocess.js';

export interface ParseToLayoutDataOptions {
  /** When true, stamp `type`, `markers`, spacing like `flowRenderer-v3-unified.ts`. */
  stampFlowchartRendererFields?: boolean;
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
