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

const clear = () => {
  links = [];
  nodes = [];
  nodesHash = {};
  commonClear();
};

type Nullable<T> = T | null;

interface ILink {
  source?: Node;
  target?: Node;
  amount?: number;
}

class Link {
  source: Nullable<Node>;
  target: Nullable<Node>;
  amount: Nullable<number>;
  constructor() {
    this.source = null;
    this.target = null;
    this.amount = 0;
  }
}

/**
 * Adds a link between two elements on the diagram
 *
 * @param source - Node where the link starts
 * @param target - Node where the link ends
 * @param amount - number, float or integer, describes the amount to be passed
 */
// const addLink = ({ source, target, amount }: ILink = {}): Link => {
const addLink = (source?: Node, target?: Node, amount?: number): Link => {
  const link: Link = new Link();

  if (source !== undefined) {
    link.source = source;
  }
  if (target !== undefined) {
    link.target = target;
  }
  if (amount !== undefined) {
    link.amount = amount;
  }

  links.push(link);

  return link;
};

class Node {
  ID: string;
  title: string;
  constructor(ID: string) {
    this.ID = ID;
    this.title = ID;
  }
}

/**
 * Finds or creates a new Node by ID
 *
 * @param id - The id Node
 */
const addNode = (ID: string): Node => {
  ID = common.sanitizeText(ID, configApi.getConfig());
  if (nodesHash[ID] === undefined) {
    nodesHash[ID] = new Node(ID);
  }
  const node = nodesHash[ID];
  nodes.push(node);
  // debugger;
  return node;
};

export default {
  nodesHash,
  nodes,
  links,
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
