import rough from 'roughjs';
import type { Node } from '../../types.d.ts';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

export const shadedProcess = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const halfPadding = node?.padding ?? 0;
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const roughNode = rc.rectangle(x - 8, y, w + 16, h, options);
  const l1 = rc.line(x, y, x, y + h, options);

  const rect = shapeSvg.insert(() => l1, ':first-child');
  rect.insert(() => roughNode, ':first-child');

  rect.attr('class', 'basic label-container').attr('style', cssStyles);

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
};

export default shadedProcess;
