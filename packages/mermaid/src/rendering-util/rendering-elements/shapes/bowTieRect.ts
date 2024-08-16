import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

function createBowTieRectPathD(x: number, y: number, totalWidth: number, totalHeight: number) {
  return `M ${x},${y + totalHeight} A ${totalHeight} ${totalHeight} 0 0 1 ${x} ${y} H${x + totalWidth} A ${totalHeight} ${totalHeight} 0 0 0 ${x + totalWidth} ${y + totalHeight}Z`;
}

export const bowTieRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + node.padding + 20;
  const h = bbox.height + node.padding;

  let shape: d3.Selection<SVGPathElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  const points = [
    { x: 0, y: h },
    { x: w / 2, y: h },
    { x: w * 1.1, y: h },
    { x: w, y: h / 2 },
    { x: w * 1.1, y: 0 },
    { x: w / 2, y: 0 },
    { x: 0, y: 0 },
  ];

  const pathData = createBowTieRectPathD(w * 0.05, 0, w, h);

  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const shapeNode = rc.path(pathData, options);
    shape = shapeSvg.insert(() => shapeNode, ':first-child');
    shape.attr('class', 'basic label-container');
    if (cssStyles) {
      shape.attr('style', cssStyles);
    }
  } else {
    shape = shapeSvg
      .insert('path', ':first-child')
      .attr('d', pathData)
      .attr('class', 'basic label-container')
      .attr('style', cssStyles)
      .attr('style', nodeStyles);
  }

  shape.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, shape);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    const rx = h;
    const ry = h;
    const y = pos.y - (node.y ?? 0);

    if (
      ry != 0 &&
      (Math.abs(y) < (node.height ?? 0) / 2 ||
        (Math.abs(y) == (node.height ?? 0) / 2 &&
          Math.abs(pos.x - (node.x ?? 0)) > (node.width ?? 0) / 2 - rx))
    ) {
      let x = rx * rx * (1 - (y * y) / (ry * ry));
      if (x != 0) {
        x = Math.sqrt(x);
      }
      x = rx - x;
      if (point.x - (node.x ?? 0) > 0) {
        x = -x;
      }

      pos.x += x;
    }

    return pos;
  };

  return shapeSvg;
};
