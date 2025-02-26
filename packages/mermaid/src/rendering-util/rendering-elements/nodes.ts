import { log } from '../../logger.js';
import { shapes } from './shapes.js';
import type { Node, NonClusterNode, ShapeRenderOptions } from '../types.js';
import type { SVGGroup } from '../../mermaid.js';
import type { D3Selection } from '../../types.js';
import type { graphlib } from 'dagre-d3-es';

type ShapeHandler = (typeof shapes)[keyof typeof shapes];
type NodeElement = D3Selection<SVGAElement> | Awaited<ReturnType<ShapeHandler>>;

const nodeElems = new Map<string, NodeElement>();

export async function insertNode(
  elem: SVGGroup,
  node: NonClusterNode,
  renderOptions: ShapeRenderOptions
) {
  let newEl: NodeElement | undefined;
  let el;

  //special check for rect shape (with or without rounded corners)
  if (node.shape === 'rect') {
    if (node.rx && node.ry) {
      node.shape = 'roundedRect';
    } else {
      node.shape = 'squareRect';
    }
  }

  const shapeHandler = node.shape ? shapes[node.shape] : undefined;

  if (!shapeHandler) {
    throw new Error(`No such shape: ${node.shape}. Please check your syntax.`);
  }

  if (node.link) {
    // Add link when appropriate
    let target;
    if (renderOptions.config.securityLevel === 'sandbox') {
      target = '_top';
    } else if (node.linkTarget) {
      target = node.linkTarget || '_blank';
    }
    newEl = elem
      .insert<SVGAElement>('svg:a')
      .attr('xlink:href', node.link)
      .attr('target', target ?? null);
    el = await shapeHandler(newEl, node, renderOptions);
  } else {
    el = await shapeHandler(elem, node, renderOptions);
    newEl = el;
  }
  if (node.tooltip) {
    el.attr('title', node.tooltip);
  }

  nodeElems.set(node.id, newEl);

  if (node.haveCallback) {
    newEl.attr('class', newEl.attr('class') + ' clickable');
  }
  return newEl;
}

export const setNodeElem = (elem: NodeElement, node: Pick<Node, 'id'>) => {
  nodeElems.set(node.id, elem);
};

export const clear = () => {
  nodeElems.clear();
};

export const positionNode = (node: ReturnType<graphlib.Graph['node']>) => {
  const el = nodeElems.get(node.id)!;
  log.trace(
    'Transforming node',
    node.diff,
    node,
    'translate(' + (node.x - node.width / 2 - 5) + ', ' + node.width / 2 + ')'
  );
  const padding = 8;
  const diff = node.diff || 0;
  if (node.clusterNode) {
    el.attr(
      'transform',
      'translate(' +
        (node.x + diff - node.width / 2) +
        ', ' +
        (node.y - node.height / 2 - padding) +
        ')'
    );
  } else {
    el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
  }
  return diff;
};
