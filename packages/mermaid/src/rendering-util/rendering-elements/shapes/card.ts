import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

import { insertPolygonShape } from './insertPolygonShape.js';
import { createPathFromPoints } from './util.js';
import type { D3Selection } from '../../../types.js';

// const createPathFromPoints = (points: { x: number; y: number }[]): string => {
//   const pointStrings = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`);
//   pointStrings.push('Z');
//   return pointStrings.join(' ');
// };

/// Size of the notch on the top left corner
const NOTCH_SIZE = 12;

export async function card<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 28 : 0;
  const labelPaddingY = node.look === 'neo' ? 24 : nodePadding;
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - (labelPaddingX ?? 0), 10);
    node.height = Math.max((node?.height ?? 0) - (labelPaddingY ?? 0), 10);
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = (node?.width ? node?.width : bbox.width) + (labelPaddingX ?? 0);
  const totalHeight = (node?.height ? node?.height : bbox.height) + (labelPaddingY ?? 0);

  const h = totalHeight;
  const w = totalWidth;
  const left = 0;
  const right = w;
  const top = -h;
  const bottom = 0;
  const points = [
    { x: left + NOTCH_SIZE, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
    { x: left, y: top + NOTCH_SIZE },
    { x: left + NOTCH_SIZE, y: top },
  ];

  let polygon: D3Selection<SVGGElement> | Awaited<ReturnType<typeof insertPolygonShape>>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createPathFromPoints(points);
    const roughNode = rc.path(pathData, options);

    polygon = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('transform', `translate(${-w / 2}, ${h / 2})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, w, h, points);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
