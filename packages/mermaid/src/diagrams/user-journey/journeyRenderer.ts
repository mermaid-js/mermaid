// @ts-nocheck TODO: fix file
import { select } from 'd3';
import svgDraw from './svgDraw.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';

export const setConf = function (cnf) {
  const journeyConf = getConfig().journey;
  Object.keys(cnf).forEach((key) => {
    journeyConf[key] = cnf[key];
  });
};

const actors = {};
let maxWidth = 0;

/** @param diagram - The diagram to draw to. */
function drawActorLegend(diagram) {
  const conf = getConfig().journey;
  const maxLabelWidth = conf.maxLabelWidth;
  maxWidth = 0;
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

    // First, measure the full text width without wrapping.
    let measureText = diagram.append('text').attr('visibility', 'hidden').text(person);
    const fullTextWidth = measureText.node().getBoundingClientRect().width;
    measureText.remove();

    let lines = [];

    // If the text is naturally within the max width, use it as a single line.
    if (fullTextWidth <= maxLabelWidth) {
      lines = [person];
    } else {
      // Otherwise, wrap the text using the knuth-plass algorithm.
      const words = person.split(' '); // Split the text into words.
      let currentLine = '';
      measureText = diagram.append('text').attr('visibility', 'hidden');

      words.forEach((word) => {
        // check the width of the line with the new word.
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        measureText.text(testLine);
        const textWidth = measureText.node().getBoundingClientRect().width;

        if (textWidth > maxLabelWidth) {
          // If adding the new word exceeds max width, push the current line.
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word; // Start a new line with the current word.

          // If the word itself is too long, break it with a hyphen.
          measureText.text(word);
          if (measureText.node().getBoundingClientRect().width > maxLabelWidth) {
            let brokenWord = '';
            for (const char of word) {
              brokenWord += char;
              measureText.text(brokenWord + '-');
              if (measureText.node().getBoundingClientRect().width > maxLabelWidth) {
                // Push the broken part with a hyphen.
                lines.push(brokenWord.slice(0, -1) + '-');
                brokenWord = char;
              }
            }
            currentLine = brokenWord;
          }
        } else {
          // If the line with the new word fits, add the new word to the current line.
          currentLine = testLine;
        }
      });

      // Push the last line.
      if (currentLine) {
        lines.push(currentLine);
      }
      measureText.remove(); // Remove the text element used for measuring.
    }

    lines.forEach((line, index) => {
      const labelData = {
        x: 40,
        y: yPos + 7 + index * 20,
        fill: '#666',
        text: line,
        textMargin: conf.boxTextMargin ?? 5,
      };

      // Draw the text and measure the width.
      const textElement = svgDraw.drawText(diagram, labelData);
      const lineWidth = textElement.node().getBoundingClientRect().width;

      // Use conf.leftMargin as the initial spacing baseline,
      // but expand maxWidth if the line is wider.
      if (lineWidth > maxWidth && lineWidth > conf.leftMargin - lineWidth) {
        maxWidth = lineWidth;
      }
    });

    yPos += Math.max(20, lines.length * 20);
  });
}

