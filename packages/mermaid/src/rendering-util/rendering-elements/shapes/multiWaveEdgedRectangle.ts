import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';

export function createMultiWaveEdgedRectanglePathD2(width: number, height: number) {
  const offset = -5;
  const offsetX = -offset;
  const offsetY = offset;

  // Calculate control points (same for each layer)
  const rightX = width;
  const midX = width / 2;
  const controlY1 = height * 0.8;
  const controlY2 = height * 1.15;
  const endY = height * 0.94;

  // Construct the path for the current layer with an offset in the opposite direction
  const path = `M${offsetX} ${offsetY} 
                  H${rightX + offsetX} 
                  V${controlY1 + offsetY}
                  C${midX + offsetX} ${controlY1 + offsetY}, ${midX + offsetX} ${controlY2 + offsetY}, ${offsetX} ${endY + offsetY}
                  Z`;
  return path;
}

export function createMultiWaveEdgedRectanglePathD(width: number, height: number) {
  // Calculate control points
  const offset = 0;
  const offsetX = offset;
  const offsetY = offset;

  const rightX = width;
  const midX = width / 2;
  const controlY1 = height * 0.8;
  const controlY2 = height * 1.15;
  const endY = height * 0.94;

  const path = `M${offsetX} ${offsetY} 
                  H${rightX + offsetX} 
                  V${controlY1 + offsetY}
                  C${midX + offsetX} ${controlY1 + offsetY}, ${midX + offsetX} ${controlY2 + offsetY}, ${offsetX} ${endY + offsetY}
                  Z`;
  return path;
}

export function createMultiWaveEdgedRectanglePathD3(width: number, height: number) {
  const offset = 5;
  const offsetX = -offset;
  const offsetY = offset;

  const rightX = width;
  const midX = width / 2;
  const controlY1 = height * 0.8;
  const controlY2 = height * 1.15;
  const endY = height * 0.94;

  const path = `M${offsetX} ${offsetY} 
                  H${rightX + offsetX} 
                  V${controlY1 + offsetY}
                  C${midX + offsetX} ${controlY1 + offsetY}, ${midX + offsetX} ${controlY2 + offsetY}, ${offsetX} ${endY + offsetY}
                  Z`;

  return path;
}

export const multiWaveEdgedRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding + 20;

  const { cssStyles } = node;

  const rectOffset = 5;
  const x = 0,
    y = 0;

  const points = [
    { x: x - rectOffset, y: y + rectOffset },
    { x: x - rectOffset, y: y + h + rectOffset },
    { x: x + w - rectOffset, y: y + h + rectOffset },
    { x: x + w - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y + h - rectOffset },
    { x: x + w + rectOffset, y: y + h - rectOffset },
    { x: x + w + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y },
    { x, y },
    { x, y: y + rectOffset },
  ];

  const pathData = createMultiWaveEdgedRectanglePathD(w, h);
  const pathData2 = createMultiWaveEdgedRectanglePathD2(w, h);
  const pathData3 = createMultiWaveEdgedRectanglePathD3(w, h);

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const shapeNode = rc.path(pathData, options);
  const shapeNode2 = rc.path(pathData2, options);
  const shapeNode3 = rc.path(pathData3, options);

  const shape = shapeSvg.insert('g', ':first-child');
  shape.insert(() => shapeNode3, ':first-child');
  shape.insert(() => shapeNode, ':first-child');
  shape.insert(() => shapeNode2, ':first-child');

  shape.attr('class', 'basic label-container');

  if (cssStyles) {
    shape.attr('style', cssStyles);
  }

  if (nodeStyles) {
    shape.attr('style', nodeStyles);
  }

  shape.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, shape);

  label.attr('transform', `translate(${-(w + 10) / 2}, ${-(h - rectOffset) * 0.3})`);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
