import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

export async function slopedRect<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const x = -w / 2;
  const y = -h / 2;

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
    { x, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y - h / 2 },
  ];

  const pathData = createPathFromPoints(points);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(0, ${h / 4})`);
  label.attr(
    'transform',
    `translate(${-w / 2 + (node.padding ?? 0) - (bbox.x - (bbox.left ?? 0))}, ${-h / 4 + (node.padding ?? 0) - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
