import type { UsecaseNode } from '../../../diagrams/usecase/usecaseDB.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { updateNodeBounds, getNodeClasses } from './util.js';
import { userNodeOverrides } from './handDrawnShapeStyles.js';

export function ellipse<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const g = parent.append('g').attr('id', node.id).attr('class', getNodeClasses(node));

  const label = g
    .append('g')
    .attr('class', 'labels')
    .append('text')
    .attr('class', 'nodeLabel')
    .style('font-weight', 600)
    .style('fill', 'black')
    .text(node.label ?? 'TODO');

  const useCaseNode = node.extra as unknown as UsecaseNode;
  const { shapeSvg: multiline } = drawMultilineTexts(
    g.select('g.labels'),
    node,
    (useCaseNode.extensionPoints ?? []).map((x) => `• ${x}`)
  );

  // center label and multiline
  label.attr('x', -label.node()!.getBBox().width / 2);
  multiline.attr(
    'transform',
    `translate(${-multiline.node()!.getBBox().width / 2}, ${label.node()!.getBBox().height + 10})`
  );

  // move them to 0,0
  const labels = g.select('g.labels');
  const labelsBbox = labels.node()!.getBBox();
  const fontHeight = 16;
  labels.attr('transform', `translate(0, ${(fontHeight - labelsBbox.y - labelsBbox.height) / 2})`);

  // Calculate rx and ry to contain the rectangle
  const { width: rectWidth, height: rectHeight } = g.select('g.labels').node()!.getBBox();
  const { rx, ry } = calculateEllipseRadii(rectWidth, rectHeight);

  const padding = 5;

  // add an ellipse
  if (node.look == 'handDrawn') {
    const options = userNodeOverrides(node, {});
    const parentNode = g.node()!;
    const rc = rough.svg(g);
    const firstChild = parentNode.firstChild;
    const newNode = rc.ellipse(0, 0, 2 * (rx + padding), 2 * (ry + padding), options);
    if (firstChild) {
      parentNode.insertBefore(newNode, firstChild);
    } else {
      parentNode.appendChild(newNode);
    }
  } else {
    const _ = g
      .insert('ellipse', ':first-child')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('rx', rx + padding)
      .attr('ry', ry + padding)
      .attr('fill', 'white')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }
  updateNodeBounds(node, g);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return g;
}

/**
 * returns ellipse radii which encloses a rectangle
 * of given width and height
 */
function calculateEllipseRadii(x: number, y: number) {
  const rx = x / Math.SQRT2;
  const ry = y / Math.SQRT2;

  return { rx, ry };
}

/**
 * Draws a line of text for each label in the given array.
 * @param parent - Parent element to append the text to
 * @param node - Node to which the text belongs
 * @param labels - Array of labels to draw
 */
function drawMultilineTexts(parent: D3Selection<SVGGraphicsElement>, node: Node, labels: string[]) {
  const shapeSvg = parent.append('g').style('fill', 'black');
  let cumulativeHeight = 0;
  for (const label of labels) {
    const labelNode = shapeSvg.append('text').text(label);
    labelNode.attr('y', cumulativeHeight);
    cumulativeHeight += labelNode.node()?.getBBox().height ?? 0;
  }
  return { shapeSvg, bbox: shapeSvg.node()!.getBBox() };
}
