import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

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

const MIN_HEIGHT = 25;
const MIN_WIDTH = 50;

export const tiltedCylinder = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPadding = node.look === 'neo' ? nodePadding : nodePadding / 2;
  if (node.width || node.height) {
    node.height = (node.height ?? 0) - labelPadding;
    if (node.height < MIN_HEIGHT) {
      node.height = MIN_HEIGHT;
    }
    const ry = node.height / 2;
    // based on this height, width is calculated
    const rx = ry / (2.5 + node.height / 50);

    node.width = (node.width ?? 0) - labelPadding - rx * 3;
    if (node.width < MIN_WIDTH) {
      node.width = MIN_WIDTH;
    }
  }
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const h = Math.max(bbox.height, node.height ?? 0) + labelPadding;
  const ry = h / 2;
  const rx = ry / (2.5 + h / 50);
  const w = Math.max(bbox.width, node.width ?? 0) + rx + labelPadding;
  const { cssStyles } = node;

  let cylinder: d3.Selection<SVGPathElement | SVGGElement, unknown, null, undefined>;

  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
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
      .attr('style', cssStyles)
      .attr('style', nodeStyles);
  }

  cylinder.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    cylinder.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    cylinder.selectAll('path').attr('style', nodeStyles);
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
