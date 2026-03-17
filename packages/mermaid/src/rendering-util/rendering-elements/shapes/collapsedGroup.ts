import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { getEffectiveHtmlLabels } from '../../../config.js';
import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { userNodeOverrides, styles2String } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { handleUndefinedAttr } from '../../../utils.js';
import type { Bounds, Point } from '../../../types.js';

/**
 * Visual styling per container type, mirroring the cluster shapes in clusters.js.
 */
function getContainerStyle(containerType: string | undefined) {
  const { themeVariables } = getConfig();

  switch (containerType) {
    case 'agent':
      return {
        rx: 14,
        fill: themeVariables.agentContainerFill || themeVariables.primaryColor,
        stroke: themeVariables.agentContainerStroke || themeVariables.primaryBorderColor,
        strokeWidth: 1.5,
        cssClass: 'agent-collapsed',
        separatorLine: true,
      };
    case 'flow':
      return {
        rx: 10,
        fill: 'none',
        stroke: themeVariables.flowContainerStroke || themeVariables.secondaryBorderColor,
        strokeWidth: 0.75,
        cssClass: 'flow-collapsed',
        separatorLine: false,
      };
    case 'task':
      return {
        rx: 10,
        fill: 'none',
        stroke: themeVariables.clusterBorder || themeVariables.secondaryBorderColor,
        strokeWidth: 0.75,
        strokeDash: '8, 4',
        cssClass: 'task-collapsed',
        separatorLine: false,
      };
    default:
      return {
        rx: 5,
        fill: themeVariables.clusterBkg || themeVariables.secondaryColor,
        stroke: themeVariables.clusterBorder || themeVariables.secondaryBorderColor,
        strokeWidth: 1,
        cssClass: 'collapsed-group',
        separatorLine: false,
      };
  }
}

/** Height reserved for the ellipsis indicator row below the title */
const INDICATOR_ROW_HEIGHT = 20;
/** Vertical gap between title and indicator row */
const SEPARATOR_GAP = 8;
/** Minimum width for the collapsed group shape */
const MIN_WIDTH = 80;

/**
 * Collapsed group shape for agentflow containers.
 *
 * Renders a two-row layout:
 *   ┌─────────────────┐
 *   │   Title Text     │
 *   │─ ─ ─ ─ ─ ─ ─ ─ ─│  (separator line)
 *   │      • • •       │  (ellipsis indicator)
 *   └─────────────────┘
 *
 * The border/fill/radius match the container type (agent/flow/task) so
 * collapsed nodes retain their visual identity.
 */
export async function collapsedGroup<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const containerType = node.metadata?.containerType as string | undefined;
  const style = getContainerStyle(containerType);

  const { nodeStyles, labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 8;
  const titleHeight = bbox.height;
  const totalWidth = Math.max(bbox.width + padding * 2, MIN_WIDTH, node?.width || 0);
  const totalHeight = Math.max(
    titleHeight + SEPARATOR_GAP + INDICATOR_ROW_HEIGHT + padding * 2,
    node?.height || 0
  );
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  // labelHelper centers the label at (0,0). Shift it up into the title area.
  // The label center should move up by half the indicator+gap region.
  const labelShiftY = -(SEPARATOR_GAP + INDICATOR_ROW_HEIGHT) / 2;
  const labelEl = shapeSvg.select('.label');
  if (labelEl) {
    const useHtmlLabels = node.useHtmlLabels || getEffectiveHtmlLabels(getConfig());
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
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      ...(style.fill === 'none' ? { fillWeight: 0 } : { fillStyle: 'solid' }),
      ...(style.strokeDash ? { strokeLineDash: [8, 4] } : {}),
    });
    const roughNode = rc.path(
      createRoundedRectPathD(x, y, totalWidth, totalHeight, style.rx),
      roughOpts
    );
    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect
      .attr('class', 'basic label-container ' + style.cssClass)
      .attr('style', handleUndefinedAttr(node.cssStyles));
  } else {
    rect = shapeSvg.insert('rect', ':first-child');
    rect
      .attr('class', 'basic label-container ' + style.cssClass)
      .attr('style', nodeStyles)
      .attr('rx', style.rx)
      .attr('ry', style.rx)
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight)
      .attr('fill', style.fill)
      .attr('stroke', style.stroke)
      .attr('stroke-width', style.strokeWidth + 'px');

    if (style.strokeDash) {
      rect.attr('stroke-dasharray', style.strokeDash);
    }
  }

  // -- Separator line between title and indicator --
  const separatorY = y + padding + titleHeight + SEPARATOR_GAP;
  shapeSvg
    .append('line')
    .attr('class', 'collapsed-separator')
    .attr('x1', x + 8)
    .attr('y1', separatorY)
    .attr('x2', x + totalWidth - 8)
    .attr('y2', separatorY)
    .attr('stroke', style.stroke)
    .attr('stroke-width', '0.75px')
    .attr('stroke-dasharray', style.separatorLine ? 'none' : '3, 3');

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
      .attr('r', dotRadius);
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
