import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
import { calculateBlockSizes, insertBlocks, insertEdges } from './renderHelpers.js';
import { layout } from './layout.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import insertMarkers from '../../dagre-wrapper/markers.js';
import {
  select as d3select,
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
} from 'd3';
import { log } from '../../logger.js';

import { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';

// import { diagram as BlockDiagram } from './blockDiagram.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param text
 * @param diagObj
 * @returns {object} ClassDef styles
 */
export const getClasses = function (text: any, diagObj: any) {
  log.info('abc88 Extracting classes', diagObj.db.getClasses());
  try {
    return diagObj.db.getClasses();
  } catch (e) {
    return;
  }
};

export const draw = async function (
  text: string,
  id: string,
  _version: string,
  diagObj: Diagram
): Promise<void> {
  const { securityLevel, flowchart: conf } = configApi.getConfig();
  const db = diagObj.db as BlockDB;
  let sandboxElement: any;
  if (securityLevel === 'sandbox') {
    sandboxElement = d3select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? d3select(sandboxElement.nodes()[0].contentDocument.body)
      : d3select('body');

  // @ts-ignore TODO root.select is not callable
  const svg = securityLevel === 'sandbox' ? root.select(`[id="${id}"]`) : d3select(`[id="${id}"]`);

  // Define the supported markers for the diagram
  const markers = ['point', 'circle', 'cross'];

  // Add the marker definitions to the svg as marker tags
  // insertMarkers(svg, markers, diagObj.type, diagObj.arrowMarkerAbsolute);
  insertMarkers(svg, markers, diagObj.type, true);

  const bl = db.getBlocks();
  const blArr = db.getBlocksFlat();
  const edges = db.getEdges();

  const nodes = svg.insert('g').attr('class', 'block');
  await calculateBlockSizes(nodes, bl, db);
  const bounds = layout(db);
  // log.debug('Here be blocks', bl);
  await insertBlocks(nodes, bl, db);
  await insertEdges(nodes, edges, blArr, db);

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
    const useMaxWidth = false;
    configureSvgSize(svg, height, width, useMaxWidth);
    log.debug('Here Bounds', bounds, bounds2);
    svg.attr(
      'viewBox',
      `${bounds2.x - 5} ${bounds2.y - 5} ${bounds2.width + 10} ${bounds2.height + 10}`
    );
  }
  // svg.attr('viewBox', `${-200} ${-200} ${400} ${400}`);

  // Prepare data for construction based on diagObj.db
  // This must be a mutable object with `nodes` and `links` properties:
  //
  // @ts-ignore TODO: db type
  // const graph = diagObj.db.getGraph();

  // const nodeWidth = 10;

  // Create rectangles for nodes
  // const db:BlockDB = diagObj.db;

  interface LayedBlock extends Block {
    children?: LayedBlock[];
    x?: number;
    y?: number;
  }

  // Get color scheme for the graph
  const colorScheme = d3scaleOrdinal(d3schemeTableau10);
};

export default {
  draw,
  getClasses,
};
