import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { getEffectiveHtmlLabels } from '../../../config.js';
import type { D3Selection, Bounds, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { userNodeOverrides, styles2String } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { handleUndefinedAttr } from '../../../utils.js';

/** Height reserved for the ellipsis indicator row below the title */
const INDICATOR_ROW_HEIGHT = 20;
/** Vertical gap between the title and the indicator row */
const SEPARATOR_GAP = 8;
/** Minimum width for the collapsed group shape */
const MIN_WIDTH = 80;
/** Corner radius matching the expanded subgraph (cluster rect) */
const RADIUS = 8;

/**
 * Collapsed subgraph shape (flowchart `@{ view: collapsed }`).
 *
 * Renders a two-row layout that keeps the subgraph's visual identity while
 * signalling that it hides further content:
 *
 *   ┌─────────────────┐
 *   │   Title Text    │
 *   │─ ─ ─ ─ ─ ─ ─ ─ ─│  (separator line)
 *   │      • • •      │  (ellipsis indicator)
 *   └─────────────────┘
 */
export async function collapsedGroup<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { themeVariables } = getConfig();
  const fill = themeVariables.clusterBkg;
  const stroke = themeVariables.clusterBorder;

  const { nodeStyles } = styles2String(node);

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 8;
  const titleHeight = bbox.height;
  const totalWidth = Math.max(bbox.width + padding * 2, MIN_WIDTH, node?.width ?? 0);
  const totalHeight = Math.max(
    titleHeight + SEPARATOR_GAP + INDICATOR_ROW_HEIGHT + padding * 2,
    node?.height ?? 0
  );
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  // labelHelper centers the label at (0,0). Shift it up into the title area so
  // there is room for the separator and the ellipsis indicator below it.
  const labelShiftY = -(SEPARATOR_GAP + INDICATOR_ROW_HEIGHT) / 2;
  const labelEl = shapeSvg.select('.label');
  if (labelEl) {
    const useHtmlLabels = node.useHtmlLabels ?? getEffectiveHtmlLabels(getConfig());
    if (useHtmlLabels) {
      labelEl.attr('transform', `translate(${-bbox.width / 2}, ${-bbox.height / 2 + labelShiftY})`);
    } else {
      labelEl.attr('transform', `translate(0, ${-bbox.height / 2 + labelShiftY})`);
    }
  }

  let rect;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const roughOpts = userNodeOverrides(node, {
      fill,
      stroke,
      fillStyle: 'solid',
    });
    const roughNode = rc.path(
      createRoundedRectPathD(x, y, totalWidth, totalHeight, RADIUS),
      roughOpts
    );
    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect
      .attr('class', 'basic label-container collapsed-group')
      .attr('style', handleUndefinedAttr(node.cssStyles));
  } else {
    rect = shapeSvg.insert('rect', ':first-child');
    rect
      .attr('class', 'basic label-container collapsed-group')
      .attr('style', nodeStyles)
      .attr('rx', RADIUS)
      .attr('ry', RADIUS)
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight)
      .attr('fill', fill)
      .attr('stroke', stroke);
  }

  // -- Separator line between the title and the indicator row --
  const separatorY = y + padding + titleHeight + SEPARATOR_GAP;
  shapeSvg
    .append('line')
    .attr('class', 'collapsed-separator')
    .attr('x1', x + 8)
    .attr('y1', separatorY)
    .attr('x2', x + totalWidth - 8)
    .attr('y2', separatorY)
    .attr('stroke', stroke)
    .attr('stroke-dasharray', '3, 3');

  // -- Ellipsis dots (• • •) centered in the indicator row --
  const dotY = separatorY + INDICATOR_ROW_HEIGHT / 2;
  const dotRadius = 2.5;
  const dotSpacing = 10;
  for (let i = -1; i <= 1; i++) {
    shapeSvg
      .append('circle')
      .attr('class', 'collapsed-indicator')
      .attr('cx', i * dotSpacing)
      .attr('cy', dotY)
      .attr('r', dotRadius)
      .attr('fill', stroke);
  }

  updateNodeBounds(node, rect);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
