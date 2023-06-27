import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';

import {
  select as d3select,
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
} from 'd3';

import {
  sankey as d3Sankey,
  sankeyLinkHorizontal as d3SankeyLinkHorizontal,
  sankeyLeft as d3SankeyLeft,
  sankeyRight as d3SankeyRight,
  sankeyCenter as d3SankeyCenter,
  sankeyJustify as d3SankeyJustify,
  SankeyNode as d3SankeyNode,
} from 'd3-sankey';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { Uid } from '../../rendering-util/uid.js';
import { SankeyLinkColor, SankeyNodeAlignment } from '../../config.type.js';

/**
 * Draws Sankey diagram.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw = function (text: string, id: string, _version: string, diagObj: Diagram): void {
  // Get Sankey config
  const { securityLevel, sankey: conf } = configApi.getConfig();
  
  // TODO:
  // This code repeats for every diagram
  // Figure out what is happening there, probably it should be separated
  // The main thing is svg object that is a d3 wrapper for svg operations
  //
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
  const width = conf?.width || 800;
  const height = conf?.height || 400;
  const useMaxWidth = conf?.useMaxWidth || false;
  const nodeAlignment = conf?.nodeAlignment || SankeyNodeAlignment.justify;

  // FIX: using max width prevents height from being set, is it intended?
  // to add height directly one can use `svg.attr('height', height)`
  //
  // @ts-ignore TODO: svg type vs selection mismatch
  configureSvgSize(svg, height, width, useMaxWidth);

  // Prepare data for construction based on diagObj.db
  // This must be a mutable object with `nodes` and `links` properties:
  //
  //    {
  //      "nodes": [ { "id": "Alice" }, { "id": "Bob" }, { "id": "Carol" } ],
  //      "links": [ { "source": "Alice", "target": "Bob", "value": 23 }, { "source": "Bob", "target": "Carol", "value": 43 } ]
  //    }
  //
  // @ts-ignore TODO: db should be coerced to sankey DB type
  const graph = diagObj.db.getGraph();

  // Map config options to alignment functions
  const alignmentsMap: Map<
    SankeyNodeAlignment,
    (node: d3SankeyNode<object, object>, n: number) => number
  > = new Map([
    [SankeyNodeAlignment.left, d3SankeyLeft],
    [SankeyNodeAlignment.right, d3SankeyRight],
    [SankeyNodeAlignment.center, d3SankeyCenter],
    [SankeyNodeAlignment.justify, d3SankeyJustify],
  ])
  // We need fallback because typescript thinks that `get` can result in undefined
  const nodeAlign = alignmentsMap.get(nodeAlignment) || d3SankeyJustify;

  // Construct and configure a Sankey generator
  // That will be a function that calculates nodes and links dimensions
  //
  const nodeWidth = 10;
  const sankey = d3Sankey()
    .nodeId((d: any) => d.id) // we use 'id' property to identify node
    .nodeWidth(nodeWidth)
    .nodePadding(10)
    .nodeAlign(nodeAlign)
    .extent([
      [0, 0],
      [width, height],
    ]);

  // Compute the Sankey layout: calculate nodes and links positions
  // Our `graph` object will be mutated by this and enriched with other properties
  //
  sankey(graph);

  // Get color scheme for the graph
  const colorScheme = d3scaleOrdinal(d3schemeTableau10);

  // Create rectangles for nodes
  svg
    .append('g')
    .attr('class', 'nodes')
    .selectAll('.node')
    .data(graph.nodes)
    .join('g')
    .attr('class', 'node')
    .attr('transform', function (d: any) {
      return 'translate(' + d.x0 + ',' + d.y0 + ')';
    })
    .attr('x', (d: any) => d.x0)
    .attr('y', (d: any) => d.y0)
    .append('rect')
    .attr('height', (d: any) => {
      return d.y1 - d.y0;
    })
    .attr('width', (d: any) => d.x1 - d.x0)
    .attr('fill', (d: any) => colorScheme(d.id));

  // Create labels for nodes
  svg
    .append('g')
    .attr('class', 'node-labels')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14)
    .selectAll('text')
    .data(graph.nodes)
    .join('text')
    .attr('x', (d: any) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr('y', (d: any) => (d.y1 + d.y0) / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', (d: any) => (d.x0 < width / 2 ? 'start' : 'end'))
    .text((d: any) => d.id);

  // Creates the paths that represent the links.
  const link = svg
    .append('g')
    .attr('class', 'links')
    .attr('fill', 'none')
    .attr('stroke-opacity', 0.5)
    .selectAll('.link')
    .data(graph.links)
    .join('g')
    .attr('class', 'link')
    .style('mix-blend-mode', 'multiply');

  const linkColor = conf?.linkColor || SankeyLinkColor.gradient;

  if (linkColor === SankeyLinkColor.gradient) {
    const gradient = link
      .append('linearGradient')
      .attr('id', (d: any) => (d.uid = Uid.next('linearGradient-')).id)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', (d: any) => d.source.x1)
      .attr('x2', (d: any) => d.target.x0);

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', (d: any) => colorScheme(d.source.id));

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', (d: any) => colorScheme(d.target.id));
  }

  let coloring: any;
  switch (linkColor) {
    case SankeyLinkColor.gradient:
      coloring = (d: any) => d.uid;
      break;
    case SankeyLinkColor.source:
      coloring = (d: any) => d.source.id;
      break;
    case SankeyLinkColor.target:
      coloring = (d: any) => d.target.id;
      break;
    default:
      coloring = linkColor;
  }

  link
    .append('path')
    .attr('d', d3SankeyLinkHorizontal())
    .attr('stroke', coloring)
    .attr('stroke-width', (d: any) => Math.max(1, d.width));
};

export default {
  draw,
};
