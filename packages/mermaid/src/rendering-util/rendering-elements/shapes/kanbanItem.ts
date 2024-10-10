import { labelHelper, insertLabel, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { KanbanNode } from '../../types.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { userNodeOverrides, styles2String } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
const colorFromPriority = (priority: KanbanNode['priority']) => {
  switch (priority) {
    case 'Very High':
      return 'red';
    case 'High':
      return 'orange';
    case 'Low':
      return 'blue';
    case 'Very Low':
      return 'lightblue';
  }
};
export const kanbanItem = async (parent: SVGAElement, node: KanbanNode, { config }) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  // console.log('IPI labelStyles:', labelStyles);
  // const labelPaddingX = 10;
  const labelPaddingX = 10;
  const orgWidth = node.width;
  node.width = (node.width ?? 200) - 10;
  // console.log('APA123 kanbanItem priority', node?.priority);
  const {
    shapeSvg,
    bbox,
    label: labelElTitle,
  } = await labelHelper(parent, node, getNodeClasses(node));
  const padding = node.padding || 10;

  // elem.insert('svg:a').attr('xlink:href', node.link).attr('target', target);
  // console.log('STO node config.kanban:', config.kanban, config.kanban);
  let ticketUrl = '';
  let link;
  // console.log('STO ticket:', node.ticket);
  if (node.ticket && config.kanban.ticketBaseUrl) {
    ticketUrl = config.kanban.ticketBaseUrl.replace('#TICKET#', node.ticket);
    link = shapeSvg
      .insert('svg:a', ':first-child')
      .attr('class', 'kanban-ticket-link')
      .attr('xlink:href', ticketUrl)
      .attr('target', '_blank');
  }

  const options = {
    useHtmlLabels: node.useHtmlLabels,
    labelStyle: node.labelStyle,
    width: node.width,
    icon: node.icon,
    img: node.img,
    padding: node.padding,
    centerLabel: false,
  };
  const { label: labelEl, bbox: bbox2 } = await insertLabel(
    link ? link : shapeSvg,
    node.ticket || '',
    options
  );
  const { label: labelElAssigned, bbox: bboxAssigned } = await insertLabel(
    shapeSvg,
    node.assigned || '',
    options
  );
  node.width = orgWidth;
  const labelPaddingY = 10;
  const totalWidth = node?.width || 0;
  const heightAdj = Math.max(bbox2.height, bboxAssigned.height) / 2;
  const totalHeight = Math.max(bbox.height + labelPaddingY * 2, node?.height || 0) + heightAdj;
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;
  labelElTitle.attr(
    'transform',
    'translate(' + (padding - totalWidth / 2) + ', ' + (-heightAdj - bbox.height / 2) + ')'
  );
  labelEl.attr(
    'transform',
    'translate(' + (padding - totalWidth / 2) + ', ' + (-heightAdj + bbox.height / 2) + ')'
  );
  labelElAssigned.attr(
    'transform',
    'translate(' +
      (padding + totalWidth / 2 - bboxAssigned.width - 2 * labelPaddingX) +
      ', ' +
      (-heightAdj + bbox.height / 2) +
      ')'
  );
  // log.info('IPI node = ', node);

  let rect;

  const { rx, ry } = node;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    const roughNode =
      rx || ry
        ? rc.path(createRoundedRectPathD(x, y, totalWidth, totalHeight, rx || 0), options)
        : rc.rectangle(x, y, totalWidth, totalHeight, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');

    rect
      .attr('class', 'basic label-container __APA__')
      .attr('style', nodeStyles)
      .attr('rx', rx)
      .attr('ry', ry)
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight);
    if (node.priority) {
      const line = shapeSvg.append('line', ':first-child');
      const lineX = x + 2;

      const y1 = y + Math.floor((rx ?? 0) / 2);
      const y2 = y + totalHeight - Math.floor((rx ?? 0) / 2);
      line
        .attr('x1', lineX)
        .attr('y1', y1)
        .attr('x2', lineX)
        .attr('y2', y2)

        .attr('stroke-width', '4')
        .attr('stroke', colorFromPriority(node.priority));
    }
  }

  updateNodeBounds(node, rect);
  node.height = totalHeight;

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
