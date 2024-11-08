import rough from 'roughjs';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';
import { getConfig } from '../../../config.js';

export async function note<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const useHtmlLabels = node.useHtmlLabels || getConfig().flowchart?.htmlLabels !== false;
  if (!useHtmlLabels) {
    node.centerLabel = true;
  }
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const totalWidth = Math.max(bbox.width + (node.padding ?? 0) * 2, node?.width ?? 0);
  const totalHeight = Math.max(bbox.height + (node.padding ?? 0) * 2, node?.height ?? 0);
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;
  const { cssStyles } = node;

  // add the rect
  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {
    fill: themeVariables.noteBkgColor,
    stroke: themeVariables.noteBorderColor,
  });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const noteShapeNode = rc.rectangle(x, y, totalWidth, totalHeight, options);

  const rect = shapeSvg.insert(() => noteShapeNode, ':first-child');
  rect.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    rect.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
