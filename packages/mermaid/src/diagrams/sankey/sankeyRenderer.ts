// @ts-nocheck TODO: fix file
import { Diagram } from '../../Diagram.js';
import { log } from '../../logger.js';
import * as configApi from '../../config.js';
import {
  select as d3select,
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
  // rgb as d3rgb,
  map as d3map,
} from 'd3';
import { sankey as d3sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import sankeyDB from './sankeyDB.js';

/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw = function (text: string, id: string, _version: string, diagObj: Diagram): void {
  // First of all parse sankey language
  // Everything that is parsed will be stored in diagObj.DB
  // That is why we need to clear DB first
  //
  if (diagObj?.db?.clear !== undefined) {
    // why do we need to check for undefined? typescript complains
    diagObj?.db?.clear();
  }
  // Launch parsing
  diagObj.parser.parse(text);
  log.debug('Parsed sankey diagram');

  // Figure out what is happening there
  // The main thing is svg object that is a wrapper from d3 for svg operations
  //
  const { securityLevel, sequence: conf } = configApi.getConfig();
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? d3select(sandboxElement.nodes()[0].contentDocument.body)
      : d3select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;
  const svg = securityLevel === 'sandbox' ? root.select(`[id="${id}"]`) : d3select(`[id="${id}"]`);

  // Establish svg dimensions
  //
  const elem = doc.getElementById(id);
  const width = elem.parentElement.offsetWidth;

  const height = 600;
  configureSvgSize(svg, height, width, true);

  // Prepare data for construction
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
  const graph = {
    nodes: [{ id: 'Alice' }, { id: 'Bob' }, { id: 'Carol' }],
    links: [
      { source: 'Alice', target: 'Bob', value: 23 },
      { source: 'Bob', target: 'Carol', value: 43 },
    ],
  };

  // Construct and configure a Sankey generator
  // That will be a function that calculates nodes and links dimensions
  //
  const sankey = d3sankey()
    .nodeId((d) => d.id) // we use 'id' property to identify node
    .nodeWidth(36)
    .nodePadding(290)
    .size([width, height]);

  // .nodeAlign(d3Sankey.sankeyLeft) // d3.sankeyLeft, etc.
  // .nodeWidth(15)
  //   .nodePadding(10)
  //   .extent([[1, 5], [width - 1, height - 5]]);
  // .nodeId(d => d['id'])
  //

  // Compute the Sankey layout
  // Namely calculate nodes and links positions
  // Our `graph` object will be mutated by this
  //
  sankey(graph);

  // debugger;

  // const node = svg.append("g")
  //   .selectAll("rect")
  //   .data(graph.nodes)
  //   .join("rect")
  //   .attr("x", d => d.x0)
  //   .attr("y", d => d.y0)
  //   .attr("height", d => d.y1 - d.y0)
  //   .attr("width", d => d.x1 - d.x0);
  // // .attr("stroke", nodeStroke)
  // // .attr("stroke-width", nodeStrokeWidth)
  // // .attr("stroke-opacity", nodeStrokeOpacity)
  // // .attr("stroke-linejoin", nodeStrokeLinejoin)

  const color = d3scaleOrdinal(d3schemeTableau10);
  // Creates the rects that represent the nodes.
  const rect = svg
    .append('g')
    .attr('stroke', '#000')
    .selectAll('rect')
    .data(graph.nodes)
    .join('rect')
    .attr('x', (d) => d.x0)
    .attr('y', (d) => d.y0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('width', (d) => d.x1 - d.x0)
    .attr('fill', (d) => color(d.node));

  // // add in the links
  // var link = svg.append("g")
  //   .selectAll(".link")
  //   .data(graph.links)
  //   .enter()
  //   .append("path")
  //   .attr("class", "link")
  //   .attr("d", sankeyLinkHorizontal())
  //   .style("stroke-width", function (d) { return Math.max(1, d.dy); })
  //   .sort(function (a, b) { return b.dy - a.dy; });

  // // add in the nodes
  // var node = svg.append("g")
  //   .selectAll(".node")
  //   .data(graph.nodes)
  //   .enter().append("g")
  //   .attr("class", "node")
  //   .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
  //   // .call(d3.drag()
  //   //   .subject(function(d) { return d; })
  //   //   .on("start", function() { this.parentNode.appendChild(this); })
  //   //   .on("drag", dragmove))
  //   ;

  // // add the rectangles for the nodes
  // node
  //   .append("rect")
  //   .attr("height", function (d) { return d.dy; })
  //   .attr("width", generator.nodeWidth())
  //   .style("fill", function (d) { return d.color = color(d.name.replace(/ .*/, "")); })
  //   .style("stroke", function (d) { return d3rgb(d.color).darker(2); })
  //   // Add hover text
  //   .append("title")
  //   .text(function (d) { return d.name + "\n" + "There is " + d.value + " stuff in this node"; });

  // // add in the title for the nodes
  // node
  //   .append("text")
  //   .attr("x", -6)
  //   .attr("y", function (d) { return d.dy / 2; })
  //   .attr("dy", ".35em")
  //   .attr("text-anchor", "end")
  //   .attr("transform", null)
  //   .text(function (d) { return d.name; })
  //   .filter(function (d) { return d.x < width / 2; })
  //   .attr("x", 6 + generator.nodeWidth())
  //   .attr("text-anchor", "start");

  // console.log();
  // debugger;
  // .layout(1);

  // const { nodes, links } = generator({
  //   nodes: graph.nodes,
  //   links: graph.links,
  // });
};

export default {
  draw,
};
