import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import {
  ACTIVITY_HEIGHT,
  ACTIVITY_WIDTH,
  faceProjectIntersect,
  glyphSvg,
  ICON_SIZE,
  positionLabelBelow,
  type BpmnNode,
} from './bpmnShapeCore.js';

export async function bpmnActivity<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  const activityNode = node as BpmnNode;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node, 'bpmn-activity')
  );

  const markers = activityNode.markers ?? [];
  const icon = activityNode.icon;
  const topInset = icon ? ICON_SIZE + 6 : 10;
  const bottomInset = markers.length > 0 ? ICON_SIZE + 4 : 10;
  const width = Math.max(ACTIVITY_WIDTH, bbox.width + 16);
  const height = Math.max(ACTIVITY_HEIGHT, bbox.height + topInset + bottomInset);

  const body = shapeSvg.insert('g', ':first-child').attr('class', 'bpmn-activity-body');
  body
    .append('rect')
    .attr('class', 'bpmn-activity-rect')
    .attr('x', -width / 2)
    .attr('y', -height / 2)
    .attr('width', width)
    .attr('height', height)
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('style', nodeStyles);

  if (icon) {
    const corner = body.append('g').attr('class', 'bpmn-activity-icon');
    corner.html(`<g>${await glyphSvg(icon, ICON_SIZE)}</g>`);
    corner.attr('transform', `translate(${-width / 2 + 6}, ${-height / 2 + 6})`);
  }

  if (markers.length > 0) {
    const markerRow = body.append('g').attr('class', 'bpmn-activity-markers');
    const step = ICON_SIZE - 2;
    const rowWidth = markers.length * step;
    for (const [index, marker] of markers.entries()) {
      const cell = markerRow.append('g');
      cell.html(`<g>${await glyphSvg(marker, step)}</g>`);
      cell.attr('transform', `translate(${-rowWidth / 2 + index * step}, 0)`);
    }
    markerRow.attr('transform', `translate(0, ${height / 2 - step - 3})`);
  }

  if (bbox.height > 0) {
    const bandTop = -height / 2 + topInset;
    const bandBottom = height / 2 - bottomInset;
    positionLabelBelow(label, bbox, (bandTop + bandBottom) / 2);
  }

  updateNodeBounds(node, body);
  node.intersect = function (point) {
    return faceProjectIntersect(node, width, height, point);
  };

  return shapeSvg;
}
