import { log } from '$root/logger.js';
import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

function createLine(r: number) {
  const xAxis45 = Math.cos(Math.PI / 4); // cosine of 45 degrees
  const yAxis45 = Math.sin(Math.PI / 4); // sine of 45 degrees
  const lineLength = r * 2;

  const pointQ1 = { x: (lineLength / 2) * xAxis45, y: (lineLength / 2) * yAxis45 }; // Quadrant I
  const pointQ2 = { x: -(lineLength / 2) * xAxis45, y: (lineLength / 2) * yAxis45 }; // Quadrant II
  const pointQ3 = { x: -(lineLength / 2) * xAxis45, y: -(lineLength / 2) * yAxis45 }; // Quadrant III
  const pointQ4 = { x: (lineLength / 2) * xAxis45, y: -(lineLength / 2) * yAxis45 }; // Quadrant IV

  return `M ${pointQ2.x},${pointQ2.y} L ${pointQ4.x},${pointQ4.y}
                   M ${pointQ1.x},${pointQ1.y} L ${pointQ3.x},${pointQ3.y}`;
}

export const crossedCircle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, halfPadding } = await labelHelper(parent, node, getNodeClasses(node));
  const radius = Math.max(bbox.width, bbox.height) / 2 + halfPadding;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const circleNode = rc.circle(0, 0, radius * 2, options);
  const linePath = createLine(radius);
  const lineNode = rc.path(linePath, options);

  const crossedCircle = shapeSvg.insert('g', ':first-child');
  crossedCircle.insert(() => circleNode, ':first-child');
  crossedCircle.insert(() => lineNode);

  crossedCircle.attr('class', 'basic label-container');

  if (cssStyles) {
    crossedCircle.attr('style', cssStyles);
  }

  if (nodeStyles) {
    crossedCircle.attr('style', nodeStyles);
  }

  updateNodeBounds(node, crossedCircle);

  node.intersect = function (point) {
    log.info('crossedCircle intersect', node, { radius, point });
    const pos = intersect.circle(node, radius, point);
    return pos;
  };

  return shapeSvg;
};
