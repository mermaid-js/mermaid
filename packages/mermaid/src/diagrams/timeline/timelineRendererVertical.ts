import svgDraw from './svgDraw.js';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { Diagram } from '../../Diagram.js';
import type { MermaidConfig } from '../../config.type.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import type { SVG } from '../../diagram-api/types.js';

interface Block<TDesc, TSection> {
  number: number;
  descr: TDesc;
  section: TSection;
  width: number;
  padding: number;
  maxHeight: number;
}

interface TimelineTask {
  id: number;
  section: string;
  type: string;
  task: string;
  score: number;
  events: string[];
}

const NODE_WIDTH = 200;
const NODE_PADDING = 5;
const NODE_TOTAL_WIDTH = NODE_WIDTH + NODE_PADDING * 2;
const EVENT_WIDTH = NODE_WIDTH + 100;
const EVENT_TOTAL_WIDTH = EVENT_WIDTH + NODE_PADDING * 2;
const EVENT_SPACING = 10;
const EVENT_VERTICAL_GAP = 0;
const SECTION_TASK_GAP = 20;
const TASK_AXIS_GAP = 20;
const TASK_VERTICAL_GAP = 30;
const EVENT_AXIS_GAP = 50;

export const draw = function (text: string, id: string, version: string, diagObj: Diagram) {
  //1. Fetch the configuration
  const conf = getConfig();
  const LEFT_MARGIN = conf.timeline?.leftMargin ?? 50;

  log.debug('timeline', diagObj.db);

  const svg = selectSvgElement(id);

  svg.append('g');

  //4. Fetch the diagram data
  // @ts-expect-error - db not typed yet
  const tasks: TimelineTask[] = diagObj.db.getTasks();
  // @ts-expect-error - db not typed yet
  const title = diagObj.db.getCommonDb().getDiagramTitle();
  log.debug('task', tasks);

  //5. Initialize the diagram
  svgDraw.initGraphics(svg);

  // fetch Sections
  // @ts-expect-error - db not typed yet
  const sections: string[] = diagObj.db.getSections();
  log.debug('sections', sections);

  let maxSectionHeight = 0;
  let maxTaskHeight = 0;
  const masterX = 50 + LEFT_MARGIN;
  let masterY = 50;
  const contentTopY = masterY;
  const sectionBeginX = masterX;
  const leftWidth = NODE_TOTAL_WIDTH + TASK_AXIS_GAP;
  const rightWidth = EVENT_TOTAL_WIDTH + EVENT_AXIS_GAP;
  const axisX = sectionBeginX + leftWidth;
  let sectionNumber = 0;
  const hasSections = sections && sections.length > 0;
  const timelineX = hasSections ? axisX : masterX + leftWidth;

  const sectionWidth = Math.max(50, leftWidth + rightWidth - NODE_PADDING * 2);
  //Calculate the max height of the sections
  sections.forEach(function (section: string) {
    const sectionNode: Block<string, number> = {
      number: sectionNumber,
      descr: section,
      section: sectionNumber,
      width: sectionWidth,
      padding: NODE_PADDING,
      maxHeight: maxSectionHeight,
    };
    const sectionHeight = svgDraw.getVirtualNodeHeight(svg, sectionNode, conf);
    log.debug('sectionHeight before draw', sectionHeight);
    maxSectionHeight = Math.max(maxSectionHeight, sectionHeight);
  });

  //tasks length and max event stack height
  let maxEventStackHeight = 0;
  log.debug('tasks.length', tasks.length);

  for (const [i, task] of tasks.entries()) {
    const taskNode: Block<TimelineTask, string> = {
      number: i,
      descr: task,
      section: task.section,
      width: NODE_WIDTH,
      padding: NODE_PADDING,
      maxHeight: maxTaskHeight,
    };
    const taskHeight = svgDraw.getVirtualNodeHeight(svg, taskNode, conf);
    log.debug('taskHeight before draw', taskHeight);
    maxTaskHeight = Math.max(maxTaskHeight, taskHeight);

    //calculate maxEventStackHeight (vertical stack height for events)
    let maxEventStackHeightTemp = 0;
    for (const event of task.events) {
      const eventNode = {
        descr: event,
        section: task.section,
        number: task.section,
        width: EVENT_WIDTH,
        padding: NODE_PADDING,
        maxHeight: 50,
      };
      maxEventStackHeightTemp += svgDraw.getVirtualNodeHeight(svg, eventNode, conf);
    }
    if (task.events.length > 0) {
      maxEventStackHeightTemp += (task.events.length - 1) * EVENT_SPACING;
    }
    maxEventStackHeight =
      Math.max(maxEventStackHeight, maxEventStackHeightTemp) + EVENT_VERTICAL_GAP;
  }

  log.debug('maxSectionHeight before draw', maxSectionHeight);
  log.debug('maxTaskHeight before draw', maxTaskHeight);

  const taskBlockHeight = Math.max(maxTaskHeight, maxEventStackHeight);
  const taskSpacing = taskBlockHeight + TASK_VERTICAL_GAP;

  if (hasSections) {
    sections.forEach((section) => {
      //filter task where tasks.section == section
      const tasksForSection = tasks.filter((task) => task.section === section);

      const sectionNode: Block<string, number> = {
        number: sectionNumber,
        descr: section,
        section: sectionNumber,
        width: sectionWidth,
        padding: NODE_PADDING,
        maxHeight: maxSectionHeight,
      };
      log.debug('sectionNode', sectionNode);
      const sectionNodeWrapper = svg.append('g');
      const node = svgDraw.drawNode(sectionNodeWrapper, sectionNode, sectionNumber, conf);
      log.debug('sectionNode output', node);

      const sectionX = timelineX - leftWidth;
      sectionNodeWrapper.attr('transform', `translate(${sectionX}, ${masterY})`);

      const taskStartY = masterY + node.height + SECTION_TASK_GAP;
      //draw tasks for this section
      if (tasksForSection.length > 0) {
        drawTasks(
          svg,
          tasksForSection,
          sectionNumber,
          timelineX,
          taskStartY,
          maxTaskHeight,
          conf,
          taskSpacing,
          false
        );
      }

      const taskCount = tasksForSection.length;
      const sectionHeight =
        node.height +
        SECTION_TASK_GAP +
        taskSpacing * Math.max(taskCount, 1) -
        (taskCount > 0 ? TASK_VERTICAL_GAP * 2 : 0);
      masterY += sectionHeight;
      sectionNumber++;
    });
  } else {
    //draw tasks
    drawTasks(
      svg,
      tasks,
      sectionNumber,
      timelineX,
      masterY,
      maxTaskHeight,
      conf,
      taskSpacing,
      true
    );
  }

  // Get BBox of the diagram (before drawing the axis line)
  let box = svg.node()?.getBBox();
  if (!box) {
    throw new Error('bbox not found');
  }
  log.debug('bounds', box);

  if (title) {
    svg
      .append('text')
      .text(title)
      .attr('x', box.width / 2 - LEFT_MARGIN)
      .attr('font-size', '4ex')
      .attr('font-weight', 'bold')
      .attr('y', 20);
    box = svg.node()?.getBBox();
    if (!box) {
      throw new Error('bbox not found');
    }
    log.debug('bounds after title', box);
  }

  const fontSize = conf.fontSize;
  const arrowTopOffset = (fontSize || 16) * 2;
  const arrowBottomPadding = (fontSize || 16) * 0.5 + 20;

  const lineWrapper = svg.append('g').attr('class', 'lineWrapper');
  // Draw activity line
  lineWrapper
    .append('line')
    .attr('x1', timelineX)
    .attr('y1', contentTopY - arrowTopOffset)
    .attr('x2', timelineX)
    .attr('y2', box.y + box.height + arrowBottomPadding)
    .attr('stroke-width', 4)
    .attr('stroke', 'black')
    .attr('marker-end', 'url(#arrowhead)');
  lineWrapper.lower();

  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    svg,
    conf.timeline?.padding ?? 50,
    conf.timeline?.useMaxWidth ?? false
  );
};

