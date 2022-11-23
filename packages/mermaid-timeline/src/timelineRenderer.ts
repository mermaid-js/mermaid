// @ts-nocheck TODO: fix file
import { select } from 'd3';
import svgDraw from './svgDraw';
import { configureSvgSize } from '../../setupGraphViewbox';
import addSVGAccessibilityFields from '../../accessibility';

import { log, getConfig, setupGraphViewbox } from './mermaidUtils';

export const setConf = function (cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};

export const draw = function (text, id, version, diagObj) {
  //1. Fetch the configuration
  const conf = getConfig();
  const LEFT_MARGIN = conf.leftMargin?conf.leftMargin:50;

  //2. Clear the diagram db before parsing
  diagObj.db.clear();

  //3. Parse the diagram text
  diagObj.parser.parse(text + '\n');

  log.info('timeline', diagObj.db);

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

  // Init bounds
  bounds.init();



  const svg = root.select('#' + id);

  svg.append('g');

  //4. Fetch the diagram data
  const tasks = diagObj.db.getTasks();
  const title = diagObj.db.getCommonDb().getDiagramTitle();

  //log tasks
  log.info(tasks);

  //5. Initialize the diagram
  svgDraw.initGraphics(svg);

  //bounds.insert(0, 0, LEFT_MARGIN, 0);
  // fetch Sections
  const sections = diagObj.db.getSections();
  // log sections
  log.info(sections);

  let maxSectionHeight = 0;
  let maxTaskHeight = 0;
  let sectionBeginX = 0;
  let sectionBeginY = 0;
  let masterX = 50 + LEFT_MARGIN;
  sectionBeginX = masterX;
  let masterY = 50;
  sectionBeginY=50;
  //draw sections
  let sectionNumber = 0;

  //Calculate the max height of the sections
  sections.forEach(function (section) {
    const sectionNode = {
      number: sectionNumber,
      descr: section,
      section: sectionNumber,
      width: 150,
      padding: 20,
      maxHeight: maxSectionHeight,
    };
    const sectionHeight = svgDraw.getVirtualNodeHeight(svg, sectionNode, conf);
    log.info('sectionHeight before draw', sectionHeight);
    maxSectionHeight = Math.max(maxSectionHeight, sectionHeight +20);
  });

//tasks length and maxEventCount
let maxEventCount = 0;
  log.info('tasks.length', tasks.length);
   //calculate max task height
  // for loop till tasks.length
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    const taskNode = {
      number: i,
      descr: task,
      section: task.section,
      width: 150,
      padding: 20,
      maxHeight: maxTaskHeight,
    };
    const taskHeight = svgDraw.getVirtualNodeHeight(svg, taskNode, conf);
    log.info('taskHeight before draw', taskHeight);
    maxTaskHeight = Math.max(maxTaskHeight, taskHeight + 20);

    //calculate maxEventCount
    maxEventCount = Math.max(maxEventCount, task.events.length);
  }


  log.info('maxSectionHeight before draw', maxSectionHeight);
  log.info('maxTaskHeight before draw', maxTaskHeight);

  if (sections && sections.length > 0) {
    sections.forEach((section) => {

      const sectionNode = {
        number: sectionNumber,
        descr: section,
        section: sectionNumber,
        width: 150,
        padding: 20,
        maxHeight: maxSectionHeight,
      };
      //log section node
      log.info('sectionNode', sectionNode);
      const sectionNodeWrapper = svg.append('g');
      const node = svgDraw.drawNode(sectionNodeWrapper, sectionNode, sectionNumber, conf);
      // add node to section list
      //sectionList.push(node);
      //const nodeHeight = node.height + 20;
      //Post process the node
      //append g

      sectionNodeWrapper.attr(
        'transform',
        `translate(${masterX}, ${sectionBeginY})`
      );
      //maxSectionHeight = Math.max(maxSectionHeight, nodeHeight);
      masterY += maxSectionHeight + 50;



      //draw tasks for this section
      //filter task where tasks.section == section
      const tasksForSection = tasks.filter((task) => task.section === section);
      if (tasksForSection.length > 0) {


        drawTasks(svg, tasksForSection, sectionNumber, masterX, masterY, maxTaskHeight, conf, maxEventCount,false);
      }
      // todo replace with total width of section and its tasks
      masterX += 200 * Math.max(tasksForSection.length, 1);

      masterY = sectionBeginY;
      sectionNumber++;
    });
  } else {
    //draw tasks
    drawTasks(svg, tasks, sectionNumber, masterX, masterY, maxTaskHeight, conf, maxEventCount,true);
  }




  // draw tasks
  //drawTasks(svg, tasks, 0);

  const box = bounds.getBounds();
  if (title) {
    svg
      .append('text')
      .text(title)
      .attr('x', LEFT_MARGIN)
      .attr('font-size', '4ex')
      .attr('font-weight', 'bold')
      .attr('y', 25);
  }

  const height = box.stopy - box.starty + 2 * conf.diagramMarginY;
  const width = LEFT_MARGIN + box.stopx + 2 * conf.diagramMarginX;

