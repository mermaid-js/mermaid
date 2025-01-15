import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getConfig } from '../../../config.js';
import rough from 'roughjs';
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

const MIN_HEIGHT = 8;
const MIN_WIDTH = 8;
export async function cylinder<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { themeVariables } = getConfig();
  const { useGradient } = themeVariables;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 24 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? 16 : nodePadding;

  if (node.width || node.height) {
    const originalWidth = node.width ?? 0;
    node.width = (node.width ?? 0) - labelPaddingY;
    if (node.width < MIN_WIDTH) {
      node.width = MIN_WIDTH;
    }

    const rx = originalWidth / 2;
    const ry = rx / (2.5 + originalWidth / 50);
    node.height = (node.height ?? 0) - labelPaddingX - ry * 3;

    if (node.height < MIN_HEIGHT) {
      node.height = MIN_HEIGHT;
    }
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const w = (node.width ? node.width : bbox.width) + labelPaddingY;
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = (node.height ? node.height : bbox.height) + labelPaddingX + ry;

  let cylinder: D3Selection<SVGPathElement> | D3Selection<SVGGElement>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn' || (node.look === 'neo' && !useGradient)) {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const outerPathData = createOuterCylinderPathD(0, 0, w, h, rx, ry);
    const innerPathData = createInnerCylinderPathD(0, ry, w, h, rx, ry);
    const options = userNodeOverrides(node, {});
    const overrides =
      node.look === 'neo'
        ? {
            roughness: 0,
            stroke: 'none',
            fillStyle: 'solid',
          }
        : {};

    const outerNode = rc.path(outerPathData, { ...options, ...overrides });
    const innerLine = rc.path(innerPathData, { ...options, ...overrides });

    const innerLineEl = shapeSvg.insert(() => innerLine, ':first-child');
    innerLineEl.attr('class', 'neo-line');
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
  }

  // find label and move it down
  cylinder.attr('label-offset-y', ry);
  cylinder.attr('transform', `translate(${-w / 2}, ${-(h / 2 + ry)})`);

  updateNodeBounds(node, cylinder);

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + (node.padding ?? 0) / 1.5 - (bbox.y - (bbox.top ?? 0))})`
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
