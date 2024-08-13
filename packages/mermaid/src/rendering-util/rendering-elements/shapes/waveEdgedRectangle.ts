import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';

export function createWaveEdgedRectanglePathD(width: number, height: number) {
  // Calculate control points
  const rightX = width;
  const midX = width / 2;
  const controlY1 = height * 0.8;
  const controlY2 = height * 1.15;
  const endY = height * 0.94;

  // Construct the path
  const path = `M0 0 
                H${rightX} 
                V${controlY1}
                C${midX} ${controlY1}, ${midX} ${controlY2}, 0 ${endY}
                Z`;

  return path;
}

export const waveEdgedRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding + 20;

  const { cssStyles } = node;

  const rightX = w;
  const midX = w / 2;
  const controlY1 = h * 0.8;
  const controlY2 = h * 1.15;
  const endY = h * 0.94;

  const points = [
    { x: 0, y: 0 },
    { x: rightX, y: 0 },
    { x: rightX, y: controlY1 },
    { x: midX, y: controlY1 },
    { x: midX, y: controlY2 * 0.8 },
    { x: 0, y: endY },
  ];
  const pathData = createWaveEdgedRectanglePathD(w, h);

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const shapeNode = rc.path(pathData, options);
  const shape = shapeSvg.insert(() => shapeNode, ':first-child');
  shape.attr('class', 'basic label-container');

  if (cssStyles) {
    shape.attr('style', cssStyles);
  }

  if (nodeStyles) {
    shape.attr('style', nodeStyles);
  }

  shape.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, shape);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
