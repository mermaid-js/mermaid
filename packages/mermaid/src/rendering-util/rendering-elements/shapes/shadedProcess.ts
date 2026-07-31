import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

/// Width of the frame on the left of the shape
const FRAME_WIDTH = 8;

export async function shadedProcess<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const paddingX = node.look === 'neo' ? 16 : (node.padding ?? 0);
  const paddingY = node.look === 'neo' ? 12 : (node.padding ?? 0);
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const totalWidth =
    (node?.width ?? bbox.width) +
    paddingX * 2 +
    (node.look === 'neo' ? FRAME_WIDTH : FRAME_WIDTH * 2);
  const totalHeight = (node?.height ?? bbox.height) + paddingY * 2;
  const w = totalWidth - FRAME_WIDTH;
  const h = totalHeight;
  const x = FRAME_WIDTH - totalWidth / 2;
  const y = -totalHeight / 2;

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
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x: x - FRAME_WIDTH, y: y + h },
    { x: x - FRAME_WIDTH, y: y },
    { x, y },
    { x, y: y + h },
  ];

  const roughNode = rc.polygon(
    points.map((p) => [p.x, p.y]),
    options
  );

  const rect = shapeSvg.insert(() => roughNode, ':first-child');

  rect
    .attr('class', 'basic label-container outer-path')
    .attr('style', handleUndefinedAttr(cssStyles));

  if (nodeStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  if (cssStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  // The inner main rect is centered at FRAME_WIDTH/2, not at 0.
  // Shift the label right by FRAME_WIDTH/2 so it's centered inside the main rect.
  label.attr(
    'transform',
    `translate(${FRAME_WIDTH / 2 - bbox.width / 2 - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
