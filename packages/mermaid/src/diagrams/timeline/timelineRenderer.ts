// @ts-nocheck - don't check until handle it
import type { Selection } from 'd3';
import { select } from 'd3';
import svgDraw from './svgDraw.js';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { Diagram } from '../../Diagram.js';
import type { MermaidConfig } from '../../config.type.js';

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
export const draw = function (text: string, id: string, version: string, diagObj: Diagram) {
  //1. Fetch the configuration
  const conf = getConfig();
  // @ts-expect-error - wrong config?
  const LEFT_MARGIN = conf.leftMargin ?? 50;

  log.debug('timeline', diagObj.db);

  const securityLevel = conf.securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');

  const svg = root.select('#' + id);

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
  //let sectionBeginX = 0;
  let depthY = 0;
  let sectionBeginY = 0;
  let masterX = 50 + LEFT_MARGIN;
  //sectionBeginX = masterX;
  let masterY = 50;
  sectionBeginY = 50;
  //draw sections
  let sectionNumber = 0;
  let hasSections = true;

  //Calculate the max height of the sections
  sections.forEach(function (section: string) {
    const sectionNode: Block<string, number> = {
      number: sectionNumber,
      descr: section,
      section: sectionNumber,
      width: 150,
      padding: 20,
      maxHeight: maxSectionHeight,
    };
    const sectionHeight = svgDraw.getVirtualNodeHeight(svg, sectionNode, conf);
    log.debug('sectionHeight before draw', sectionHeight);
    maxSectionHeight = Math.max(maxSectionHeight, sectionHeight + 20);
  });

  //tasks length and maxEventCount
  let maxEventCount = 0;
  let maxEventLineLength = 0;
  log.debug('tasks.length', tasks.length);
  //calculate max task height
  // for loop till tasks.length

  for (const [i, task] of tasks.entries()) {
    const taskNode: Block<TimelineTask, string> = {
      number: i,
      descr: task,
      section: task.section,
      width: 150,
      padding: 20,
      maxHeight: maxTaskHeight,
    };
    const taskHeight = svgDraw.getVirtualNodeHeight(svg, taskNode, conf);
    log.debug('taskHeight before draw', taskHeight);
    maxTaskHeight = Math.max(maxTaskHeight, taskHeight + 20);

    //calculate maxEventCount
    maxEventCount = Math.max(maxEventCount, task.events.length);
    //calculate maxEventLineLength
    let maxEventLineLengthTemp = 0;
    for (const event of task.events) {
      const eventNode = {
        descr: event,
        section: task.section,
        number: task.section,
        width: 150,
        padding: 20,
        maxHeight: 50,
      };
      maxEventLineLengthTemp += svgDraw.getVirtualNodeHeight(svg, eventNode, conf);
    }
    maxEventLineLength = Math.max(maxEventLineLength, maxEventLineLengthTemp);
  }

  log.debug('maxSectionHeight before draw', maxSectionHeight);
  log.debug('maxTaskHeight before draw', maxTaskHeight);

  if (sections && sections.length > 0) {
    sections.forEach((section) => {
      //filter task where tasks.section == section
      const tasksForSection = tasks.filter((task) => task.section === section);

      const sectionNode: Block<string, number> = {
        number: sectionNumber,
        descr: section,
        section: sectionNumber,
        width: 200 * Math.max(tasksForSection.length, 1) - 50,
        padding: 20,
        maxHeight: maxSectionHeight,
      };
      log.debug('sectionNode', sectionNode);
      const sectionNodeWrapper = svg.append('g');
      const node = svgDraw.drawNode(sectionNodeWrapper, sectionNode, sectionNumber, conf);
      log.debug('sectionNode output', node);

      sectionNodeWrapper.attr('transform', `translate(${masterX}, ${sectionBeginY})`);

      masterY += maxSectionHeight + 50;

      //draw tasks for this section
      if (tasksForSection.length > 0) {
        drawTasks(
          svg,
          tasksForSection,
          sectionNumber,
          masterX,
          masterY,
          maxTaskHeight,
          conf,
          maxEventCount,
          maxEventLineLength,
          maxSectionHeight,
          false
        );
      }
      // todo replace with total width of section and its tasks
      masterX += 200 * Math.max(tasksForSection.length, 1);

      masterY = sectionBeginY;
      sectionNumber++;
    });
  } else {
    //draw tasks
    hasSections = false;
    drawTasks(
      svg,
      tasks,
      sectionNumber,
      masterX,
      masterY,
      maxTaskHeight,
      conf,
      maxEventCount,
      maxEventLineLength,
      maxSectionHeight,
      true
    );
  }

  // Get BBox of the diagram
  const box = svg.node().getBBox();
  log.debug('bounds', box);

  if (title) {
    svg
      .append('text')
      .text(title)
      .attr('x', box.width / 2 - LEFT_MARGIN)
      .attr('font-size', '4ex')
      .attr('font-weight', 'bold')
      .attr('y', 20);
  }
  //5. Draw the diagram
  depthY = hasSections ? maxSectionHeight + maxTaskHeight + 150 : maxTaskHeight + 100;

  const lineWrapper = svg.append('g').attr('class', 'lineWrapper');
  // Draw activity line
  lineWrapper
    .append('line')
    .attr('x1', LEFT_MARGIN)
    .attr('y1', depthY) // One section head + one task + margins
    .attr('x2', box.width + 3 * LEFT_MARGIN) // Subtract stroke width so arrow point is retained
    .attr('y2', depthY)
    .attr('stroke-width', 4)
    .attr('stroke', 'black')
    .attr('marker-end', 'url(#arrowhead)');

  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    svg,
    conf.timeline?.padding ?? 50,
    conf.timeline?.useMaxWidth ?? false
  );

  // addSVGAccessibilityFields(diagObj.db, diagram, id);
};

