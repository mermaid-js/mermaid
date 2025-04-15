import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

export const createCylinderPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number
): string => {
  return `M${x},${y}
    a${rx},${ry} 0,0,1 ${0},${-height}
    l${width},${0}
    a${rx},${ry} 0,0,1 ${0},${height}
    M${width},${-height}
    a${rx},${ry} 0,0,0 ${0},${height}
    l${-width},${0}`;
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
    `M${x},${y}`,
    `M${x + width},${y}`,
    `a${rx},${ry} 0,0,0 ${0},${-height}`,
    `l${-width},0`,
    `a${rx},${ry} 0,0,0 ${0},${height}`,
    `l${width},0`,
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
  return [`M${x + width / 2},${-height / 2}`, `a${rx},${ry} 0,0,0 0,${height}`].join(' ');
};

export async function tiltedCylinder<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label, halfPadding } = await labelHelper(
    parent,
    node,
    getNodeClasses(node)
  );
  const labelPadding = node.look === 'neo' ? halfPadding * 2 : halfPadding;
  const h = bbox.height + labelPadding;
  const ry = h / 2;
  const rx = ry / (2.5 + h / 50);
  const w = bbox.width + rx + labelPadding;
  const { cssStyles } = node;

  let cylinder: D3Selection<SVGGElement> | D3Selection<SVGPathElement>;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const outerPathData = createOuterCylinderPathD(0, 0, w, h, rx, ry);
    const innerPathData = createInnerCylinderPathD(0, 0, w, h, rx, ry);
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
      .attr('style', handleUndefinedAttr(cssStyles))
      .attr('style', nodeStyles);
    cylinder.attr('class', 'basic label-container');

    if (cssStyles) {
      cylinder.selectAll('path').attr('style', cssStyles);
    }

    if (nodeStyles) {
      cylinder.selectAll('path').attr('style', nodeStyles);
    }
  }

  cylinder.attr('label-offset-x', rx);
  cylinder.attr('transform', `translate(${-w / 2}, ${h / 2} )`);

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rx - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, cylinder);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    const y = pos.y - (node.y ?? 0);

    if (
      ry != 0 &&
      (Math.abs(y) < (node.height ?? 0) / 2 ||
        (Math.abs(y) == (node.height ?? 0) / 2 &&
          Math.abs(pos.x - (node.x ?? 0)) > (node.width ?? 0) / 2 - rx))
    ) {
      let x = rx * rx * (1 - (y * y) / (ry * ry));
      if (x != 0) {
        x = Math.sqrt(Math.abs(x));
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
}
