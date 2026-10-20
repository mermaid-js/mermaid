import { select } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import utils from '../../utils.js';
import type { Diagram } from '../../Diagram.js';
import type { D3Selection } from '../../types.js';
import type { Edge, LayoutData } from '../../rendering-util/types.js';
import type { C4LabelNudge } from './c4Types.js';
import type c4Db from './c4Db.js';

type C4DB = typeof c4Db;

/**
 * `UpdateRelStyle($offsetX, $offsetY)` moves a relationship's label off the line's midpoint,
 * which is how an author untangles two relationships that would otherwise print on top of each
 * other. The unified pipeline places labels, so the nudge is applied to what it placed.
 */
const nudgeRelationshipLabels = (svg: D3Selection<SVGGElement>, data4Layout: LayoutData) => {
  for (const edge of data4Layout.edges as (Edge & C4LabelNudge)[]) {
    const dx = edge.labelOffsetX ?? 0;
    const dy = edge.labelOffsetY ?? 0;
    if (!dx && !dy) {
      continue;
    }
    const inner = svg.select<SVGGElement>(`[data-id="${edge.id}"]`);
    const group = inner.empty() ? null : inner.node()?.closest('g.edgeLabel');
    if (!group) {
      continue;
    }
    const label = select(group as SVGGElement);
    const transform = label.attr('transform') ?? '';
    const [x, y] = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(transform)?.slice(1) ?? [];
    if (x === undefined || y === undefined) {
      continue;
    }
    label.attr('transform', `translate(${Number(x) + dx}, ${Number(y) + dy})`);
  }
};

export const draw = async function (_text: string, id: string, _version: string, diag: Diagram) {
  const { securityLevel, c4: conf, layout } = getConfig();
  const db = diag.db as C4DB;

  const data4Layout = db.getData();
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  // C4 has no nodeSpacing/rankSpacing of its own; c4ShapeMargin is its
  // "margin between shapes" knob, which is the same quantity.
  data4Layout.nodeSpacing = conf?.c4ShapeMargin ?? 50;
  data4Layout.rankSpacing = conf?.c4ShapeMargin ?? 50;
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  log.debug('c4 layout data', data4Layout);

  await render(data4Layout, svg);

  nudgeRelationshipLabels(svg, data4Layout);

  utils.insertTitle(svg, 'c4TitleText', conf?.diagramMarginY ?? 10, db.getTitle());

  // setupViewPortForSVG pads all four sides with a single value, so the
  // horizontal margin is the one carried over.
  setupViewPortForSVG(svg, conf?.diagramMarginX ?? 50, 'c4Diagram', conf?.useMaxWidth ?? true);
};

export default {
  draw,
};
