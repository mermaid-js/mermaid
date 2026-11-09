import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, getNodeClasses } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import {
  appendGlyph,
  EVENT_DIAMETER,
  EVENT_RINGS,
  ringIntersect,
  ICON_SIZE,
  LABEL_GAP,
  positionLabelBelow,
  reserveBounds,
  type BpmnNode,
  type EventPosition,
} from './bpmnShapeCore.js';

/** The bpmn theme variable that sets the ring weight of each event position. */
const RING_WIDTH_VARIABLE = {
  start: 'eventStrokeWidth',
  intermediate: 'eventStrokeWidth',
  boundary: 'eventStrokeWidth',
  end: 'endEventStrokeWidth',
} as const satisfies Record<EventPosition, string>;

/**
 * The ring weight of an event: the theme's `bpmn.eventStrokeWidth` (`bpmn.endEventStrokeWidth`
 * for an end event), a number in pixels or a CSS length, else the notation default in
 * {@link EVENT_RINGS}. It is set inline because a flowchart that uses these shapes does not
 * load the bpmn stylesheet, and its own `.node circle` rules would otherwise win.
 */
const ringWidth = (position: EventPosition): string => {
  const themeBpmn: unknown = getConfig().themeVariables?.bpmn;
  const value =
    typeof themeBpmn === 'object' && themeBpmn !== null
      ? Reflect.get(themeBpmn, RING_WIDTH_VARIABLE[position])
      : undefined;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`;
  }
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  return `${EVENT_RINGS[position].strokeWidth}px`;
};

export async function renderBpmnEvent<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  position: EventPosition
): Promise<D3Selection<SVGGElement>> {
  const eventNode = node as BpmnNode;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { rings } = EVENT_RINGS[position];
  const strokeWidth = ringWidth(position);
  const radius = EVENT_DIAMETER / 2;

  const { shapeSvg, bbox, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node, `bpmn-event bpmn-event-${position}`)
  );

  const glyphGroup = shapeSvg.insert('g', ':first-child').attr('class', 'bpmn-event-body');
  glyphGroup.attr('style', nodeStyles);
  for (let ring = 0; ring < rings; ring++) {
    glyphGroup
      .append('circle')
      .attr('class', ring === 0 ? 'bpmn-event-ring' : 'bpmn-event-ring bpmn-event-ring-inner')
      .attr('r', radius - ring * 3)
      .style('stroke-width', strokeWidth);
  }
  await appendGlyph(glyphGroup, eventNode.icon, ICON_SIZE);

  const hasLabel = bbox.height > 0 && Boolean(node.label);
  const captionBand = hasLabel ? LABEL_GAP + bbox.height : 0;
  const totalHeight = EVENT_DIAMETER + 2 * captionBand;
  const totalWidth = Math.max(EVENT_DIAMETER, hasLabel ? bbox.width : 0);

  if (hasLabel) {
    positionLabelBelow(label, bbox, radius + LABEL_GAP + bbox.height / 2);
  }

  reserveBounds(shapeSvg, node, totalWidth, totalHeight, {
    width: EVENT_DIAMETER,
    height: EVENT_DIAMETER,
  });

  node.intersect = function (point) {
    return ringIntersect(node, EVENT_DIAMETER, point);
  };

  return shapeSvg;
}
