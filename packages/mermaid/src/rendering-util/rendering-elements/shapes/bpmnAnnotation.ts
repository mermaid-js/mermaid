import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, getNodeClasses } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import { faceProjectIntersect, positionLabelBelow, reserveBounds } from './bpmnShapeCore.js';

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

  const face = node.metadata?.attachFace === 'right' ? 'right' : 'left';
  const body = shapeSvg.insert('g', ':first-child').attr('class', 'bpmn-annotation-body');
  body
    .append('path')
    .attr('class', 'bpmn-annotation-bracket')
    .attr(
      'd',
      face === 'right'
        ? `M${width / 2 - 6},${-height / 2} h6 V${height / 2} h-6`
        : `M${-width / 2 + 6},${-height / 2} h-6 V${height / 2} h6`
    );

  positionLabelBelow(label, bbox, 0);
  const textLeft = face === 'right' ? -width / 2 + padding : -width / 2 + padding + 6;
  label.attr(
    'transform',
    `translate(${textLeft - (bbox.x ?? 0) + (bbox.left ?? 0)},${-bbox.height / 2 - ((bbox.y ?? 0) - (bbox.top ?? 0))})`
  );

  reserveBounds(shapeSvg, node, width, height);
  node.intersect = function (point) {
    return faceProjectIntersect(node, width, height, point, face);
  };
  return shapeSvg;
}
