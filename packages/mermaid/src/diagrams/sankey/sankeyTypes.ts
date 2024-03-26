/* eslint-disable @typescript-eslint/ban-types */
import type { SankeyNode as d3SankeyNode, SankeyLink as d3SankeyLink } from 'd3-sankey';

import type { SankeyDiagramConfig } from '../../config.type.js';
import type { DiagramDB } from '../../diagram-api/types.js';

export interface SankeyFields {
  links: SankeyLink[];
  nodes: string[];
  config: Required<SankeyDiagramConfig>;
}

export interface SankeyNodeData {
  name: string;
  id: string;
}

export interface SankeyNodeOverride {
  // Override optional attributes
  value: number;
  index: number;
  depth: number;
  height: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;

  // Add missing attributes
  layer: number;
}

export interface SankeyLinkData {
  id: string;
}

export interface SankeyLinkOverride {
  // Override optional attributes
  sourceLinks: d3SankeyNode<
    SankeyNodeData & SankeyNodeOverride,
    SankeyLinkData & SankeyLinkOverride
  >[];
  targetLinks: d3SankeyNode<
    SankeyNodeData & SankeyNodeOverride,
    SankeyLinkData & SankeyLinkOverride
  >[];
  source: d3SankeyLink<SankeyNodeData & SankeyNodeOverride, SankeyLinkData & SankeyLinkOverride>;
  target: d3SankeyLink<SankeyNodeData & SankeyNodeOverride, SankeyLinkData & SankeyLinkOverride>;
  value: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  width: number;
  index: number;
}

export interface SankeyGraph {
  nodes: SankeyNodeData[];
  links: SankeyLink[];
}

export type SankeyNodeDatum = d3SankeyNode<
  SankeyNodeData & SankeyNodeOverride,
  SankeyLinkData & SankeyLinkOverride
>;

export type SankeyLinkDatum = d3SankeyLink<
  SankeyNodeData & SankeyNodeOverride,
  SankeyLinkData & SankeyLinkOverride
>;

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyDB extends DiagramDB {
  // config
  getConfig: () => Required<SankeyDiagramConfig>;

  // common db
  clear: () => void;
  setDiagramTitle: (title: string) => void;
  getDiagramTitle: () => string;
  setAccTitle: (title: string) => void;
  getAccTitle: () => string;
  setAccDescription: (description: string) => void;
  getAccDescription: () => string;

  // diagram db
  addLink: ({ source, target, value }: SankeyLink) => void;
  getLinks: () => SankeyLink[];
  addNode: (node: string) => void;
  getNodes: () => string[];
}
