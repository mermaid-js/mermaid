import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

export const createCylinderPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number
): string => {
  return [
    `M${x},${y + ry}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `a${rx},${ry} 0,0,0 ${-width},0`,
    `l0,${height}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `l0,${-height}`,
  ].join(' ');
};
export const createOuterCylinderPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number
): string => {
  return [
    `M${x},${y + ry}`,
    `M${x + width},${y + ry}`,
    `a${rx},${ry} 0,0,0 ${-width},0`,
    `l0,${height}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `l0,${-height}`,
  ].join(' ');
};
export const createInnerCylinderPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number
): string => {
  return [`M${x - width / 2},${-height / 2}`, `a${rx},${ry} 0,0,0 ${width},0`].join(' ');
};
export const cylinder = async (parent: SVGAElement, node: Node) => {
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = bbox.width + node.padding;
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = bbox.height + ry + node.padding;

  let cylinder: d3.Selection<SVGPathElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handdrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const outerPathData = createOuterCylinderPathD(0, 0, w, h, rx, ry);
    const innerPathData = createInnerCylinderPathD(0, ry, w, h, rx, ry);
    const outerNode = rc.path(outerPathData, userNodeOverrides(node, {}));
    const innerLine = rc.path(innerPathData, userNodeOverrides(node, { fill: 'none' }));

    cylinder = shapeSvg.insert(() => innerLine, ':first-child');
    cylinder = shapeSvg.insert(() => outerNode, ':first-child');
    cylinder.attr('class', 'basic label-container');
    if (cssStyles) {
      cylinder.attr('style', cssStyles);
    }
  } else {
    const pathData = createCylinderPathD(0, 0, w, h, rx, ry);
    cylinder = shapeSvg
      .insert('path', ':first-child')
      .attr('d', pathData)
      .attr('class', 'basic label-container')
      .attr('style', cssStyles);
  }

  cylinder.attr('label-offset-y', ry);
  cylinder.attr('transform', `translate(${-w / 2}, ${-(h / 2 + ry)})`);

  updateNodeBounds(node, cylinder);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    const x = pos.x - (node.x ?? 0);

    if (
      rx != 0 &&
      (Math.abs(x) < (node.width ?? 0) / 2 ||
        (Math.abs(x) == (node.width ?? 0) / 2 &&
          Math.abs(pos.y - (node.y ?? 0)) > (node.height ?? 0) / 2 - ry))
    ) {
      let y = ry * ry * (1 - (x * x) / (rx * rx));
      if (y != 0) {
        y = Math.sqrt(y);
      }
      y = ry - y;
      if (point.y - (node.y ?? 0) > 0) {
        y = -y;
      }

      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
};
