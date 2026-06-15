import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

/** C4 folder shape: a tabbed rectangle for folder/directory-like elements. */
export async function c4Folder<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 12;
  const w = Math.max(bbox.width + padding * 2, 80);
  const bodyHeight = bbox.height + padding * 2;
  const tabHeight = Math.max(Math.min(bodyHeight * 0.18, 16), 8);
  const tabWidth = Math.max(w * 0.4, 30);
  const totalHeight = bodyHeight + tabHeight;
  const top = -totalHeight / 2;

  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  const d = [
    `M${-w / 2},${top}`,
    `h${tabWidth}`,
    `l8,${tabHeight}`,
    `h${w - tabWidth - 8}`,
    `v${bodyHeight}`,
    `h${-w}`,
    `Z`,
  ].join(' ');

  group.append('path').attr('d', d).attr('style', nodeStyles);

  updateNodeBounds(node, group);

  const bodyCenterY = top + tabHeight + bodyHeight / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
