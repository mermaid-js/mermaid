import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

export const createCylinderPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number,
  outerOffset: number
): string => {
  return [
    `M${x},${y + ry}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `a${rx},${ry} 0,0,0 ${-width},0`,
    `l0,${height}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `l0,${-height}`,
    `M${x},${y + ry + outerOffset}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
  ].join(' ');
};
export const createOuterCylinderPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number,
  outerOffset: number
): string => {
  return [
    `M${x},${y + ry}`,
    `M${x + width},${y + ry}`,
    `a${rx},${ry} 0,0,0 ${-width},0`,
    `l0,${height}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
    `l0,${-height}`,
    `M${x},${y + ry + outerOffset}`,
    `a${rx},${ry} 0,0,0 ${width},0`,
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
export async function linedCylinder<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0), node.width ?? 0);
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = Math.max(bbox.height + ry + (node.padding ?? 0), node.height ?? 0);
  const outerOffset = h * 0.1; // 10% of height

  let cylinder: typeof shapeSvg | D3Selection<SVGPathElement>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const outerPathData = createOuterCylinderPathD(0, 0, w, h, rx, ry, outerOffset);
    const innerPathData = createInnerCylinderPathD(0, ry, w, h, rx, ry);
    const options = userNodeOverrides(node, {});

    const outerNode = rc.path(outerPathData, options);
    const innerLine = rc.path(innerPathData, options);

    const innerLineEl = shapeSvg.insert(() => innerLine, ':first-child');
    innerLineEl.attr('class', 'line');
    cylinder = shapeSvg.insert(() => outerNode, ':first-child');
    cylinder.attr('class', 'basic label-container');
    if (cssStyles) {
      cylinder.attr('style', cssStyles);
    }
  } else {
    const pathData = createCylinderPathD(0, 0, w, h, rx, ry, outerOffset);
    cylinder = shapeSvg
      .insert('path', ':first-child')
      .attr('d', pathData)
      .attr('class', 'basic label-container')
      .attr('style', handleUndefinedAttr(cssStyles))
      .attr('style', nodeStyles);
  }

  // find label and move it down
  cylinder.attr('label-offset-y', ry);
  cylinder.attr('transform', `translate(${-w / 2}, ${-(h / 2 + ry)})`);

  updateNodeBounds(node, cylinder);

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + ry - (bbox.y - (bbox.top ?? 0))})`
  );

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
      if (y > 0) {
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
}
