import type { ScaleOrdinal } from 'd3';
import { scaleOrdinal as d3scaleOrdinal, schemeTableau10 as d3schemeTableau10 } from 'd3';
import type { SankeyGraph as d3SankeyGraph, SankeyNode as d3SankeyNode } from 'd3-sankey';
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal as d3SankeyLinkHorizontal,
  sankeyLeft as d3SankeyLeft,
  sankeyRight as d3SankeyRight,
  sankeyCenter as d3SankeyCenter,
  sankeyJustify as d3SankeyJustify,
} from 'd3-sankey';

import { log } from '../../logger.js';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import type { MermaidConfig, SankeyDiagramConfig, SankeyNodeAlignment } from '../../config.type.js';
import type {
  SankeyDB,
  SankeyGraph,
  SankeyLinkData,
  SankeyLinkDatum,
  SankeyLinkOverride,
  SankeyNodeData,
  SankeyNodeDatum,
  SankeyNodeOverride,
} from './sankeyTypes.js';
import { Uid } from '../../rendering-util/uid.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { getConfig } from '../../config.js';
import { cleanAndMerge } from '../../utils.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';

// Map config options to alignment functions
const alignmentsMap: Record<
  SankeyNodeAlignment,
  (node: d3SankeyNode<object, object>, n: number) => number
> = {
  left: d3SankeyLeft,
  right: d3SankeyRight,
  center: d3SankeyCenter,
  justify: d3SankeyJustify,
} as const;

/**
 * Prepare data for construction based DB.
 *
 * This must be a mutable object with `nodes` and `links` properties:
 *
 * ```json
 * {
 *   "nodes": [{ "name": "Alice", "id": "node-1" }, { "name": "Bob", "id": "node-2" }],
 *   "links": [{ "id": "linearGradient-1", "source": "Alice", "target": "Bob", "value": 23 }]
 * }
 * ```
 *
 * @param db - The sankey db.
 * @param config - The required config of sankey diagram.
 * @returns The prepared sankey data.
 */
const createSankeyGraph = (db: SankeyDB, config: Required<SankeyDiagramConfig>) => {
  const graph: SankeyGraph = structuredClone({
    nodes: db.getNodes().map((node: string) => {
      return {
        id: Uid.next('node-').id,
        name: node,
      };
    }),
    links: db.getLinks(),
  });

  const nodeAlign = alignmentsMap[config.nodeAlignment];
  const nodeWidth = 10;
  // eslint-disable-next-line @typescript-eslint/ban-types
  const sankey = d3Sankey<SankeyNodeData, {}>()
    .nodeId((node): string => node.name)
    .nodeWidth(nodeWidth)
    .nodePadding(10 + (config.showValues ? 15 : 0))
    .nodeAlign(nodeAlign)
    .extent([
      [0, 0],
      [config.width, config.height],
    ]);
  return sankey(graph) as d3SankeyGraph<
    SankeyNodeData & SankeyNodeOverride,
    SankeyLinkData & SankeyLinkOverride
  >;
};

export const draw: DrawDefinition = (text, id, _version, diagObj) => {
  log.debug('rendering sankey diagram\n' + text);

  const db = diagObj.db as SankeyDB;
  const globalConfig: MermaidConfig = getConfig();
  const sankeyConfig: Required<SankeyDiagramConfig> = cleanAndMerge(
    db.getConfig(),
    globalConfig.sankey
  );

  const svg: SVG = selectSvgElement(id);

  const width: number = sankeyConfig.width;
  const height: number = sankeyConfig.height;
  const useMaxWidth: boolean = sankeyConfig.useMaxWidth;
  configureSvgSize(svg, height, width, useMaxWidth);

  const graph = createSankeyGraph(db, sankeyConfig);

  // Get color scheme for the graph
  const colorScheme: ScaleOrdinal<string, string, never> = d3scaleOrdinal(d3schemeTableau10);

  // Create rectangles for nodes
  svg
    .append('g')
    .attr('class', 'nodes')
    .selectAll('.node')
    .data<SankeyNodeDatum>(graph.nodes)
    .join('g')
    .attr('class', 'node')
    .attr('id', (d: SankeyNodeDatum) => d.id)
    .attr('transform', (d: SankeyNodeDatum) => {
      return `translate(${d.x0},${d.y0})`;
    })
    .attr('x', (d: SankeyNodeDatum): number => d.x0)
    .attr('y', (d: SankeyNodeDatum): number => d.y0)
    .append('rect')
    .attr('height', (d: SankeyNodeDatum): number => d.y1 - d.y0)
    .attr('width', (d: SankeyNodeDatum): number => d.x1 - d.x0)
    .attr('fill', (d: SankeyNodeDatum): string => colorScheme(d.id));

  const showValues: boolean = sankeyConfig.showValues;
  const prefix: string = sankeyConfig.prefix;
  const suffix: string = sankeyConfig.suffix;
  const getText = ({ name, value }: SankeyNodeDatum): string => {
    if (!showValues) {
      return name;
    }
    return `${name}\n${prefix}${Math.round((value ?? 0) * 100) / 100}${suffix}`;
  };

  // Create labels for nodes
  svg
    .append('g')
    .attr('class', 'node-labels')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14)
    .selectAll('text')
    .data<SankeyNodeDatum>(graph.nodes)
    .join('text')
    .attr('x', (d: SankeyNodeDatum) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr('y', (d: SankeyNodeDatum): number => (d.y1 + d.y0) / 2)
    .attr('dy', `${showValues ? '0' : '0.35'}em`)
    .attr('text-anchor', (d: SankeyNodeDatum) => (d.x0 < width / 2 ? 'start' : 'end'))
    .text(getText);

  // Creates the paths that represent the links.
  const links = svg
    .append('g')
    .attr('class', 'links')
    .attr('fill', 'none')
    .attr('stroke-opacity', 0.5)
    .selectAll('.link')
    .data<SankeyLinkDatum>(graph.links)
    .join('g')
    .attr('class', 'link')
    .style('mix-blend-mode', 'multiply');

  const linkColor = sankeyConfig.linkColor;
  if (linkColor === 'gradient') {
    const gradient = links
      .append('linearGradient')
      .attr('id', (d: SankeyLinkDatum) => {
        // @ts-ignore - figure how to stop using this approach
        return (d.id = Uid.next('linearGradient-')).id;
      })
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', (d: SankeyLinkDatum): number => d.source.x1)
      .attr('x2', (d: SankeyLinkDatum): number => d.target.x0);

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', (d: SankeyLinkDatum): string => colorScheme(d.source.id));

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', (d: SankeyLinkDatum): string => colorScheme(d.target.id));
  }

  let coloring: (d: SankeyLinkDatum) => string;
  switch (linkColor) {
    case 'gradient':
      coloring = (d: SankeyLinkDatum): string => d.id;
      break;
    case 'source':
      coloring = (d: SankeyLinkDatum): string => colorScheme(d.source.id);
      break;
    case 'target':
      coloring = (d: SankeyLinkDatum): string => colorScheme(d.target.id);
      break;
    default:
      coloring = (): string => linkColor;
  }

  links
    .append('path')
    .attr('d', d3SankeyLinkHorizontal())
    .attr('stroke', coloring)
    .attr('stroke-width', (d: SankeyLinkDatum): number => Math.max(1, d.width));
};

export const renderer = { draw };
