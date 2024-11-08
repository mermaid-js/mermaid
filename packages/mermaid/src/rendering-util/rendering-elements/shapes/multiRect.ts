import { labelHelper, getNodeClasses, updateNodeBounds, createPathFromPoints } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import type { D3Selection } from '../../../types.js';

export async function multiRect<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;
  const rectOffset = node.look === 'neo' ? 10 : 5;

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - labelPaddingX * 2 - 2 * rectOffset, 10);
    node.height = Math.max((node?.height ?? 0) - labelPaddingY * 2 - 2 * rectOffset, 10);
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = (node?.width ? node?.width : bbox.width) + labelPaddingX * 2 + 2 * rectOffset;
  const totalHeight =
    (node?.height ? node?.height : bbox.height) + labelPaddingY * 2 + 2 * rectOffset;

  const w = totalWidth - 2 * rectOffset;
  const h = totalHeight - 2 * rectOffset;

  const x = -w / 2;
  const y = -h / 2;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  const outerPathPoints = [
    { x: x - rectOffset, y: y + rectOffset },
    { x: x - rectOffset, y: y + h + rectOffset },
    { x: x + w - rectOffset, y: y + h + rectOffset },
    { x: x + w - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y + h - rectOffset },
    { x: x + w + rectOffset, y: y + h - rectOffset },
    { x: x + w + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y - rectOffset },
    { x: x + rectOffset, y: y },
    { x, y },
    { x, y: y + rectOffset },
  ];

  const innerPathPoints = [
    { x, y: y + rectOffset },
    { x: x + w - rectOffset, y: y + rectOffset },
    { x: x + w - rectOffset, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y },
    { x, y },
  ];

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const outerPath = createPathFromPoints(outerPathPoints);
  const outerNode = rc.path(outerPath, options);
  const innerPath = createPathFromPoints(innerPathPoints);
  const innerNode = rc.path(innerPath, options);

  const multiRect = shapeSvg.insert('g', ':first-child');
  multiRect.insert(() => outerNode);
  multiRect.insert(() => innerNode);

  multiRect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    multiRect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    multiRect.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rectOffset - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + rectOffset - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, multiRect);

  node.intersect = function (point) {
    const pos = intersect.polygon(node, outerPathPoints, point);
    return pos;
  };

  return shapeSvg;
}
