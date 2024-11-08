import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

export async function dividedRectangle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const paddingX = node.look === 'neo' ? (node.padding ?? 0) * 2 : (node.padding ?? 0);
  const paddingY = node.look === 'neo' ? (node.padding ?? 0) * 1 : (node.padding ?? 0);

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - paddingX * 2, 10);
    node.height = Math.max((node?.height ?? 0) - paddingY * 2, 10);
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = (node?.width ? node?.width : bbox.width) + paddingX * 2;
  const totalHeight = (node?.height ? node?.height : bbox.height) + paddingY * 2;

  const rectOffset = totalHeight * 0.2;

  const w = totalWidth;
  const h = totalHeight - rectOffset;
  const x = -w / 2;
  const y = -h / 2 - rectOffset / 2;

  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});
  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const pts = [
    { x, y: y + rectOffset },
    { x: -x, y: y + rectOffset },
    { x: -x, y: -y },
    { x, y: -y },
    { x, y },
    { x: -x, y },
    { x: -x, y: y + rectOffset },
  ];

  const poly = rc.polygon(
    pts.map((p) => [p.x, p.y]),
    options
  );

  const polygon = shapeSvg.insert(() => poly, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectAll('path').attr('style', nodeStyles);
  }

  // place the label in the center of the lower half of the divided rectangle
  label.attr(
    'transform',
    `translate(${-bbox.width / 2}, ${-bbox.height / 2 - rectOffset / 2 + rectOffset})`
  );

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
}