export const drawTasks = function (
  diagram: Selection<SVGElement, unknown, null, undefined>,
  tasks: TimelineTask[],
  sectionColor: number,
  masterX: number,
  masterY: number,
  maxTaskHeight: number,
  conf: MermaidConfig,
  maxEventCount: number,
  maxEventLineLength: number,
  maxSectionHeight: number,
  isWithoutSections: boolean
) {
  // Draw the tasks
  for (const task of tasks) {
    // create node from task
    const taskNode = {
      descr: task.task,
      section: sectionColor,
      number: sectionColor,
      width: 150,
      padding: 20,
      maxHeight: maxTaskHeight,
    };

    log.debug('taskNode', taskNode);
    // create task wrapper

    const taskWrapper = diagram.append('g').attr('class', 'taskWrapper');
    const node = svgDraw.drawNode(taskWrapper, taskNode, sectionColor, conf);
    const taskHeight = node.height;
    //log task height
    log.debug('taskHeight after draw', taskHeight);
    taskWrapper.attr('transform', `translate(${masterX}, ${masterY})`);

    // update max task height
    maxTaskHeight = Math.max(maxTaskHeight, taskHeight);

    // if task has events, draw them
    if (task.events) {
      // draw a line between the task and the events
      const lineWrapper = diagram.append('g').attr('class', 'lineWrapper');
      let lineLength = maxTaskHeight;
      //add margin to task
      masterY += 100;
      lineLength =
        lineLength + drawEvents(diagram, task.events, sectionColor, masterX, masterY, conf);
      masterY -= 100;

      lineWrapper
        .append('line')
        .attr('x1', masterX + 190 / 2)
        .attr('y1', masterY + maxTaskHeight) // One section head + one task + margins
        .attr('x2', masterX + 190 / 2) // Subtract stroke width so arrow point is retained
        .attr(
          'y2',
          masterY +
            maxTaskHeight +
            (isWithoutSections ? maxTaskHeight : maxSectionHeight) +
            maxEventLineLength +
            120
        )
        .attr('stroke-width', 2)
        .attr('stroke', 'black')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('stroke-dasharray', '5,5');
    }

    masterX = masterX + 200;
    if (isWithoutSections && !conf.timeline?.disableMulticolor) {
      sectionColor++;
    }
  }

  // reset Y coordinate for next section
  masterY = masterY - 10;
};

export const drawEvents = function (
  diagram: Selection<SVGElement, unknown, null, undefined>,
  events: string[],
  sectionColor: number,
  masterX: number,
  masterY: number,
  conf: MermaidConfig
) {
  let maxEventHeight = 0;
  const eventBeginY = masterY;
  masterY = masterY + 100;
  // Draw the events
  for (const event of events) {
    // create node from event
    const eventNode: Block<string, number> = {
      descr: event,
      section: sectionColor,
      number: sectionColor,
      width: 150,
      padding: 20,
      maxHeight: 50,
    };

    //log task node
    log.debug('eventNode', eventNode);
    // create event wrapper
    const eventWrapper = diagram.append('g').attr('class', 'eventWrapper');
    const node = svgDraw.drawNode(eventWrapper, eventNode, sectionColor, conf);
    const eventHeight = node.height;
    maxEventHeight = maxEventHeight + eventHeight;
    eventWrapper.attr('transform', `translate(${masterX}, ${masterY})`);
    masterY = masterY + 10 + eventHeight;
  }
  // set masterY back to eventBeginY
  masterY = eventBeginY;
  return maxEventHeight;
};

export default {
  setConf: () => {
    // no-op
  },
  draw,
};
