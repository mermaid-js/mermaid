import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { SVG } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import utils from '../../utils.js';
import type { C4LegendItem } from './c4LayoutData.js';
import { buildLegendData, getData } from './c4LayoutData.js';

const LEGEND_ROW_HEIGHT = 18;
const LEGEND_SWATCH_SIZE = 12;

/**
 * Appends the SHOW_LEGEND() legend below the bottom-right corner of the
 * rendered diagram, as plain SVG rects and texts (no layout engine
 * involvement). Must run before setupViewPortForSVG so the viewBox includes
 * the legend.
 */
const insertLegend = (svg: SVG, items: C4LegendItem[]) => {
  const diagramBounds = svg.node()!.getBBox();
  const legend = svg.append('g').attr('class', 'c4-legend');
  legend.append('text').attr('x', 0).attr('y', 0).attr('font-weight', 'bold').text('Legend');
  items.forEach((item, index) => {
    const rowBaseline = (index + 1) * LEGEND_ROW_HEIGHT;
    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', rowBaseline - LEGEND_SWATCH_SIZE)
      .attr('width', LEGEND_SWATCH_SIZE)
      .attr('height', LEGEND_SWATCH_SIZE)
      .attr('fill', item.fill ?? 'none')
      .attr('stroke', item.stroke ?? item.fill ?? 'none');
    legend
      .append('text')
      .attr('x', LEGEND_SWATCH_SIZE + 6)
      .attr('y', rowBaseline)
      .text(item.label);
  });
  const legendBounds = legend.node()!.getBBox();
  legend.attr(
    'transform',
    `translate(${diagramBounds.x + diagramBounds.width - legendBounds.width}, ${
      diagramBounds.y + diagramBounds.height + LEGEND_ROW_HEIGHT - legendBounds.y
    })`
  );
};

/**
 * Renders a C4 diagram through the unified rendering pipeline (dagre by
 * default, other layout algorithms via registerLayoutLoaders). Selected via
 * the `c4.useUnifiedRenderer` config flag; the legacy row-based renderer
 * stays the default.
 */
export const draw = async function (_text: string, id: string, _version: string, diag: any) {
  log.debug('Drawing C4 diagram (unified)', id);
  const config = getConfig();
  const { securityLevel, layout } = config;
  const c4Config = config.c4;

  const data4Layout = getData(diag.db, config);

  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  data4Layout.direction = 'TB';
  data4Layout.nodeSpacing = c4Config?.c4ShapeMargin ?? 50;
  data4Layout.rankSpacing = c4Config?.c4ShapeMargin ?? 50;
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  await render(data4Layout, svg);

  if (diag.db.getShowLegend()) {
    insertLegend(svg, buildLegendData(diag.db, config));
  }

  const padding = c4Config?.diagramMarginY ?? 10;
  utils.insertTitle(svg, 'c4TitleText', padding, diag.db.getTitle());
  setupViewPortForSVG(svg, padding, 'c4', c4Config?.useMaxWidth ?? true);
};

export default {
  draw,
};
