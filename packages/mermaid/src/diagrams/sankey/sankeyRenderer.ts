import type { Diagram } from '../../Diagram.js';
import { getConfig, defaultConfig } from '../../diagram-api/diagramAPI.js';
import {
  select as d3select,
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
} from 'd3';
import type { SankeyNode as d3SankeyNode } from 'd3-sankey';
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal as d3SankeyLinkHorizontal,
  sankeyLeft as d3SankeyLeft,
  sankeyRight as d3SankeyRight,
  sankeyCenter as d3SankeyCenter,
  sankeyJustify as d3SankeyJustify,
} from 'd3-sankey';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import { Uid } from '../../rendering-util/uid.js';
import type { SankeyNodeAlignment } from '../../config.type.js';

// Map config options to alignment functions
const alignmentsMap: Record<
  SankeyNodeAlignment,
  (node: d3SankeyNode<object, object>, n: number) => number
> = {
  left: d3SankeyLeft,
  right: d3SankeyRight,
  center: d3SankeyCenter,
  justify: d3SankeyJustify,
};

/**
 * Finds the layer of the central node (node with maximum value).
 * Used to determine smart label positioning.
 *
 * @param nodes - Array of nodes with layer information
 * @returns The layer number of the central (max value) node
 */
const findCentralNodeLayer = (nodes: any[]): number => {
  let maxValue = 0;
  let centralLayer = 0;

  for (const node of nodes) {
    if (node.value > maxValue) {
      maxValue = node.value;
      centralLayer = node.layer ?? 0;
    }
  }

  return centralLayer;
};

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
  const { securityLevel, sankey: conf } = getConfig();
  const defaultSankeyConfig = defaultConfig.sankey!;

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
  const width = conf?.width ?? defaultSankeyConfig.width!;
  const height = conf?.height ?? defaultSankeyConfig.width!;
  const useMaxWidth = conf?.useMaxWidth ?? defaultSankeyConfig.useMaxWidth!;
  const nodeAlignment = conf?.nodeAlignment ?? defaultSankeyConfig.nodeAlignment!;
  const prefix = conf?.prefix ?? defaultSankeyConfig.prefix!;
  const suffix = conf?.suffix ?? defaultSankeyConfig.suffix!;
  const showValues = conf?.showValues ?? defaultSankeyConfig.showValues!;

  // New config options with defaults
  const nodeWidth = conf?.nodeWidth ?? defaultSankeyConfig.nodeWidth ?? 10;
  const nodePadding = conf?.nodePadding ?? defaultSankeyConfig.nodePadding ?? 12;
  const labelStyle = conf?.labelStyle ?? defaultSankeyConfig.labelStyle ?? 'outlined';
  const nodeColors: Record<string, string> = conf?.nodeColors ?? {};

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

  // Get alignment function
  const nodeAlign = alignmentsMap[nodeAlignment];

  // Construct and configure a Sankey generator
  // That will be a function that calculates nodes and links dimensions
  //
  const sankey = d3Sankey()
    .nodeId((d: any) => d.id) // we use 'id' property to identify node
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding + (showValues ? 15 : 0))
    .nodeAlign(nodeAlign)
    .extent([
      [0, 0],
      [width, height],
    ]);

  // Compute the Sankey layout: calculate nodes and links positions
  // Our `graph` object will be mutated by this and enriched with other properties
  //
  sankey(graph);

  // Find central node layer for smart label positioning
  const centralNodeLayer = findCentralNodeLayer(graph.nodes);

  // Get color scheme for the graph (fallback for nodes without custom colors)
  const colorScheme = d3scaleOrdinal(d3schemeTableau10);

  /**
   * Gets the color for a node, using custom nodeColors config if available,
   * otherwise falling back to the default color scheme.
   *
   * @param nodeId - The ID of the node
   * @returns The color for the node
   */
  const getNodeColor = (nodeId: string): string => {
    return nodeColors[nodeId] ?? colorScheme(nodeId);
  };

  // Create rectangles for nodes
  svg
    .append('g')
    .attr('class', 'nodes')
    .selectAll('.node')
    .data(graph.nodes)
    .join('g')
    .attr('class', 'node')
    .attr('id', (d: any) => (d.uid = Uid.next('node-')).id)
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
    .attr('fill', (d: any) => getNodeColor(d.id));

  const getText = ({ id, value }: { id: string; value: number }) => {
    if (!showValues) {
      return id;
    }
    return `${id}\n${prefix}${Math.round(value * 100) / 100}${suffix}`;
  };

  /**
   * Determines label position based on node layer relative to central node.
   * Left-of-center nodes get labels on the left, right-of-center on the right.
   *
   * @param d - Node data with layer information
   * @returns Object with x position and text-anchor
   */
  const getLabelPosition = (d: any): { x: number; anchor: string } => {
    const nodeLayer = d.layer ?? 0;

    if (nodeLayer < centralNodeLayer) {
      // Left of center: label on the left
      return { x: d.x0 - 6, anchor: 'end' };
    } else {
      // Right of center (or at center): label on the right
      return { x: d.x1 + 6, anchor: 'start' };
    }
  };

  // Create labels for nodes
  const labelsGroup = svg.append('g').attr('class', 'node-labels').attr('font-size', 14);

  if (labelStyle === 'outlined') {
    // Outlined style: render background stroke first, then foreground text
    // Background text with white stroke for readability
    labelsGroup
      .selectAll('.sankey-label-bg')
      .data(graph.nodes)
      .join('text')
      .attr('class', 'sankey-label-bg')
      .attr('x', (d: any) => getLabelPosition(d).x)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', `${showValues ? '0' : '0.35'}em`)
      .attr('text-anchor', (d: any) => getLabelPosition(d).anchor)
      .text(getText);

    // Foreground text
    labelsGroup
      .selectAll('.sankey-label-fg')
      .data(graph.nodes)
      .join('text')
      .attr('class', 'sankey-label-fg')
      .attr('x', (d: any) => getLabelPosition(d).x)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', `${showValues ? '0' : '0.35'}em`)
      .attr('text-anchor', (d: any) => getLabelPosition(d).anchor)
      .text(getText);
  } else {
    // Default style: single text element (backward compatible)
    labelsGroup
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d: any) => getLabelPosition(d).x)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', `${showValues ? '0' : '0.35'}em`)
      .attr('text-anchor', (d: any) => getLabelPosition(d).anchor)
      .text(getText);
  }

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

  const linkColor = conf?.linkColor ?? 'gradient';

  if (linkColor === 'gradient') {
    const gradient = link
      .append('linearGradient')
      .attr('id', (d: any) => (d.uid = Uid.next('linearGradient-')).id)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', (d: any) => d.source.x1)
      .attr('x2', (d: any) => d.target.x0);

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', (d: any) => getNodeColor(d.source.id));

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', (d: any) => getNodeColor(d.target.id));
  }

  let coloring: any;
  switch (linkColor) {
    case 'gradient':
      coloring = (d: any) => d.uid;
      break;
    case 'source':
      coloring = (d: any) => getNodeColor(d.source.id);
      break;
    case 'target':
      coloring = (d: any) => getNodeColor(d.target.id);
      break;
    default:
      coloring = linkColor;
  }

  link
    .append('path')
    .attr('d', d3SankeyLinkHorizontal())
    .attr('stroke', coloring)
    .attr('stroke-width', (d: any) => Math.max(1, d.width));

  setupGraphViewbox(undefined, svg, 0, useMaxWidth);
};

export default {
  draw,
};