// Setup the view box and size of the svg element
  setupGraphViewbox(undefined, svg, conf.timeline.padding, conf.timeline.useMaxWidth);

  //5. Draw the diagram
 const maxTaskLength = 500;

 // Draw activity line
  svg
    .append('line')
    .attr('x1', LEFT_MARGIN)
    .attr('y1', maxSectionHeight + maxTaskHeight +150) // One section head + one task + margins
    .attr('x2', tasks && tasks.length? (tasks.length*200)+ 400 :  400) // Subtract stroke width so arrow point is retained
    .attr('y2', maxSectionHeight + maxTaskHeight +150)
    .attr('stroke-width', 4)
    .attr('stroke', 'black')
    .attr('marker-end', 'url(#arrowhead)');

  const extraVertForTitle = title ? 70 : 0;
  svg.attr('viewBox', `${box.startx} -25 ${width} ${height + extraVertForTitle}`);
  svg.attr('preserveAspectRatio', 'xMinYMin meet');
  svg.attr('height', height + extraVertForTitle + 25);

  // addSVGAccessibilityFields(diagObj.db, diagram, id);
};

export const bounds = {
  data: {
    startx: undefined,
    stopx: undefined,
    starty: undefined,
    stopy: undefined,
  },
  verticalPos: 0,

  sequenceItems: [],
  init: function () {
    this.sequenceItems = [];
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined,
    };
    this.verticalPos = 0;
  },
  updateVal: function (obj, key, val, fun) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  },
  updateBounds: function (startx, starty, stopx, stopy) {
    const conf = getConfig().timeline;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _self = this;
    let cnt = 0;
    /** @param {any} type */
    function updateFn(type) {
      return function updateItemBounds(item) {
        cnt++;
        // The loop sequenceItems is a stack so the biggest margins in the beginning of the sequenceItems
        const n = _self.sequenceItems.length - cnt + 1;
        _self.updateVal(item, 'starty', starty - n * conf.boxMargin, Math.min);
        _self.updateVal(item, 'stopy', stopy + n * conf.boxMargin, Math.max);

        _self.updateVal(bounds.data, 'startx', startx - n * conf.boxMargin, Math.min);
        _self.updateVal(bounds.data, 'stopx', stopx + n * conf.boxMargin, Math.max);

        if (!(type === 'activation')) {
          _self.updateVal(item, 'startx', startx - n * conf.boxMargin, Math.min);
          _self.updateVal(item, 'stopx', stopx + n * conf.boxMargin, Math.max);

          _self.updateVal(bounds.data, 'starty', starty - n * conf.boxMargin, Math.min);
          _self.updateVal(bounds.data, 'stopy', stopy + n * conf.boxMargin, Math.max);
        }
      };
    }

    this.sequenceItems.forEach(updateFn());
  },
  insert: function (startx, starty, stopx, stopy) {
    const _startx = Math.min(startx, stopx);
    const _stopx = Math.max(startx, stopx);
    const _starty = Math.min(starty, stopy);
    const _stopy = Math.max(starty, stopy);

    this.updateVal(bounds.data, 'startx', _startx, Math.min);
    this.updateVal(bounds.data, 'starty', _starty, Math.min);
    this.updateVal(bounds.data, 'stopx', _stopx, Math.max);
    this.updateVal(bounds.data, 'stopy', _stopy, Math.max);

    this.updateBounds(_startx, _starty, _stopx, _stopy);
  },
  bumpVerticalPos: function (bump) {
    this.verticalPos = this.verticalPos + bump;
    this.data.stopy = this.verticalPos;
  },
  getVerticalPos: function () {
    return this.verticalPos;
  },
  getBounds: function () {
    return this.data;
  },
};



