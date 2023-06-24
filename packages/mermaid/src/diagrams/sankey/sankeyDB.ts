import * as configApi from '../../config.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../../commonDb.js';

// Variables where graph data is stored
// Sankey diagram represented by nodes and links between those nodes
// We have to track nodes uniqueness (by ID), thats why we need a mapping also
//
let links: Array<SankeyLink> = [];
let nodes: Array<SankeyNode> = [];
let nodesMap: Record<string, SankeyNode> = {};
let nodeAlign = 'justify';

const setNodeAlign = (alignment: string): void => {
  const nodeAlignments: Set<string> = new Set(['left', 'right', 'center', 'justify']);
  if (nodeAlignments.has(alignment)) {
    nodeAlign = alignment;
  }
};

const getNodeAlign = (): string => nodeAlign;

const clear = (): void => {
  links = [];
  nodes = [];
  nodesMap = {};
  nodeAlign = 'justify';
  commonClear();
};

class SankeyLink {
  constructor(public source: SankeyNode, public target: SankeyNode, public value: number = 0) {}
}

/**
 * @param source - Node where the link starts
 * @param target - Node where the link ends
 * @param value - number, float or integer, describes the amount to be passed
 */
const addLink = (source: SankeyNode, target: SankeyNode, value: number): void => {
  links.push(new SankeyLink(source, target, value));
};

class SankeyNode {
  constructor(public ID: string) {}
}

/**
 * @param ID - The id of the node
 */
const findOrCreateNode = (ID: string): SankeyNode => {
  ID = common.sanitizeText(ID, configApi.getConfig());
  let node: SankeyNode;
  if (nodesMap[ID] === undefined) {
    node = new SankeyNode(ID);
    nodesMap[ID] = node;
    nodes.push(node);
  } else {
    node = nodesMap[ID];
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
  getConfig: () => configApi.getConfig().sankey,
  getNodes,
  getLinks,
  getGraph,
  addLink,
  findOrCreateNode,
  setNodeAlign,
  getNodeAlign,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
  clear,
};