export const drawTasks = function (
  diagram: SVG,
  tasks: TimelineTask[],
  sectionColor: number,
  timelineX: number,
  masterY: number,
  maxTaskHeight: number,
  conf: MermaidConfig,
  taskSpacing: number,
  isWithoutSections: boolean
) {
  // Draw the tasks
  for (const task of tasks) {
    // create node from task
    const taskNode = {
      descr: task.task,
      section: sectionColor,
      number: sectionColor,
      width: NODE_WIDTH,
      padding: NODE_PADDING,
      maxHeight: maxTaskHeight,
    };

    log.debug('taskNode', taskNode);
    // create task wrapper
    const taskWrapper = diagram.append('g').attr('class', 'taskWrapper');
    const node = svgDraw.drawNode(taskWrapper, taskNode, sectionColor, conf);
    const taskHeight = node.height;
    //log task height
    log.debug('taskHeight after draw', taskHeight);
    const taskX = timelineX - TASK_AXIS_GAP - node.width;
    taskWrapper.attr('transform', `translate(${taskX}, ${masterY})`);

    // update max task height
    maxTaskHeight = Math.max(maxTaskHeight, taskHeight);

    // if task has events, draw them
    if (task.events && task.events.length > 0) {
      const eventsStartY = masterY;
      const eventsX = timelineX + EVENT_AXIS_GAP;
      drawEvents(diagram, task.events, sectionColor, timelineX, eventsX, eventsStartY, conf);
    }

    masterY = masterY + taskSpacing;
    if (isWithoutSections && !conf.timeline?.disableMulticolor) {
      sectionColor++;
    }
  }
};

export const drawEvents = function (
  diagram: SVG,
  events: string[],
  sectionColor: number,
  axisX: number,
  eventsX: number,
  startY: number,
  conf: MermaidConfig
) {
  let currentY = startY;
  // Draw the events
  for (const event of events) {
    // create node from event
    const eventNode: Block<string, number> = {
      descr: event,
      section: sectionColor,
      number: sectionColor,
      width: EVENT_WIDTH,
      padding: NODE_PADDING,
      maxHeight: 0,
    };

    //log task node
    log.debug('eventNode', eventNode);
    // create event wrapper
    const eventWrapper = diagram.append('g').attr('class', 'eventWrapper');
    const node = svgDraw.drawNode(eventWrapper, eventNode, sectionColor, conf);
    const eventHeight = node.height;
    eventWrapper.attr('transform', `translate(${eventsX}, ${currentY})`);

    const lineWrapper = diagram.append('g').attr('class', 'lineWrapper');
    const lineY = currentY + eventHeight / 2;
    lineWrapper
      .append('line')
      .attr('x1', axisX)
      .attr('y1', lineY)
      .attr('x2', eventsX)
      .attr('y2', lineY)
      .attr('stroke-width', 2)
      .attr('stroke', 'black')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke-dasharray', '5,5');

    currentY = currentY + eventHeight + EVENT_SPACING;
  }
  return currentY - startY;
};

export default {
  setConf: () => {
    // no-op
  },
  draw,
};
