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

/**
 * A BPMN event: a fixed 36px circle with its caption below it.
 *
 * `position` picks the ring weight - one thin ring to start, a double ring for an
 * intermediate or boundary event, one thick ring to end - and `node.icon` is the trigger
 * glyph drawn inside.
 */
export async function renderBpmnEvent<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  position: EventPosition
): Promise<D3Selection<SVGGElement>> {
  const eventNode = node as BpmnNode;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { rings, strokeWidth } = EVENT_RINGS[position];
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
      // Inline rather than a presentation attribute: the ring weight is what tells an end
      // event from a start one, and a presentation attribute loses to any stylesheet rule
      // the host diagram happens to set on a node's circle.
      .style('stroke-width', `${strokeWidth}px`);
  }
  await appendGlyph(glyphGroup, eventNode.icon, ICON_SIZE);

  // The caption is reserved both above and below, so the circle sits at the node's
  // centre. The layout aligns node centres, so this is what makes a row of events and
  // activities line up on their glyphs rather than on their captions, and what lets an
  // edge meet the circle at mid-height instead of angling down to it.
  const hasLabel = bbox.height > 0 && Boolean(node.label);
  const captionBand = hasLabel ? LABEL_GAP + bbox.height : 0;
  const totalHeight = EVENT_DIAMETER + 2 * captionBand;
  const totalWidth = Math.max(EVENT_DIAMETER, hasLabel ? bbox.width : 0);

  if (hasLabel) {
    positionLabelBelow(label, bbox, radius + LABEL_GAP + bbox.height / 2);
  }

  reserveBounds(shapeSvg, node, totalWidth, totalHeight);

  // Dock on the circle, not on the reserved box that includes the caption, and on a
  // compass point rather than wherever the line happens to cross the arc, so a flow
  // meets the circle square-on.
  node.intersect = function (point) {
    return ringIntersect(node, EVENT_DIAMETER, point);
  };

  return shapeSvg;
}
