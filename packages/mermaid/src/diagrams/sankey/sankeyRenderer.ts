// @ts-nocheck TODO: fix file
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
} from 'd3-sankey';
import { configureSvgSize } from '../../setupGraphViewbox.js';

/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw = function (text: string, id: string, _version: string, diagObj: Diagram): void {
  // TODO: Figure out what is happening there
  // The main thing is svg object that is a d3 wrapper for svg operations
  //
  const { securityLevel, sequence: conf } = configApi.getConfig();
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = d3select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? d3select(sandboxElement.nodes()[0].contentDocument.body)
      : d3select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;
  const svg = securityLevel === 'sandbox' ? root.select(`[id="${id}"]`) : d3select(`[id="${id}"]`);

  // Establish svg dimensions and get width and height
  //
  const elem = doc.getElementById(id);
  const width = elem.parentElement.offsetWidth;
  const height = 600; // TODO calculate height?

  // FIX: using max width prevents height from being set
  configureSvgSize(svg, height, width, true);
  svg.attr('height', height); // that's why we need this line

  // Prepare data for construction based on diagObj.db
  // This must be a mutable object with 2 properties:
  // `nodes` and `links`
  //
  //    let graph = {
  //      "nodes": [
  //        { "id": "Alice" },
  //        { "id": "Bob" },
  //        { "id": "Carol" }
  //      ],
  //      "links": [
  //        { "source": "Alice", "target": "Bob", "value": 23 },
  //        { "source": "Bob", "target": "Carol", "value": 43 }
  //      ]
  //    };
  //

  const graph = diagObj.db.getGraph();
  const nodeAligns = {
    left: d3SankeyLeft,
    right: d3SankeyRight,
    center: d3SankeyCenter,
    justify: d3SankeyJustify,
  };
  const nodeAlign = nodeAligns[diagObj.db.getNodeAlign()];

  // Construct and configure a Sankey generator
  // That will be a function that calculates nodes and links dimensions
  //
  const nodeWidth = 10;
  const sankey = d3Sankey()
    .nodeId((d) => d.id) // we use 'id' property to identify node
    .nodeWidth(nodeWidth)
    .nodePadding(10)
    .nodeAlign(nodeAlign) // d3.sankeyLeft, etc.
    .extent([
      [0, 0],
      [width - nodeWidth, height],
    ]);

  // Compute the Sankey layout: calculate nodes and links positions
  // Our `graph` object will be mutated by this and enriched with other properties
  //
  sankey(graph);

  // Get color scheme for the graph
  const color = d3scaleOrdinal(d3schemeTableau10);

  // Create groups for nodes
  svg
    .append('g')
    .attr('class', 'nodes')
    .selectAll('.node')
    .data(graph.nodes)
    .join('g')
    .attr('class', 'node')
    .attr('transform', function (d) {
      return 'translate(' + d.x0 + ',' + d.y0 + ')';
    })
    .attr('x', (d) => d.x0)
    .attr('y', (d) => d.y0)
    .append('rect')
    .attr('height', (d) => {
      return d.y1 - d.y0;
    })
    .attr('width', (d) => d.x1 - d.x0)
    .attr('fill', (d) => color(d.id));

  // Create labels for nodes
  svg
    .append('g')
    .attr('class', 'node-labels')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14)
    .selectAll('text')
    .data(graph.nodes)
    .join('text')
    .attr('x', (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr('y', (d) => (d.y1 + d.y0) / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', (d) => (d.x0 < width / 2 ? 'start' : 'end'))
    .text((d) => d.label);

  // Creates the paths that represent the links.
  const link_g = svg
    .append('g')
    .attr('class', 'links')
    .attr('fill', 'none')
    .attr('stroke-opacity', 0.5)
    .selectAll('.link')
    .data(graph.links)
    .join('g')
    .attr('class', 'link')
    .style('mix-blend-mode', 'multiply');

  link_g
    .append('path')
    .attr('d', d3SankeyLinkHorizontal())
    .attr('stroke', (d) => color(d.source.id))
    .attr('stroke-width', (d) => Math.max(1, d.width));
};

export default {
  draw,
};
