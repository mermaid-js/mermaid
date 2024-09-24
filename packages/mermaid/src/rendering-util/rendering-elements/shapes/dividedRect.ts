import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

export const dividedRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const paddingX = node.look === 'neo' ? (node.padding ?? 0) * 2 : (node.padding ?? 0);
  const paddingY = node.look === 'neo' ? (node.padding ?? 0) * 1 : (node.padding ?? 0);
  const w = Math.max(bbox.width + paddingX * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + paddingY * 2, node?.height ?? 0);
  const rectOffset = h * 0.2;

  const x = -w / 2;
  const y = -h / 2 - rectOffset / 2;

  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
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

  label.attr(
    'transform',
    `translate(${x + paddingX - (bbox.x - (bbox.left ?? 0))}, ${y + rectOffset + paddingY - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
