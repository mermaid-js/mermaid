import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

export async function shadedProcess<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const halfPadding = node?.padding ?? 0;
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;

  const { cssStyles } = node;
  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x, y },
    { x: x + w + 8, y },
    { x: x + w + 8, y: y + h },
    { x: x - 8, y: y + h },
    { x: x - 8, y: y },
    { x, y },
    { x, y: y + h },
  ];

  const roughNode = rc.polygon(
    points.map((p) => [p.x, p.y]),
    options
  );

  const rect = shapeSvg.insert(() => roughNode, ':first-child');

  rect.attr('class', 'basic label-container').attr('style', handleUndefinedAttr(cssStyles));

  if (nodeStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  if (cssStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-w / 2 + 4 + (node.padding ?? 0) - (bbox.x - (bbox.left ?? 0))},${-h / 2 + (node.padding ?? 0) - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