export const draw = function (text, id, version, diagObj) {
  const configObject = getConfig();
  const conf = configObject.journey;
  const leftMargin = conf.leftMargin;
  const titleColor = conf.titleColor;
  const titleFontSize = conf.titleFontSize;
  const titleFontFamily = conf.titleFontFamily;
  const securityLevel = configObject.securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  // const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  bounds.init();
  const diagram = root.select('#' + id);

  svgDraw.initGraphics(diagram);

  const tasks = diagObj.db.getTasks();
  const title = diagObj.db.getDiagramTitle();

  const actorNames = diagObj.db.getActors();
  for (const member in actors) {
    delete actors[member];
  }
  let actorPos = 0;
  actorNames.forEach((actorName) => {
    actors[actorName] = {
      color: conf.actorColours[actorPos % conf.actorColours.length],
      position: actorPos,
    };
    actorPos++;
  });

  drawActorLegend(diagram);
  bounds.insert(0, 0, leftMargin, Object.keys(actors).length * 50);
  drawTasks(diagram, tasks, 0, leftMargin);

  const box = bounds.getBounds();
  if (title) {
    diagram
      .append('text')
      .text(title)
      .attr('x', leftMargin)
      .attr('font-size', titleFontSize)
      .attr('font-weight', 'bold')
      .attr('y', 25)
      .attr('fill', titleColor)
      .attr('font-family', titleFontFamily);
  }
  // **Modified Height Calculation**
  const height = box.stopy - box.starty + 2 * conf.diagramMarginY;

  // **Modified Width Calculation**
  const width = leftMargin + box.stopx + 2 * conf.diagramMarginX;
  configureSvgSize(diagram, height + 50, width + 50, conf.useMaxWidth);
  // Draw activity line
  diagram
    .append('line')
    .attr('x1', leftMargin)

    .attr('y1', conf.height * 4) // One section head + one task + margins
    .attr('x2', width - leftMargin - 4) // Subtract stroke width so arrow point is retained

    .attr('y2', conf.height * 4)
    .attr('stroke-width', 4)
    .attr('stroke', 'black')
    .attr('marker-end', 'url(#arrowhead)');

  const extraVertForTitle = title ? 70 : 0;
  // **Modified ViewBox Calculation**
  diagram.attr(
    'viewBox',
    `${box.startx} -50 ${width + 50} ${height + extraVertForTitle + conf.diagramMarginY + 100}`
  );
  diagram.attr('preserveAspectRatio', 'xMinYMin meet');
  diagram.attr('height', height + extraVertForTitle + 50); // Adjust height for extra padding
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
    if (obj[key] === undefined) {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  },
  updateBounds: function (startx, starty, stopx, stopy) {
    const conf = getConfig().journey;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _self = this;
    let cnt = 0;
    /** @param type - Set to `activation` if activation */
    function updateFn(type?: 'activation') {
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

const EST_CHAR_WIDTH_PX = 8;
const EST_LINE_HEIGHT_PX = 14;
const TASK_BOX_PADDING_PX = 10;

export const drawTasks = function (diagram, tasks, verticalPos, leftMargin) {
  const conf = getConfig().journey;
  const fills = conf.sectionFills;
  const textColours = conf.sectionColours;
  let lastSection = '';
  const sectionVHeight = conf.height * 2 + conf.diagramMarginY;
  const taskPos = verticalPos + sectionVHeight;

  let sectionNumber = 0;
  let fill = '#CCC';
  let colour = 'black';
  let num = 0;

  // Draw the tasks
  for (const [i, task] of tasks.entries()) {
    if (lastSection !== task.section) {
      fill = fills[sectionNumber % fills.length];
      num = sectionNumber % fills.length;
      colour = textColours[sectionNumber % textColours.length];

      // count how many consecutive tasks have the same section
      let taskInSectionCount = 0;
      const currentSection = task.section;
      for (let taskIndex = i; taskIndex < tasks.length; taskIndex++) {
        if (tasks[taskIndex].section == currentSection) {
          taskInSectionCount = taskInSectionCount + 1;
        } else {
          break;
        }
      }

      const section = {
        x: i * conf.taskMargin + i * conf.width + leftMargin,

        y: 50,
        text: task.section,
        fill,
        num,
        colour,
        taskCount: taskInSectionCount,
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
    task.x = i * conf.taskMargin + i * conf.width + leftMargin;

    task.y = taskPos;
    task.width = conf.diagramMarginX;
    const estimatedLines = Math.ceil((task.task.length * EST_CHAR_WIDTH_PX) / conf.width);
    task.height = Math.max(
      conf.diagramMarginY,
      estimatedLines * EST_LINE_HEIGHT_PX + TASK_BOX_PADDING_PX
    );
    task.colour = colour;
    task.fill = fill;
    task.num = num;
    task.actors = taskActors;

    // Draw the box with the attached line
    svgDraw.drawTask(diagram, task, conf);

    bounds.insert(task.x, task.y, task.x + task.width + conf.taskMargin, task.y + task.height + 10);
  }
};

export default {
  setConf,
  draw,
};
