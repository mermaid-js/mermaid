import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

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

export async function subroutine<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const halfPadding = (node?.padding || 0) / 2;
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;

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

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    const roughNode = rc.rectangle(x - 8, y, w + 16, h, options);
    const l1 = rc.line(x, y, x, y + h, options);
    const l2 = rc.line(x + w, y, x + w, y + h, options);

    shapeSvg.insert(() => l1, ':first-child');
    shapeSvg.insert(() => l2, ':first-child');
    const rect = shapeSvg.insert(() => roughNode, ':first-child');
    const { cssStyles } = node;
    rect.attr('class', 'basic label-container').attr('style', handleUndefinedAttr(cssStyles));
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
}
