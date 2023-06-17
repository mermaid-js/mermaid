import { log } from '../../logger.js';
import mermaidAPI from '../../mermaidAPI.js';
import * as configApi from '../../config.js';
import common from '../common/common.js';
import {
  // setAccTitle,
  // getAccTitle,
  // getAccDescription,
  // setAccDescription,
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
let nodes: { [id: string]: Node } = {};

const clear = function () {
  links = [];
  nodes = {};
  commonClear();
};

type Nullable<T> = T | null;

class Link {
  sourceNode: Nullable<Node>;
  targetNode: Nullable<Node>;
  constructor() {
    this.sourceNode = null;
    this.targetNode = null;
  }
}

/**
 * Adds a stream between two elements on the diagram
 *
 * @param sourceNodeID - The id Node where the link starts
 * @param targetNodeID - The id Node where the link ends
 */

interface IAddLink {
  sourceNodeID?: string;
  targetNodeID?: string;
  // amount?: number;
}

const addLink = ({ sourceNodeID, targetNodeID }: IAddLink = {}): Link => {
  const link: Link = new Link();

  if (sourceNodeID !== undefined) {
    link.sourceNode = addNode(sourceNodeID);
  }
  if (targetNodeID !== undefined) {
    link.targetNode = addNode(targetNodeID);
  }

  links.push(link);

  return link;
};

class Node {
  id: string;
  title: string;
  constructor(id: string) {
    this.id = id;
    this.title = id;
  }
}

/**
 * Finds or creates a new Node by ID
 *
 * @param id - The id Node
 */
const addNode = (id: string): Node => {
  id = common.sanitizeText(id, configApi.getConfig());
  if (nodes[id] === undefined) {
    nodes[id] = new Node(id);
  }
  const node = nodes[id];
  return node;
};

export default {
  // sankey interface
  addLink,
  addNode,
  // common DB interface
  // TODO: If this is a must this probably should be an interface
  // getAccTitle,
  // setAccTitle,
  // getAccDescription,
  // setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
  clear,
};
