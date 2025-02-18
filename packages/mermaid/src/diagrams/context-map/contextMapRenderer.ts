import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { calculateTextHeight, calculateTextWidth } from '../../utils.js';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import type { MermaidConfig } from '../../config.type.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import type { ContextMapDb } from './contextMapDb.js';
import { mapEdgeLabels } from './contextMap.js';
import { buildGraph, Configuration } from './drawSvg.js';
import type { Font } from './drawSvg.js';

/**
 * Draws a Pie Chart with the data given in text.
 *
 * @param text - pie chart code
 * @param id - diagram id
 * @param _version - MermaidJS version from package.json.
 * @param diagObj - A standard diagram containing the DB and the text and type etc of the diagram.
 */
export const draw: DrawDefinition = (text, id, _version, diagObj) => {
  log.debug('rendering context map chart\n' + text);
  const db = diagObj.db as ContextMapDb;
  const globalConfig: MermaidConfig = getConfig();
  const conf = globalConfig.contextMap;

  if (!conf) {
    return;
  }

  const svg: SVG = selectSvgElement(id);
  //group.attr('transform', 'translate(' + pieWidth / 2 + ',' + height / 2 + ')');

  const graph = db.getGraph();

  log.debug('graph\n' + JSON.stringify(graph));

  const nodes = graph.nodes.map((node) => ({ id: node.id, name: node.id }));
  const links = graph.edges.map((edge) => {
    return mapEdgeLabels(edge);
  });

  const width = conf.width!;
  const height = conf.height!;
  const fontConfig = conf.font as Font;
  const config = new Configuration(
    height,
    width,
    fontConfig,
    (text) => calculateTextWidth(text!, fontConfig),
    (text) => calculateTextHeight(text!, fontConfig),
    { rx: conf.nodePadding!.horizontal!, ry: conf.nodePadding!.vertical! },
    { horizontal: conf.nodeMargin!.horizontal!, vertical: conf.nodeMargin!.vertical! }
  );

  buildGraph(svg, { nodes, links }, config);

  configureSvgSize(svg, width, height, true);
};

export const renderer = { draw };
