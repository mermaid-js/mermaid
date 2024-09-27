import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.d.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

/// Width of the frame on the left of the shape
const FRAME_WIDTH = 8;

export const shadedProcess = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const paddingX = node.look === 'neo' ? (node.padding ?? 0) * 2 : (node.padding ?? 0);
  const paddingY = node.look === 'neo' ? (node.padding ?? 0) * 1 : (node.padding ?? 0);

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - paddingX * 2 - FRAME_WIDTH, 50);
    node.height = Math.max((node?.height ?? 0) - paddingY * 2, 50);
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = Math.max(bbox.width, node?.width ?? 0) + paddingX * 2 + FRAME_WIDTH;
  const totalHeight = Math.max(bbox.height, node?.height ?? 0) + paddingY * 2;
  const w = totalWidth - FRAME_WIDTH;
  const h = totalHeight;
  const x = -(totalWidth - FRAME_WIDTH) / 2;
  const y = -totalHeight / 2;

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
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

  rect.attr('class', 'basic label-container').attr('style', cssStyles);

  if (nodeStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  if (cssStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

export default shadedProcess;
