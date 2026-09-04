import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, getNodeClasses } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import {
  dataDirectionOf,
  faceProjectIntersect,
  isCollectionData,
  LABEL_GAP,
  positionLabelBelow,
  reserveBounds,
} from './bpmnShapeCore.js';

/** Data artifact geometry, from the notation's own proportions. */
export const DATA_WIDTH = 36;
export const DATA_HEIGHT = 50;
const FOLD = 10;

/**
 * A BPMN data object: a page with its top-right corner folded, captioned below.
 *
 * A data input or output adds the arrow the notation puts in the top-left corner, and a
 * collection adds the three-bar marker along the bottom.
 */
export async function bpmnDataObject<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node, 'bpmn-data-object')
  );

  const body = shapeSvg.insert('g', ':first-child').attr('class', 'bpmn-data-body');
  const left = -DATA_WIDTH / 2;
  const top = -DATA_HEIGHT / 2;
  const right = DATA_WIDTH / 2;
  const bottom = DATA_HEIGHT / 2;
  body
    .append('path')
    .attr('class', 'bpmn-data-page')
    .attr('d', `M${left},${top} H${right - FOLD} L${right},${top + FOLD} V${bottom} H${left} Z`)
    .attr('style', nodeStyles);
  // The fold is its own line so it reads as a folded corner rather than an outline.
  body
    .append('path')
    .attr('class', 'bpmn-data-fold')
    .attr('d', `M${right - FOLD},${top} V${top + FOLD} H${right}`);

  const direction = dataDirectionOf(node);
  if (direction) {
    body
      .append('path')
      .attr('class', `bpmn-data-arrow bpmn-data-arrow-${direction}`)
      .attr('d', `M${left + 4},${top + 9} h7 v-3 l5,4.5 -5,4.5 v-3 h-7 Z`);
  }
  if (isCollectionData(node)) {
    body
      .append('path')
      .attr('class', 'bpmn-data-collection')
      .attr('d', `M-4,${bottom - 11} v9 M0,${bottom - 11} v9 M4,${bottom - 11} v9`);
  }

  const hasLabel = bbox.height > 0 && Boolean(node.label);
  const captionBand = hasLabel ? LABEL_GAP + bbox.height : 0;
  const totalHeight = DATA_HEIGHT + 2 * captionBand;
  const totalWidth = Math.max(DATA_WIDTH, hasLabel ? bbox.width : 0);

  if (hasLabel) {
    positionLabelBelow(label, bbox, DATA_HEIGHT / 2 + LABEL_GAP + bbox.height / 2);
  }
  reserveBounds(shapeSvg, node, totalWidth, totalHeight);

  node.intersect = function (point) {
    return faceProjectIntersect(node, DATA_WIDTH, DATA_HEIGHT, point);
  };
  return shapeSvg;
}
