import { select } from 'd3';
import { parser } from './parser/journey';
import journeyDb from './journeyDb';
import svgDraw from './svgDraw';
import { getConfig } from '../../config';
import { configureSvgSize } from '../../utils';

parser.yy = journeyDb;

export const setConf = function (cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};

const actors = {};

function drawActorLegend(diagram) {
  const conf = getConfig().journey;
  // Draw the actors
  let yPos = 60;
  Object.keys(actors).forEach((person) => {
    const colour = actors[person].color;

    const circleData = {
      cx: 20,
      cy: yPos,
      r: 7,
      fill: colour,
      stroke: '#000',
      pos: actors[person].position,
    };
    svgDraw.drawCircle(diagram, circleData);

    const labelData = {
      x: 40,
      y: yPos + 7,
      fill: '#666',
      text: person,
      textMargin: conf.boxTextMargin | 5,
    };
    svgDraw.drawText(diagram, labelData);

    yPos += 20;
  });
}
const conf = getConfig().journey;
const LEFT_MARGIN = getConfig().journey.leftMargin;
export const draw = function (text, id) {
  const conf = getConfig().journey;
  parser.yy.clear();
  parser.parse(text + '\n');

  bounds.init();
  const diagram = select('#' + id);
  diagram.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  svgDraw.initGraphics(diagram);

  const tasks = parser.yy.getTasks();
  const title = parser.yy.getTitle();

  const actorNames = parser.yy.getActors();
  for (let member in actors) delete actors[member];
  let actorPos = 0;
  actorNames.forEach((actorName) => {
    actors[actorName] = {
      color: conf.actorColours[actorPos % conf.actorColours.length],
      position: actorPos,
    };
    actorPos++;
  });

  drawActorLegend(diagram);
  bounds.insert(0, 0, LEFT_MARGIN, Object.keys(actors).length * 50);
  drawTasks(diagram, tasks, 0);

  const box = bounds.getBounds();
  if (title) {
    diagram
      .append('text')
      .text(title)
      .attr('x', LEFT_MARGIN)
      .attr('font-size', '4ex')
      .attr('font-weight', 'bold')
      .attr('y', 25);
  }
  const height = box.stopy - box.starty + 2 * conf.diagramMarginY;
  const width = LEFT_MARGIN + box.stopx + 2 * conf.diagramMarginX;

  configureSvgSize(diagram, height, width, conf.useMaxWidth);

  // Draw activity line
  diagram
    .append('line')
    .attr('x1', LEFT_MARGIN)
    .attr('y1', conf.height * 4) // One section head + one task + margins
    .attr('x2', width - LEFT_MARGIN - 4) // Subtract stroke width so arrow point is retained
    .attr('y2', conf.height * 4)
    .attr('stroke-width', 4)
    .attr('stroke', 'black')
    .attr('marker-end', 'url(#arrowhead)');

  const extraVertForTitle = title ? 70 : 0;
  diagram.attr('viewBox', `${box.startx} -25 ${width} ${height + extraVertForTitle}`);
  diagram.attr('preserveAspectRatio', 'xMinYMin meet');
  diagram.attr('height', height + extraVertForTitle + 25);
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
    const conf = getConfig().journey;
    const _self = this;
    let cnt = 0;
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

const fills = conf.sectionFills;
const textColours = conf.sectionColours;

export const drawTasks = function (diagram, tasks, verticalPos) {
  const conf = getConfig().journey;
  let lastSection = '';
  const sectionVHeight = conf.height * 2 + conf.diagramMarginY;
  const taskPos = verticalPos + sectionVHeight;

  let sectionNumber = 0;
  let fill = '#CCC';
  let colour = 'black';
  let num = 0;

  // Draw the tasks
  for (let i = 0; i < tasks.length; i++) {
    let task = tasks[i];
    if (lastSection !== task.section) {
      fill = fills[sectionNumber % fills.length];
      num = sectionNumber % fills.length;
      colour = textColours[sectionNumber % textColours.length];

      const section = {
        x: i * conf.taskMargin + i * conf.width + LEFT_MARGIN,
        y: 50,
        text: task.section,
        fill,
        num,
        colour,
      };

      svgDraw.drawSection(diagram, section, conf);
      lastSection = task.section;
      sectionNumber++;
    }

    // Collect the actors involved in the task
    const taskActors = task.people.reduce((acc, actorName) => {
      if (actors[actorName]) {
        acc[actorName] = actors[actorName];
      }

      return acc;
    }, {});

    // Add some rendering data to the object
    task.x = i * conf.taskMargin + i * conf.width + LEFT_MARGIN;
    task.y = taskPos;
    task.width = conf.diagramMarginX;
    task.height = conf.diagramMarginY;
    task.colour = colour;
    task.fill = fill;
    task.num = num;
    task.actors = taskActors;

    // Draw the box with the attached line
    svgDraw.drawTask(diagram, task, conf);
    bounds.insert(task.x, task.y, task.x + task.width + conf.taskMargin, 300 + 5 * 30); // stopy is the length of the descenders.
  }
};

export default {
  setConf,
  draw,
};
