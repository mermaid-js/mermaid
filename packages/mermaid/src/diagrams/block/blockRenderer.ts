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
  // TODO:
  // This code repeats for every diagram
  // Figure out what is happening there, probably it should be separated
  // The main thing is svg object that is a d3 wrapper for svg operations
  //
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

  // FIX: using max width prevents height from being set, is it intended?
  // to add height directly one can use `svg.attr('height', height)`
  //
  // @ts-ignore TODO: svg type vs selection mismatch
  configureSvgSize(svg, height, width, useMaxWidth);

  // Prepare data for construction based on diagObj.db
  // This must be a mutable object with `nodes` and `links` properties:
  //
  // @ts-ignore TODO: db type
  const graph = diagObj.db.getGraph();

  const nodeWidth = 10;

  // Get color scheme for the graph
  const colorScheme = d3scaleOrdinal(d3schemeTableau10);
};

export default {
  draw,
};
