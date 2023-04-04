import { updateNodeBounds, labelHelper } from './util';
import { log } from '../../logger';
import { getConfig } from '../../config';
import intersect from '../intersect/index.js';

const note = (parent, node) => {
  const useHtmlLabels = node.useHtmlLabels || getConfig().flowchart.htmlLabels;
  if (!useHtmlLabels) {
    node.centerLabel = true;
  }
  const { shapeSvg, bbox, halfPadding } = labelHelper(parent, node, 'node ' + node.classes, true);

  log.info('Classes = ', node.classes);
  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  rect
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', -bbox.width / 2 - halfPadding)
    .attr('y', -bbox.height / 2 - halfPadding)
    .attr('width', bbox.width + node.padding)
    .attr('height', bbox.height + node.padding);

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

export default note;
