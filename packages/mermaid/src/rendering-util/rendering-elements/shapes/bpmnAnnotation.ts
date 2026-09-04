import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, getNodeClasses } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import { faceProjectIntersect, positionLabelBelow, reserveBounds } from './bpmnShapeCore.js';

/** A BPMN text annotation: an open bracket with the text beside it, and no fill. */
export async function bpmnAnnotation<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  node.wrappingWidth = 160;

  const { shapeSvg, bbox, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node, 'bpmn-annotation')
  );

  const padding = 8;
  const height = Math.max(28, bbox.height + padding * 2);
  const width = bbox.width + padding * 2 + 6;

  const body = shapeSvg.insert('g', ':first-child').attr('class', 'bpmn-annotation-body');
  body
    .append('path')
    .attr('class', 'bpmn-annotation-bracket')
    .attr('d', `M${-width / 2 + 6},${-height / 2} h-6 V${height / 2} h6`);

  // The text sits to the right of the bracket rather than centred in a box.
  positionLabelBelow(label, bbox, 0);
  label.attr(
    'transform',
    `translate(${-width / 2 + padding + 6 - (bbox.x ?? 0) + (bbox.left ?? 0)},${-bbox.height / 2 - ((bbox.y ?? 0) - (bbox.top ?? 0))})`
  );

  reserveBounds(shapeSvg, node, width, height);
  node.intersect = function (point) {
    // The bracket is drawn down the left, and the line belongs on the bracket.
    return faceProjectIntersect(node, width, height, point, 'left');
  };
  return shapeSvg;
}
