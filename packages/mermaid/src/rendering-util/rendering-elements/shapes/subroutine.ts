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

export const subroutine = async (parent: SVGAElement, node: Node) => {
  const { themeVariables } = getConfig();
  const { useGradient } = themeVariables;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const nodePadding = node?.padding || 8;
  // const labelPaddingX = node.padding;
  // const labelPaddingY = node.padding;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 3 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding;
  const w = bbox.width + labelPaddingX;
  const h = bbox.height + labelPaddingY;
  const x = -bbox.width / 2 - labelPaddingX / 2;
  const y = -bbox.height / 2 - labelPaddingY / 2;

  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: 0, y: -h },
    { x: 0, y: 0 },
    { x: -8, y: 0 },
    { x: w + 8, y: 0 },
    { x: w + 8, y: -h },
    { x: -8, y: -h },
    { x: -8, y: 0 },
  ];

  if (node.look === 'handDrawn' || (node.look === 'neo' && !useGradient)) {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    if (node.look === 'neo') {
      options.roughness = 0;
      options.fillStyle = 'solid';
    }

    const roughNode = rc.rectangle(x - 8, y, w + 16, h, options);
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

export default subroutine;
