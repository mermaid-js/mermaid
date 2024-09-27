import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

/// Width of the frame on the top and left of the shape
const rectOffset = 5;

export const windowPane = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const paddingX = node.look === 'neo' ? (node.padding ?? 0) * 2 : (node.padding ?? 0);
  const paddingY = node.look === 'neo' ? (node.padding ?? 0) * 2 : (node.padding ?? 0);

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - paddingX * 2 - rectOffset, 50);
    node.height = Math.max((node?.height ?? 0) - paddingY * 2 - rectOffset, 50);
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = Math.max(bbox.width, node?.width ?? 0) + paddingX * 2 + rectOffset;
  const totalHeight = Math.max(bbox.height, node?.height ?? 0) + paddingY * 2 + rectOffset;

  const w = totalWidth - rectOffset;
  const h = totalHeight - rectOffset;
  const x = -w / 2;
  const y = -h / 2;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const outerPathPoints = [
    { x: x - rectOffset, y: y - rectOffset },
    { x: x - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y - rectOffset },
  ];

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

  windowPane.attr('class', 'basic label-container');

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

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
};
