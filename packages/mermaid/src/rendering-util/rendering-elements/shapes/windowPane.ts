import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

function getOutPathPoints(x: number, y: number, w: number, h: number, rectOffset: number) {
  return [
    { x: x - rectOffset, y: y - rectOffset },
    { x: x - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y - rectOffset },
  ];
}

/// Width of the frame on the top and left of the shape
const rectOffset = 10;

export async function windowPane<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const paddingX = node.look === 'neo' ? 16 : (node.padding ?? 0);
  const paddingY = node.look === 'neo' ? 12 : (node.padding ?? 0);

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - paddingX * 2 - rectOffset, 10);
    node.height = Math.max((node?.height ?? 0) - paddingY * 2 - rectOffset, 10);
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = (node?.width ? node?.width : bbox.width) + paddingX * 2 + rectOffset;
  const totalHeight = (node?.height ? node?.height : bbox.height) + paddingY * 2 + rectOffset;

  const w = totalWidth - rectOffset;
  const h = totalHeight - rectOffset;
  const x = -w / 2;
  const y = -h / 2;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const outerPathPoints = getOutPathPoints(x, y, w, h, rectOffset);

  const path = `M${x - rectOffset},${y - rectOffset} L${x + w},${y - rectOffset} L${x + w},${y + h} L${x - rectOffset},${y + h} L${x - rectOffset},${y - rectOffset}
                M${x - rectOffset},${y} L${x + w},${y} L${x + w},${y + h} L${x - rectOffset},${y + h} L${x - rectOffset},${y}
                M${x},${y - rectOffset} L${x + w},${y - rectOffset} L${x + w},${y + h} L${x},${y + h} L${x},${y - rectOffset}`;

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const no = rc.path(path, options);

  const windowPane = shapeSvg.insert(() => no, ':first-child');
  windowPane.attr('transform', `translate(${rectOffset / 2}, ${rectOffset / 2})`);

  windowPane.attr('class', 'basic label-container outer-path');

  if (cssStyles && node.look !== 'handDrawn') {
    windowPane.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    windowPane.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) + rectOffset / 2 - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + rectOffset / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, windowPane);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const w = bounds.width;
    const h = bounds.height;
    const rectOffset = 5;
    const x = -w / 2;
    const y = -h / 2;

    const outerPathPoints = getOutPathPoints(x, y, w, h, rectOffset);
    return intersect.polygon(node, outerPathPoints, point);
  };

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
}
