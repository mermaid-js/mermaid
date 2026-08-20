import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramRenderer, DrawDefinition, SVG } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import utils from '../../utils.js';
import type { C4BetaDB } from './db.js';
import type { C4BetaLegendItem } from './types.js';

const LEGEND_ROW_HEIGHT = 18;
const LEGEND_SWATCH_SIZE = 12;

// Element kind -> the theme variable carrying its identity colour. Kept local to
// c4-beta; the legacy + c4-beta tracks share one resolver only after convergence.
const KIND_TO_THEME_VAR: Record<string, string> = {
  person: 'c4PersonBkg',
  softwareSystem: 'c4SystemBkg',
  container: 'c4ContainerBkg',
  component: 'c4ComponentBkg',
  infrastructureNode: 'c4InfrastructureBkg',
  external: 'c4ExternalBkg',
};

/** Outline swatch colour: a tag row's explicit colour, else the kind's theme variable. */
const swatchColor = (
  item: C4BetaLegendItem,
  themeVariables: Record<string, unknown> | undefined
): string => {
  if (item.stroke ?? item.fill) {
    return (item.stroke ?? item.fill)!;
  }
  const varName = item.external ? 'c4ExternalBkg' : KIND_TO_THEME_VAR[item.kind ?? ''];
  const value = varName ? themeVariables?.[varName] : undefined;
  return typeof value === 'string' ? value : '#6b6b6b';
};

/**
 * Appends the auto-generated legend below the bottom-left corner of the
 * rendered diagram as plain SVG (no layout engine involvement). Must run
 * before setupViewPortForSVG so the viewBox includes the legend.
 */
const insertLegend = (
  svg: SVG,
  items: C4BetaLegendItem[],
  themeVariables: Record<string, unknown> | undefined
) => {
  if (items.length === 0) {
    return;
  }
  const background = (themeVariables?.background as string) ?? '#ffffff';
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
      .attr('fill', item.fill ?? background)
      .attr('stroke', swatchColor(item, themeVariables));
    legend
      .append('text')
      .attr('x', LEGEND_SWATCH_SIZE + 6)
      .attr('y', rowBaseline)
      .text(item.label);
  });
  const legendBounds = legend.node()!.getBBox();
  legend.attr(
    'transform',
    `translate(${diagramBounds.x}, ${
      diagramBounds.y + diagramBounds.height + LEGEND_ROW_HEIGHT - legendBounds.y
    })`
  );
};

const draw: DrawDefinition = async function (_text, id, _version, diag) {
  log.debug('Drawing c4-beta diagram', id);
  const { securityLevel, layout } = getConfig();
  const db = diag.db as C4BetaDB;

  // getData extracts the parsed structure into the unified Layout data format.
  const data4Layout = db.getData();

  // Create the root SVG
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  data4Layout.direction = db.getDirection();
  // Extra node spacing keeps sibling deployment-node headers from overlapping.
  data4Layout.nodeSpacing = 80;
  data4Layout.rankSpacing = 60;
  // Reserve vertical space for the (multi-line) deployment-node header labels so
  // they do not overlap nested content. The dagre layout reads this from the
  // per-diagram config; clusters otherwise reserve no space for their label.
  data4Layout.config.flowchart = {
    ...data4Layout.config.flowchart,
    subGraphTitleMargin: { top: 40, bottom: 0 },
  };
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  await render(data4Layout, svg);

  if (db.isLegendEnabled()) {
    insertLegend(svg, db.getLegendItems(), getConfig().themeVariables as Record<string, unknown>);
  }

  utils.insertTitle(svg, 'c4TitleText', 30, db.getDiagramTitle());
  setupViewPortForSVG(svg, 10, 'c4beta', true);
};

export const renderer: DiagramRenderer = { draw };
