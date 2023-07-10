import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';

import {
  select as d3select,
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
} from 'd3';

import { configureSvgSize } from '../../setupGraphViewbox.js';
import { Uid } from '../../rendering-util/uid.js';

export const draw = function (text: string, id: string, _version: string, diagObj: Diagram): void {
  const { securityLevel } = configApi.getConfig();
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

  // Establish svg dimensions and get width and height
  //  
  const height = 400;
  const width = 600;
  const useMaxWidth = false;
  configureSvgSize(svg, height, width, useMaxWidth);

  // Prepare data for construction based on diagObj.db
  // This must be a mutable object with `nodes` and `links` properties:
  //
  // @ts-ignore TODO: db type
  // const graph = diagObj.db.getGraph();

  // const nodeWidth = 10;

  // Get color scheme for the graph
  // const colorScheme = d3scaleOrdinal(d3schemeTableau10);
};

export default {
  draw,
};
