import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, getNodeClasses } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import {
  faceCentreIntersect,
  LABEL_GAP,
  positionLabelBelow,
  reserveBounds,
} from './bpmnShapeCore.js';

const STORE_SIZE = 50;

/** A BPMN data store: the cylinder, captioned below. */
export async function bpmnDataStore<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node, 'bpmn-data-store')
  );

  const body = shapeSvg.insert('g', ':first-child').attr('class', 'bpmn-data-body');
  const half = STORE_SIZE / 2;
  const ry = 6;
  body
    .append('path')
    .attr('class', 'bpmn-store-body')
    .attr(
      'd',
      `M${-half},${-half + ry} a${half},${ry} 0 0 1 ${STORE_SIZE},0 V${half - ry} a${half},${ry} 0 0 1 ${-STORE_SIZE},0 Z`
    )
    .attr('style', nodeStyles);
  for (const offset of [0, 5, 10]) {
    body
      .append('path')
      .attr('class', 'bpmn-store-rings')
      .attr('d', `M${-half},${-half + ry + offset} a${half},${ry} 0 0 0 ${STORE_SIZE},0`);
  }

  const hasLabel = bbox.height > 0 && Boolean(node.label);
  const captionBand = hasLabel ? LABEL_GAP + bbox.height : 0;
  const totalHeight = STORE_SIZE + 2 * captionBand;
  const totalWidth = Math.max(STORE_SIZE, hasLabel ? bbox.width : 0);

  if (hasLabel) {
    positionLabelBelow(label, bbox, half + LABEL_GAP + bbox.height / 2);
  }
  reserveBounds(shapeSvg, node, totalWidth, totalHeight);

  node.intersect = function (point) {
    return faceCentreIntersect(node, STORE_SIZE, STORE_SIZE, point);
  };
  return shapeSvg;
}
