/* eslint-disable @typescript-eslint/no-explicit-any */
import { log } from '../../logger.js';
import type { SVG } from '../../mermaid.js';
import type { Node, ShapeRenderOptions } from '../types.js';
import { shapes } from './shapes.js';

// TODO: Need a better name for the class.
export class Nodes {
  private readonly nodeElems = new Map();
  positionNode = (node: any) => {
    const el = this.nodeElems.get(node.id);
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
  setNodeElem = (elem: any, node: any) => {
    this.nodeElems.set(node.id, elem);
  };
  insertNode = async (elem: SVG, node: Node, renderOptions: ShapeRenderOptions) => {
    let newEl: any;
    let el: any;

    //special check for rect shape (with or without rounded corners)
    if (node.shape === 'rect') {
      if (node.rx && node.ry) {
        node.shape = 'roundedRect';
      } else {
        node.shape = 'squareRect';
      }
    }

    if (!node.shape) {
      throw new Error(`No shape defined for node ${node.id}. Please check your syntax.`);
    }

    const shapeHandler = shapes[node.shape];

    if (!shapeHandler) {
      throw new Error(`No such shape: ${node.shape}. Please check your syntax.`);
    }

    if (node.link) {
      // Add link when appropriate
      const target =
        renderOptions.config.securityLevel === 'sandbox' ? '_top' : (node.linkTarget ?? '_blank');
      newEl = elem.insert('svg:a').attr('xlink:href', node.link).attr('target', target);
      el = await shapeHandler(newEl, node, renderOptions);
    } else {
      el = await shapeHandler(elem, node, renderOptions);
      newEl = el;
    }
    if (node.tooltip) {
      el.attr('title', node.tooltip);
    }

    this.nodeElems.set(node.id, newEl);

    if (node.haveCallback) {
      this.nodeElems
        .get(node.id)
        .attr('class', this.nodeElems.get(node.id).attr('class') + ' clickable');
    }
    return newEl;
  };
}
