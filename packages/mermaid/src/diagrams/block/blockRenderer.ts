import {
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
  select as d3select,
} from 'd3';
import type { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
import type { MermaidConfig } from '../../config.type.js';
import insertMarkers from '../../dagre-wrapper/markers.js';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { BlockDB } from './blockDB.js';
import { layout } from './layout.js';
import { calculateBlockSizes, insertBlocks, insertEdges } from './renderHelpers.js';

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param text - The text with the classes
 * @param diagObj - The diagram object
 * @returns ClassDef - The styles
 */
export const getClasses = function (text: any, diagObj: any) {
  return diagObj.db.getClasses();
};

export const draw = async function (
  text: string,
  id: string,
  _version: string,
  diagObj: Diagram
): Promise<void> {
  const { securityLevel, block: conf } = configApi.getConfig();
  const db = diagObj.db as BlockDB;
  let sandboxElement: any;
  if (securityLevel === 'sandbox') {
    sandboxElement = d3select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? d3select<HTMLBodyElement, unknown>(sandboxElement.nodes()[0].contentDocument.body)
      : d3select<HTMLBodyElement, unknown>('body');

  const svg =
    securityLevel === 'sandbox'
      ? root.select<SVGSVGElement>(`[id="${id}"]`)
      : d3select<SVGSVGElement, unknown>(`[id="${id}"]`);

  // Define the supported markers for the diagram
  const markers = ['point', 'circle', 'cross'];

  // Add the marker definitions to the svg as marker tags
  // insertMarkers(svg, markers, diagObj.type, diagObj.arrowMarkerAbsolute);
  // insertMarkers(svg, markers, diagObj.type, true);
  insertMarkers(svg, markers, diagObj.type, id);

  const bl = db.getBlocks();
  const blArr = db.getBlocksFlat();
  const edges = db.getEdges();

  const nodes = svg.insert('g').attr('class', 'block');
  await calculateBlockSizes(nodes, bl, db);
  const bounds = layout(db);
  await insertBlocks(nodes, bl, db);
  await insertEdges(nodes, edges, blArr, db, id);

  // log.debug('Here', bl);

  // Establish svg dimensions and get width and height
  //
  // const bounds2 = nodes.node().getBoundingClientRect();
  // Why, oh why ????
  if (bounds) {
    const bounds2 = bounds;
    const magicFactor = Math.max(1, Math.round(0.125 * (bounds2.width / bounds2.height)));
    const height = bounds2.height + magicFactor + 10;
    const width = bounds2.width + 10;
    const { useMaxWidth } = conf as Exclude<MermaidConfig['block'], undefined>;
    configureSvgSize(svg, height, width, !!useMaxWidth);
    log.debug('Here Bounds', bounds, bounds2);
    svg.attr(
      'viewBox',
      `${bounds2.x - 5} ${bounds2.y - 5} ${bounds2.width + 10} ${bounds2.height + 10}`
    );
  }

  // Get color scheme for the graph
  const colorScheme = d3scaleOrdinal(d3schemeTableau10);
};

export default {
  draw,
  getClasses,
};
