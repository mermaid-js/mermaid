import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../common/commonDb.js';
import type { SankeyDiagramConfig } from '../../config.type.js';
import type { SankeyDB, SankeyLink as ISankeyLink, SankeyFields } from './sankeyTypes.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { RequiredDeep } from 'type-fest';

export const DEFAULT_SANKEY_CONFIG: Required<SankeyDiagramConfig> = DEFAULT_CONFIG.sankey;

export const DEFAULT_SANKEY_DB: RequiredDeep<SankeyFields> = {
  links: [] as ISankeyLink[],
  nodes: [] as string[],
  config: DEFAULT_SANKEY_CONFIG,
} as const;

// Sankey diagram represented by nodes and links between those nodes
let links: ISankeyLink[] = DEFAULT_SANKEY_DB.links;
// Array of nodes guarantees their order
let nodes: string[] = DEFAULT_SANKEY_DB.nodes;
const config: Required<SankeyDiagramConfig> = structuredClone(DEFAULT_SANKEY_CONFIG);

const getConfig = (): Required<SankeyDiagramConfig> => structuredClone(config);

const clear = (): void => {
  links = [];
  nodes = [];
  commonClear();
};

/**
 * @param source - Node where the link starts
 * @param target - Node where the link ends
 * @param value - Describes the amount to be passed
 */
const addLink = ({ source, target, value }: ISankeyLink): void => {
  links.push({ source, target, value });
};

const getLinks = (): ISankeyLink[] => links;

const addNode = (node: string): void => {
  nodes.push(node);
};

const getNodes = (): string[] => nodes;

export const db: SankeyDB = {
  getConfig,
  clear,

  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,

  addLink,
  addNode,
  getLinks,
  getNodes,
};