export const drawTasks = function (diagram, tasks, sectionColor, masterX, masterY, maxTaskHeight,conf,maxEventCount, isWithoutSections) {

  const taskBeginY = masterY;

  const taskBeginX = masterX;

  // Draw the tasks
  for (let i = 0; i < tasks.length; i++) {

    const task = tasks[i];
    // create node from task
    const taskNode = {
      descr: task.task,
      section: sectionColor,
      number : sectionColor,
      width: 150,
      padding: 20,
      maxHeight: maxTaskHeight,
    };

    //log task node
    log.info('taskNode', taskNode);
    // create task wrapper
    const taskWrapper = diagram.append('g').attr('class', 'taskWrapper');
    const node = svgDraw.drawNode(taskWrapper, taskNode, sectionColor, conf);
    const taskHeight = node.height;
    //log task height
    log.info('taskHeight after draw', taskHeight);
    taskWrapper.attr(
      'transform',
      `translate(${masterX}, ${masterY})`
    );

    // update max task height
    maxTaskHeight = Math.max(maxTaskHeight, taskHeight);



     // if task has events, draw them
    if (task.events) {
    // draw a line between the task and the events
      const lineWrapper = diagram.append('g').attr('class', 'lineWrapper');

      let linelength = maxTaskHeight;



    //add margin to task
    masterY += 100;
     linelength = linelength+ drawEvents(diagram, task.events, sectionColor, masterX, masterY, conf);
      masterY -= 100;

      lineWrapper
    .append('line')
    .attr('x1', masterX + 190/2)
    .attr('y1', masterY + maxTaskHeight) // One section head + one task + margins
    .attr('x2', masterX + 190/2) // Subtract stroke width so arrow point is retained
    .attr('y2', masterY  + linelength + maxEventCount * 100)
    .attr('stroke-width', 2)
    .attr('stroke', 'black')
    .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke-dasharray', "5,5");
    }



    masterX = masterX + 200;
    if (isWithoutSections) {
       sectionColor++;
  }
  }


// reset Y coordinate for next section
    masterY= masterY -10; ;
};

export const drawEvents = function (diagram, events, sectionColor, masterX, masterY, conf) {

  let maxEventHeight = 0;
  const eventBeginY = masterY;
  masterY = masterY + 100
  // Draw the events
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    // create node from event
    const eventNode = {
      descr: event,
      section: sectionColor,
      number : sectionColor,
      width: 150,
      padding: 20,
      maxHeight: 50,
    };

    //log task node
    log.info('eventNode', eventNode);
    // create event wrapper
    const eventWrapper = diagram.append('g').attr('class', 'eventWrapper');
    const node = svgDraw.drawNode(eventWrapper, eventNode, sectionColor, conf)
    const eventHeight = node.height;
    maxEventHeight= maxEventHeight + eventHeight;
    eventWrapper.attr(
      'transform',
      `translate(${masterX}, ${masterY})`
    );
    masterY = masterY + 10 + eventHeight;

  }
  // set masterY back to eventBeginY
  masterY = eventBeginY;
  return maxEventHeight;

};

export default {
  setConf,
  draw,
};
