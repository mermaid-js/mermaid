import { labelHelper, insertLabel, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, KanbanNode, ShapeRenderOptions } from '../../types.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { userNodeOverrides, styles2String } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

const colorFromPriority = (priority: NonNullable<KanbanNode['priority']>) => {
  switch (priority) {
    case 'Very High':
      return 'red';
    case 'High':
      return 'orange';
    case 'Medium':
      return null; // no stroke
    case 'Low':
      return 'blue';
    case 'Very Low':
      return 'lightblue';
  }
};
export async function kanbanItem<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  // Omit the 'shape' prop since otherwise, it causes a TypeScript circular dependency error
  kanbanNode: Omit<Node, 'shape'> | Omit<KanbanNode, 'level' | 'shape'>,
  { config }: ShapeRenderOptions
) {
  const { labelStyles, nodeStyles } = styles2String(kanbanNode);
  kanbanNode.labelStyle = labelStyles || '';

  const labelPaddingX = 10;
  const orgWidth = kanbanNode.width;
  kanbanNode.width = (kanbanNode.width ?? 200) - 10;

  const {
    shapeSvg,
    bbox,
    label: labelElTitle,
  } = await labelHelper(parent, kanbanNode, getNodeClasses(kanbanNode));
  const padding = kanbanNode.padding || 10;

  let ticketUrl = '';
  let link;

  if ('ticket' in kanbanNode && kanbanNode.ticket && config?.kanban?.ticketBaseUrl) {
    ticketUrl = config?.kanban?.ticketBaseUrl.replace('#TICKET#', kanbanNode.ticket);
    link = shapeSvg
      .insert<SVGAElement>('svg:a', ':first-child')
      .attr('class', 'kanban-ticket-link')
      .attr('xlink:href', ticketUrl)
      .attr('target', '_blank');
  }

  const options = {
    useHtmlLabels: kanbanNode.useHtmlLabels,
    labelStyle: kanbanNode.labelStyle || '',
    width: kanbanNode.width,
    img: kanbanNode.img,
    padding: kanbanNode.padding || 8,
    centerLabel: false,
  };
  let labelEl, bbox2;
  if (link) {
    ({ label: labelEl, bbox: bbox2 } = await insertLabel(
      link,
      ('ticket' in kanbanNode && kanbanNode.ticket) || '',
      options
    ));
  } else {
    ({ label: labelEl, bbox: bbox2 } = await insertLabel(
      shapeSvg,
      ('ticket' in kanbanNode && kanbanNode.ticket) || '',
      options
    ));
  }
  const { label: labelElAssigned, bbox: bboxAssigned } = await insertLabel(
    shapeSvg,
    ('assigned' in kanbanNode && kanbanNode.assigned) || '',
    options
  );
  kanbanNode.width = orgWidth;
  const labelPaddingY = 10;
  const totalWidth = kanbanNode?.width || 0;
  const heightAdj = Math.max(bbox2.height, bboxAssigned.height) / 2;
  const totalHeight =
    Math.max(bbox.height + labelPaddingY * 2, kanbanNode?.height || 0) + heightAdj;
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

  let rect;

  const { rx, ry } = kanbanNode;
  const { cssStyles } = kanbanNode;

  if (kanbanNode.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(kanbanNode, {});

    const roughNode =
      rx || ry
        ? rc.path(createRoundedRectPathD(x, y, totalWidth, totalHeight, rx || 0), options)
        : rc.rectangle(x, y, totalWidth, totalHeight, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', cssStyles ? cssStyles : null);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');

    rect
      .attr('class', 'basic label-container __APA__')
      .attr('style', nodeStyles)
      .attr('rx', rx ?? 5)
      .attr('ry', ry ?? 5)
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight);

    const priority = 'priority' in kanbanNode && kanbanNode.priority;
    if (priority) {
      const line = shapeSvg.append('line');
      const lineX = x + 2;

      const y1 = y + Math.floor((rx ?? 0) / 2);
      const y2 = y + totalHeight - Math.floor((rx ?? 0) / 2);
      line
        .attr('x1', lineX)
        .attr('y1', y1)
        .attr('x2', lineX)
        .attr('y2', y2)

        .attr('stroke-width', '4')
        .attr('stroke', colorFromPriority(priority));
    }
  }

  updateNodeBounds(kanbanNode, rect);
  kanbanNode.height = totalHeight;

  kanbanNode.intersect = function (point) {
    return intersect.rect(kanbanNode, point);
  };

  return shapeSvg;
}
