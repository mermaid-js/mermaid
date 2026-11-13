import { getConfig } from '../../diagram-api/diagramAPI.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../common/commonDb.js';

// Sankey diagram represented by nodes and links between those nodes
let links: SankeyLink[] = [];
// Array of nodes guarantees their order
let nodes: SankeyNode[] = [];
// We also have to track nodes uniqueness (by ID)
let nodesMap = new Map<string, SankeyNode>();

const clear = (): void => {
  links = [];
  nodes = [];
  nodesMap = new Map();
  commonClear();
};

class SankeyLink {
  constructor(
    public source: SankeyNode,
    public target: SankeyNode,
    public value = 0
  ) {}
}

/**
 * @param source - Node where the link starts
 * @param target - Node where the link ends
 * @param value - Describes the amount to be passed
 */
const addLink = (source: SankeyNode, target: SankeyNode, value: number): void => {
  links.push(new SankeyLink(source, target, value));
};

class SankeyNode {
  constructor(public ID: string) {}
}

const findOrCreateNode = (ID: string): SankeyNode => {
  ID = common.sanitizeText(ID, getConfig());

  let node = nodesMap.get(ID);
  if (node === undefined) {
    node = new SankeyNode(ID);
    nodesMap.set(ID, node);
    nodes.push(node);
  }
  return node;
};

const getNodes = () => nodes;
const getLinks = () => links;

const getGraph = () => ({
  nodes: nodes.map((node) => ({ id: node.ID })),
  links: links.map((link) => ({
    source: link.source.ID,
    target: link.target.ID,
    value: link.value,
  })),
});

export default {
  nodesMap,
  getConfig: () => getConfig().sankey,
  getNodes,
  getLinks,
  getGraph,
  addLink,
  findOrCreateNode,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
  clear,
};
