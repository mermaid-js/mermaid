import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, getNodeClasses } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import {
  appendGlyph,
  faceCentreIntersect,
  GATEWAY_SIZE,
  ICON_SIZE,
  LABEL_GAP,
  positionLabelBelow,
  reserveBounds,
  type BpmnNode,
} from './bpmnShapeCore.js';

/**
 * A BPMN gateway: a fixed 50px diamond with its caption below it, and `node.icon` drawn
 * inside to say which kind of gateway it is.
 */
export async function bpmnGateway<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  const gatewayNode = node as BpmnNode;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const half = GATEWAY_SIZE / 2;

  const { shapeSvg, bbox, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node, 'bpmn-gateway')
  );

  const glyphGroup = shapeSvg.insert('g', ':first-child').attr('class', 'bpmn-gateway-body');
  glyphGroup
    .append('polygon')
    .attr('class', 'bpmn-gateway-diamond')
    .attr('points', `0,${-half} ${half},0 0,${half} ${-half},0`)
    .attr('style', nodeStyles);
  await appendGlyph(glyphGroup, gatewayNode.icon, ICON_SIZE + 2);

  // Symmetric caption band, as for an event, so the diamond lands on the node centre.
  const hasLabel = bbox.height > 0 && Boolean(node.label);
  const captionBand = hasLabel ? LABEL_GAP + bbox.height : 0;
  const totalHeight = GATEWAY_SIZE + 2 * captionBand;
  const totalWidth = Math.max(GATEWAY_SIZE, hasLabel ? bbox.width : 0);

  if (hasLabel) {
    positionLabelBelow(label, bbox, half + LABEL_GAP + bbox.height / 2);
  }

  reserveBounds(shapeSvg, node, totalWidth, totalHeight);

  // A diamond's compass points are its vertices, which is where the notation attaches a
  // flow to a gateway, so the same docking rule gives the right answer here too.
  node.intersect = function (point) {
    return faceCentreIntersect(node, GATEWAY_SIZE, GATEWAY_SIZE, point);
  };

  return shapeSvg;
}
