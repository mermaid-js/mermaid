import { readFileSync } from 'node:fs';
import assignWithDepth from '../../../assignWithDepth.js';
import * as configApi from '../../../config.js';
import type { MermaidConfig } from '../../../config.type.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { LayoutData } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { preprocessDiagram } from '../../../preprocess.js';

export interface ParseToLayoutDataOptions {
  /**
   * When true, stamp `type`, `markers` and spacing the way the diagram's own unified renderer
   * does before it calls `render()` (e.g. `flowRenderer-v3-unified.ts`, `erRenderer-unified.ts`).
   */
  stampRendererFields?: boolean;
  /**
   * Config applied over the source's own frontmatter, as one more directive, before parsing —
   * e.g. `{ layered: { edgeRouting: 'stepped' } }`. It is also merged onto `layout.config`
   * directly, so keys the config schema does not know yet (directives drop those) still arrive.
   */
  config?: Record<string, unknown>;
}

interface ParsedDb {
  getData: () => LayoutData;
  getDirection?: () => string;
  extract?: (doc: unknown) => void;
  getRootDocV2?: () => unknown;
}

/**
 * Stamps the fields each unified renderer sets on `LayoutData` before `render()`. Keep in step
 * with the renderers: flowchart (`flowRenderer-v3-unified.ts`), class
 * (`classRenderer-v3-unified.ts`), state (`stateRenderer-v3-unified.ts`), ER
 * (`erRenderer-unified.ts`), requirement (`requirementRenderer.ts`) and mindmap
 * (`mindmapRenderer.ts`).
 */
function stampRendererFields(layoutData: LayoutData, diagramType: string): void {
  const config = getConfig();
  const neo = config.look === 'neo';
  layoutData.type = diagramType;
  // Each branch copies its diagram renderer's spacing, `||` or `??` included, so a spacing of 0
  // behaves here as it does in a real render.
  switch (diagramType) {
    case 'classDiagram': {
      // The class renderer reads the *state* config for spacing.
      const conf = config.state;
      layoutData.nodeSpacing = conf?.nodeSpacing || 50;
      layoutData.rankSpacing = conf?.rankSpacing || 50;
      layoutData.markers = ['aggregation', 'extension', 'composition', 'dependency', 'lollipop'];
      return;
    }
    case 'stateDiagram': {
      const conf = config.state;
      layoutData.nodeSpacing = conf?.nodeSpacing || 50;
      layoutData.rankSpacing = conf?.rankSpacing || 50;
      layoutData.markers = neo ? ['barbNeo'] : ['barb'];
      return;
    }
    case 'er': {
      const conf = config.er;
      const flowchart = (layoutData.config.flowchart ??= {});
      flowchart.nodeSpacing = conf?.nodeSpacing || 140;
      flowchart.rankSpacing = conf?.rankSpacing || 80;
      layoutData.markers = neo
        ? ['only_one_neo', 'zero_or_one_neo', 'one_or_more_neo', 'zero_or_more_neo']
        : ['only_one', 'zero_or_one', 'one_or_more', 'zero_or_more'];
      return;
    }
    case 'requirement': {
      const conf = config.state;
      layoutData.nodeSpacing = conf?.nodeSpacing ?? 50;
      layoutData.rankSpacing = conf?.rankSpacing ?? 50;
      layoutData.markers = neo
        ? ['requirement_contains_neo', 'requirement_arrow_neo']
        : ['requirement_contains', 'requirement_arrow'];
      return;
    }
    case 'mindmap':
      // The mindmap renderer sets no spacing or markers of its own.
      return;
    default: {
      const conf = config.flowchart;
      layoutData.nodeSpacing = conf?.nodeSpacing || 50;
      layoutData.rankSpacing = conf?.rankSpacing || 50;
      layoutData.markers = ['point', 'circle', 'cross'];
    }
  }
}

/**
 * Parse Mermaid source through the real diagram pipeline (preprocess → Diagram.fromText →
 * getData), as the unified renderers do. Callers set `layoutAlgorithm` as needed.
 */
export async function parseMmdTextToLayoutData(
  mmdText: string,
  options: ParseToLayoutDataOptions = {}
): Promise<LayoutData> {
  const { code, config } = preprocessDiagram(mmdText);
  configApi.reset();
  configApi.addDirective(config ?? {});
  if (options.config) {
    configApi.addDirective(structuredClone(options.config) as MermaidConfig);
  }
  const diagram = await Diagram.fromText(code);
  const db = diagram.db as unknown as ParsedDb;
  if (diagram.type === 'stateDiagram' && db.extract && db.getRootDocV2) {
    // stateRenderer-v3-unified extracts the root document before reading the layout data.
    db.extract(db.getRootDocV2());
  }
  const layoutData = db.getData();
  if (options.config) {
    layoutData.config = assignWithDepth(
      layoutData.config ?? {},
      structuredClone(options.config)
    ) as MermaidConfig;
  }

  // Flowchart's getData leaves `direction` unset (its renderer reads getDirection()); class,
  // state, ER and requirement set it in getData.
  const direction =
    (layoutData as LayoutData & { direction?: string }).direction ??
    db.getDirection?.call(db) ??
    'TB';
  (layoutData as LayoutData & { direction?: string }).direction = direction;

  if (options.stampRendererFields) {
    stampRendererFields(layoutData, diagram.type);
  }

  return layoutData;
}

/** {@link parseMmdTextToLayoutData} for a `.mmd` file. */
export async function parseMmdFileToLayoutData(
  mmdPath: string,
  options: ParseToLayoutDataOptions = {}
): Promise<LayoutData> {
  return await parseMmdTextToLayoutData(readFileSync(mmdPath, 'utf-8'), options);
}
