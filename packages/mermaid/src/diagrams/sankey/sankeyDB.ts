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

// export const parseDirective = function (statement, context, type) {
//   mermaidAPI.parseDirective(this, statement, context, type);
// };

// export const cleanupComments = (text: string): string => {
//   return text.trimStart().replace(/^\s*%%(?!{)[^\n]+\n?/gm, '');
// };
let links: Array<Link> = [];
let nodes: Array<Node> = [];
let nodesHash: Record<string, Node> = {};

const clear = function() {
  links = [];
  nodes = [];
  nodesHash = {};
  commonClear();
};

type Nullable<T> = T | null;

// interface ILink {
//   source?: Node;
//   target?: Node;
//   value?: number;
// }

class Link {
  source: Nullable<Node>;
  target: Nullable<Node>;
  value: Nullable<number>;
  constructor() {
    this.source = null;
    this.target = null;
    this.value = 0;
  }
}

/**
 * Adds a link between two elements on the diagram
 *
 * @param source - Node where the link starts
 * @param target - Node where the link ends
 * @param value - number, float or integer, describes the amount to be passed
 */
// const addLink = ({ source, target, amount }: ILink = {}): Link => {
const addLink = function(source?: Node, target?: Node, value?: number): Link {
  const link: Link = new Link();

  // TODO: make attribute setters
  if (source !== undefined) {
    link.source = source;
  }
  if (target !== undefined) {
    link.target = target;
  }
  if (value !== undefined) {
    link.value = value;
  }

  links.push(link);

  return link;
};

class Node {
  ID: string;
  title: string;
  constructor(ID: string, title: string = ID) {
    this.ID = ID;
    this.title = title;
  }
}

/**
 * Finds or creates a new Node by ID
 *
 * @param id - The id Node
 */
const addNode = function(ID: string): Node {
  ID = common.sanitizeText(ID, configApi.getConfig());
  let node: Node;
  if (nodesHash[ID] === undefined) {
    node = new Node(ID);
    nodesHash[ID] = node;
    nodes.push(node);
  } else {
    node = nodesHash[ID];
  }
  return node;
};

const getNodes = () => nodes;
const getLinks = () => links;

export default {
  nodesHash,
  getConfig: () => configApi.getConfig().sankey,
  getNodes,
  getLinks,
  addLink,
  addNode,
  // TODO: If this is a must this probably should be an interface
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
  clear,
};
