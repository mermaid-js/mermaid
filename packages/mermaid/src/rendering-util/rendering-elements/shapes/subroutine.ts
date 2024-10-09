import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';
import { getConfig } from '../../../config.js';

export const createSubroutinePathD = (
  x: number,
  y: number,
  width: number,
  height: number
): string => {
  const offset = 8;
  return [
    `M${x - offset},${y}`,
    `H${x + width + offset}`,
    `V${y + height}`,
    `H${x - offset}`,
    `V${y}`,
    'M',
    x,
    y,
    'H',
    x + width,
    'V',
    y + height,
    'H',
    x,
    'Z',
  ].join(' ');
};

// width of the frame on the left and right side of the shape
const FRAME_WIDTH = 8;

export const subroutine = async (parent: SVGAElement, node: Node) => {
  const { themeVariables } = getConfig();
  const { useGradient } = themeVariables;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const nodePadding = node?.padding || 8;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 3 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding;

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - labelPaddingX - 2 * FRAME_WIDTH, 10);
    node.height = Math.max((node?.height ?? 0) - labelPaddingY, 10);
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = (node?.width ? node?.width : bbox.width) + 2 * FRAME_WIDTH + labelPaddingX;
  const totalHeight = (node?.height ? node?.height : bbox.height) + labelPaddingY;

  const w = totalWidth - 2 * FRAME_WIDTH;
  const h = totalHeight;
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: 0, y: -h },
    { x: 0, y: 0 },
    { x: -FRAME_WIDTH, y: 0 },
    { x: w + FRAME_WIDTH, y: 0 },
    { x: w + FRAME_WIDTH, y: -h },
    { x: -FRAME_WIDTH, y: -h },
    { x: -FRAME_WIDTH, y: 0 },
  ];

  if (node.look === 'handDrawn' || (node.look === 'neo' && !useGradient)) {
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    if (node.look === 'neo') {
      options.roughness = 0;
      options.fillStyle = 'solid';
    }

    const roughNode = rc.rectangle(x - FRAME_WIDTH, y, w + 2 * FRAME_WIDTH, h, options);
    const l1 = rc.line(x, y, x, y + h, options);
    const l2 = rc.line(x + w, y, x + w, y + h, options);

    const l1El = shapeSvg.insert(() => l1, ':first-child');
    const l2El = shapeSvg.insert(() => l2, ':first-child');
    l1El.attr('class', 'neo-line');
    l2El.attr('class', 'neo-line');
    const rect = shapeSvg.insert(() => roughNode, ':first-child');
    const { cssStyles } = node;
    rect.attr('class', 'basic label-container').attr('style', cssStyles);
    updateNodeBounds(node, rect);
  } else {
    const el = insertPolygonShape(shapeSvg, w, h, points);
    if (nodeStyles) {
      el.attr('style', nodeStyles);
    }
    updateNodeBounds(node, el);
  }

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
