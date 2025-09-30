import { log } from '../../logger.js';
import { shapes } from './shapes.js';
import type { Node, NonClusterNode, ShapeRenderOptions } from '../types.js';
import type { SVGGroup } from '../../mermaid.js';
import type { D3Selection } from '../../types.js';
import type { graphlib } from 'dagre-d3-es';
import { getIconSVG, isIconAvailable } from '../icons.js';

type ShapeHandler = (typeof shapes)[keyof typeof shapes];
type NodeElement = D3Selection<SVGAElement> | Awaited<ReturnType<ShapeHandler>>;

const nodeElems = new Map<string, NodeElement>();

async function renderNodeIcon(
  parentElement: NodeElement,
  node: Node,
  isCircle: boolean,
  section: number
) {
  if (!node.icon) {
    return;
  }

  let iconName = node.icon;
  const isCssFormat = iconName.includes(' ');
  if (isCssFormat) {
    iconName = iconName.replace(' ', ':');
  }

  const iconSize = 30;
  const nodeWidth = node.width || 100;

  const getTransform = () => {
    if (isCircle) {
      const iconPadding = isCssFormat ? 15 : 20; // fallback padding
      const radius = nodeWidth / 2;
      return `translate(${-radius + iconSize / 2 + iconPadding}, 0)`;
    } else {
      return `translate(${-nodeWidth / 2 + iconSize / 2 + 10}, 0)`;
    }
  };

  const createForeignObject = (x: number, y: number) => {
    const foreignObjectElem = parentElement
      .append('foreignObject')
      .attr('width', `${iconSize}px`)
      .attr('height', `${iconSize}px`)
      .attr('x', x)
      .attr('y', y)
      .attr(
        'style',
        'display: flex; align-items: center; justify-content: center; text-align: center;'
      );

    foreignObjectElem
      .append('div')
      .attr('class', 'icon-container')
      .attr(
        'style',
        'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;'
      )
      .append('i')
      .attr(
        'class',
        `node-icon-${section} ${isCssFormat ? (node.icon ?? '') : (node.icon ?? '').replace(':', ' ')}`
      )
      .attr('style', `font-size: ${iconSize}px;`);

    return foreignObjectElem;
  };

  try {
    if (await isIconAvailable(iconName)) {
      const iconSvg = await getIconSVG(
        iconName,
        { width: iconSize, height: iconSize },
        { class: 'label-icon' }
      );
      const iconElem = parentElement.append('g').html(`<g>${iconSvg}</g>`);
      iconElem.attr('transform', getTransform());
      iconElem.attr('style', 'color: currentColor;');
      return;
    }
  } catch (error) {
    log.debug('SVG icon rendering failed, falling back to CSS:', error);
  }

  if (isCircle) {
    const radius = nodeWidth / 2;
    createForeignObject(-radius + 15, -iconSize / 2);
  } else {
    createForeignObject(-nodeWidth / 2 + 30, -iconSize / 2);
  }
}

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

  if (node.icon && newEl) {
    const section = node.section || 0;
    const isCircle = node.shape === 'circle' || node.shape === 'mindmapCircle';

    await renderNodeIcon(newEl, node, isCircle, section);
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
