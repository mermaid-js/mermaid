import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import type { D3Selection } from '../../../types.js';

export async function windowPane<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const rectOffset = 5;
  const x = -w / 2;
  const y = -h / 2;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const outerPathPoints = [
    { x: x - rectOffset, y: y - rectOffset },
    { x: x - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y - rectOffset },
  ];

  const path = `M${x - rectOffset},${y - rectOffset} L${x + w},${y - rectOffset} L${x + w},${y + h} L${x - rectOffset},${y + h} L${x - rectOffset},${y - rectOffset}
                M${x - rectOffset},${y} L${x + w},${y}
                M${x},${y - rectOffset} L${x},${y + h}`;

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const no = rc.path(path, options);

  const windowPane = shapeSvg.insert(() => no, ':first-child');
  windowPane.attr('transform', `translate(${rectOffset / 2}, ${rectOffset / 2})`);

  windowPane.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    windowPane.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    windowPane.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) + rectOffset / 2 - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + rectOffset / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, windowPane);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
}
