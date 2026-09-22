import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

/** Folder shape: a rectangle with a raised tab on its top-left edge. */
export async function folder<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 12;
  const w = Math.max(bbox.width + padding * 2, node.width ?? 0, 90);
  const contentHeight = bbox.height + padding * 2;
  const tabHeight = Math.max(Math.min(contentHeight * 0.16, 14), 8);
  const totalHeight = Math.max(contentHeight + tabHeight, node.height ?? 0);
  const bodyHeight = totalHeight - tabHeight;
  const tabWidth = Math.max(w * 0.38, 28);
  const top = -totalHeight / 2;

  const points = [
    { x: -w / 2, y: top },
    { x: -w / 2 + tabWidth, y: top },
    { x: -w / 2 + tabWidth, y: top + tabHeight },
    { x: w / 2, y: top + tabHeight },
    { x: w / 2, y: totalHeight / 2 },
    { x: -w / 2, y: totalHeight / 2 },
  ];

  const pathData = [
    `M${points[0].x},${points[0].y}`,
    ...points.slice(1).map((p) => `L${p.x},${p.y}`),
    'Z',
  ].join(' ');

  const { cssStyles } = node;
  let folderShape: D3Selection<SVGPathElement> | D3Selection<SVGGElement>;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.path(pathData, userNodeOverrides(node, {}));
    folderShape = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('class', 'basic label-container');
    if (cssStyles) {
      folderShape.attr('style', cssStyles);
    }
  } else {
    folderShape = shapeSvg
      .insert('path', ':first-child')
      .attr('d', pathData)
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles);
  }

  if (node.look === 'handDrawn') {
    // The rough path can overflow its nominal box, so measure the DOM.
    updateNodeBounds(node, folderShape);
  } else {
    updateNodeBounds(node, folderShape, { width: w, height: totalHeight });
  }

  const bodyCenterY = top + tabHeight + bodyHeight / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
