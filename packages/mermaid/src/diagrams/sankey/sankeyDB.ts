// import { log } from '../../logger.js';
// import mermaidAPI from '../../mermaidAPI.js';
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
// We have to track nodes uniqueness (by ID), thats why we need hash also
//
let links: Array<SankeyLink> = [];
let nodes: Array<SankeyNode> = [];
let nodesHash: Record<string, SankeyNode> = {};
let nodeAlign: string = 'justify';

const setNodeAlign = function (alignment: string): void {
  const nodeAlignments: string[] = ['left', 'right', 'center', 'justify'];
  if (nodeAlignments.includes(alignment)) nodeAlign = alignment;
};

const getNodeAlign = () => nodeAlign;

const clear = function () {
  links = [];
  nodes = [];
  nodesHash = {};
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
const addLink = function (source: SankeyNode, target: SankeyNode, value: number): SankeyLink {
  const link: SankeyLink = new SankeyLink(source, target, value);

  links.push(link);

  return link;
};

class SankeyNode {
  constructor(public ID: string, public label: string = ID) {}
}

/**
 * @param ID - The id of the node
 */
const findOrCreateNode = function (ID: string): SankeyNode {
  ID = common.sanitizeText(ID, configApi.getConfig());
  let node: SankeyNode;
  if (nodesHash[ID] === undefined) {
    node = new SankeyNode(ID);
    nodesHash[ID] = node;
    nodes.push(node);
  } else {
    node = nodesHash[ID];
  }
  return node;
};

// TODO: this will be better using getters in typescript
const getNodes = () => nodes;
const getLinks = () => links;

const getGraph = () => ({
  nodes: nodes.map((node) => ({ id: node.ID, label: node.label })),
  links: links.map((link) => ({
    source: link.source.ID,
    target: link.target.ID,
    value: link.value,
  })),
});

export default {
  nodesHash,
  getConfig: () => configApi.getConfig().sankey,
  getNodes,
  getLinks,
  getGraph,
  addLink,
  findOrCreateNode,
  setNodeAlign,
  getNodeAlign,
  // TODO: If this is a must this probably should be an interface
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
  clear,
};
