import { select, selectAll } from 'd3';
import svgDraw from './svgDraw';
import { logger } from '../../logger';
import { parser } from './parser/sequenceDiagram';
import common from '../common/common';
import sequenceDb from './sequenceDb';

parser.yy = sequenceDb;

const conf = {
  diagramMarginX: 50,
  diagramMarginY: 30,
  // Margin between actors
  actorMargin: 50,
  // Width of actor boxes
  width: 150,
  // Height of actor boxes
  height: 65,
  actorFontSize: 14,
  actorFontFamily: '"Open-Sans", "sans-serif"',
  // Note font settings
  noteFontSize: 14,
  noteFontFamily: '"trebuchet ms", verdana, arial',
  noteAlign: 'center',
  // Message font settings
  messageFontSize: 16,
  messageFontFamily: '"trebuchet ms", verdana, arial',
  // Margin around loop boxes
  boxMargin: 10,
  boxTextMargin: 5,
  noteMargin: 10,
  // Space between messages
  messageMargin: 35,
  // Multiline message alignment
  messageAlign: 'center',
  // mirror actors under diagram
  mirrorActors: false,
  // Depending on css styling this might need adjustment
  // Prolongs the edge of the diagram downwards
  bottomMarginAdj: 1,

  // width of activation box
  activationWidth: 10,

  // text placement as: tspan | fo | old only text as before
  textPlacement: 'tspan',

  showSequenceNumbers: false
};

export const bounds = {
  data: {
    startx: undefined,
    stopx: undefined,
    starty: undefined,
    stopy: undefined
  },
  verticalPos: 0,

  sequenceItems: [],
  activations: [],
  init: function() {
    this.sequenceItems = [];
    this.activations = [];
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined
    };
    this.verticalPos = 0;
  },
  updateVal: function(obj, key, val, fun) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  },
  updateBounds: function(startx, starty, stopx, stopy) {
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
    this.activations.forEach(updateFn('activation'));
  },
  insert: function(startx, starty, stopx, stopy) {
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
  newActivation: function(message, diagram) {
    const actorRect = parser.yy.getActors()[message.from.actor];
    const stackedSize = actorActivations(message.from.actor).length;
    const x = actorRect.x + conf.width / 2 + ((stackedSize - 1) * conf.activationWidth) / 2;
    this.activations.push({
      startx: x,
      starty: this.verticalPos + 2,
      stopx: x + conf.activationWidth,
      stopy: undefined,
      actor: message.from.actor,
      anchored: svgDraw.anchorElement(diagram)
    });
  },
  endActivation: function(message) {
    // find most recent activation for given actor
    const lastActorActivationIdx = this.activations
      .map(function(activation) {
        return activation.actor;
      })
      .lastIndexOf(message.from.actor);
    const activation = this.activations.splice(lastActorActivationIdx, 1)[0];
    return activation;
  },
  newLoop: function(title, fill) {
    this.sequenceItems.push({
      startx: undefined,
      starty: this.verticalPos,
      stopx: undefined,
      stopy: undefined,
      title: title,
      fill: fill
    });
  },
  endLoop: function() {
    const loop = this.sequenceItems.pop();
    return loop;
  },
  addSectionToLoop: function(message) {
    const loop = this.sequenceItems.pop();
    loop.sections = loop.sections || [];
    loop.sectionTitles = loop.sectionTitles || [];
    loop.sections.push(bounds.getVerticalPos());
    loop.sectionTitles.push(message);
    this.sequenceItems.push(loop);
  },
  bumpVerticalPos: function(bump) {
    this.verticalPos = this.verticalPos + bump;
    this.data.stopy = this.verticalPos;
  },
  getVerticalPos: function() {
    return this.verticalPos;
  },
  getBounds: function() {
    return this.data;
  }
};

const _drawLongText = (text, x, y, g, width) => {
  let textHeight = 0;
  let prevTextHeight = 0;

  const alignmentToAnchor = {
    left: 'start',
    start: 'start',
    center: 'middle',
    middle: 'middle',
    right: 'end',
    end: 'end'
  };

  const lines = text.split(common.lineBreakRegex);
  for (const line of lines) {
    const textObj = svgDraw.getTextObj();
    const alignment = alignmentToAnchor[conf.noteAlign] || 'middle';

    switch (alignment) {
      case 'start':
        textObj.x = x + conf.noteMargin;
        break;
      case 'middle':
        textObj.x = x + width / 2;
        break;
      case 'end':
        textObj.x = x + width - conf.noteMargin;
        break;
    }

    textObj.y = y + textHeight;
    textObj.dy = '1em';
    textObj.text = line;
    textObj.class = 'noteText';

    const textElem = svgDraw
      .drawText(g, textObj)
      .style('text-anchor', alignment)
      .style('font-size', conf.noteFontSize)
      .style('font-family', conf.noteFontFamily)
      .attr('dominant-baseline', 'central')
      .attr('alignment-baseline', 'central');

    textHeight += (textElem._groups || textElem)[0][0].getBBox().height;
    textElem.attr('y', y + (prevTextHeight + textHeight + 2 * conf.noteMargin) / 2);
    prevTextHeight = textHeight;
  }

  return textHeight;
};

/**
 * Draws an note in the diagram with the attaced line
 * @param elem - The diagram to draw to.
 * @param startx - The x axis start position.
 * @param verticalPos - The y axis position.
 * @param msg - The message to be drawn.
 * @param forceWidth - Set this with a custom width to override the default configured width.
 */
const drawNote = function(elem, startx, verticalPos, msg, forceWidth) {
  const rect = svgDraw.getNoteRect();
  rect.x = startx;
  rect.y = verticalPos;
  rect.width = forceWidth || conf.width;
  rect.class = 'note';

  let g = elem.append('g');
  const rectElem = svgDraw.drawRect(g, rect);

  const textHeight = _drawLongText(msg.message, startx, verticalPos, g, rect.width);

  bounds.insert(
    startx,
    verticalPos,
    startx + rect.width,
    verticalPos + 2 * conf.noteMargin + textHeight
  );

  rectElem.attr('height', textHeight + 2 * conf.noteMargin);
  bounds.bumpVerticalPos(textHeight + 2 * conf.noteMargin);
};

/**
 * Draws a message
 * @param elem
 * @param startx
 * @param stopx
 * @param verticalPos
 * @param txtCenter
 * @param msg
 */
const drawMessage = function(elem, startx, stopx, verticalPos, msg, sequenceIndex) {
  const g = elem.append('g');
  const txtCenter = startx + (stopx - startx) / 2;

  let textElems = [];
  let counterBreaklines = 0;
  let breaklineOffset = 17;
  const breaklines = msg.message.split(common.lineBreakRegex);
  for (const breakline of breaklines) {
    textElems.push(
      g
        .append('text') // text label for the x axis
        .attr('x', txtCenter)
        .attr('y', verticalPos - 7 + counterBreaklines * breaklineOffset)
        .style('font-size', conf.messageFontSize)
        .style('font-family', conf.messageFontFamily)
        .style('text-anchor', 'middle')
        .attr('class', 'messageText')
        .text(breakline.trim())
    );
    counterBreaklines++;
  }
  const offsetLineCounter = counterBreaklines - 1;
  let totalOffset = offsetLineCounter * breaklineOffset;

  let textWidths = textElems.map(function(textElem) {
    return (textElem._groups || textElem)[0][0].getBBox().width;
  });
  let textWidth = Math.max(...textWidths);
  for (const textElem of textElems) {
    if (conf.messageAlign === 'left') {
      textElem.attr('x', txtCenter - textWidth / 2).style('text-anchor', 'start');
    } else if (conf.messageAlign === 'right') {
      textElem.attr('x', txtCenter + textWidth / 2).style('text-anchor', 'end');
    }
  }

  bounds.bumpVerticalPos(totalOffset);

  let line;
  if (startx === stopx) {
    if (conf.rightAngles) {
      line = g
        .append('path')
        .attr(
          'd',
          `M  ${startx},${verticalPos + totalOffset} H ${startx + conf.width / 2} V ${verticalPos +
            25 +
            totalOffset} H ${startx}`
        );
    } else {
      totalOffset += 5;

      line = g
        .append('path')
        .attr(
          'd',
          'M ' +
            startx +
            ',' +
            (verticalPos + totalOffset) +
            ' C ' +
            (startx + 60) +
            ',' +
            (verticalPos - 10 + totalOffset) +
            ' ' +
            (startx + 60) +
            ',' +
            (verticalPos + 30 + totalOffset) +
            ' ' +
            startx +
            ',' +
            (verticalPos + 20 + totalOffset)
        );
    }

    bounds.bumpVerticalPos(30 + totalOffset);
    const dx = Math.max(textWidth / 2, 100);
    bounds.insert(
      startx - dx,
      bounds.getVerticalPos() - 10 + totalOffset,
      stopx + dx,
      bounds.getVerticalPos() + totalOffset
    );
  } else {
    line = g.append('line');
    line.attr('x1', startx);
    line.attr('y1', verticalPos + totalOffset);
    line.attr('x2', stopx);
    line.attr('y2', verticalPos + totalOffset);
    bounds.insert(
      startx,
      bounds.getVerticalPos() - 10 + totalOffset,
      stopx,
      bounds.getVerticalPos() + totalOffset
    );
  }
  // Make an SVG Container
  // Draw the line
  if (
    msg.type === parser.yy.LINETYPE.DOTTED ||
    msg.type === parser.yy.LINETYPE.DOTTED_CROSS ||
    msg.type === parser.yy.LINETYPE.DOTTED_OPEN
  ) {
    line.style('stroke-dasharray', '3, 3');
    line.attr('class', 'messageLine1');
  } else {
    line.attr('class', 'messageLine0');
  }

  let url = '';
  if (conf.arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  line.attr('stroke-width', 2);
  line.attr('stroke', 'black');
  line.style('fill', 'none'); // remove any fill colour
  if (msg.type === parser.yy.LINETYPE.SOLID || msg.type === parser.yy.LINETYPE.DOTTED) {
    line.attr('marker-end', 'url(' + url + '#arrowhead)');
  }

  if (msg.type === parser.yy.LINETYPE.SOLID_CROSS || msg.type === parser.yy.LINETYPE.DOTTED_CROSS) {
    line.attr('marker-end', 'url(' + url + '#crosshead)');
  }

  // add node number
  if (sequenceDb.showSequenceNumbers() || conf.showSequenceNumbers) {
    line.attr('marker-start', 'url(' + url + '#sequencenumber)');
    g.append('text')
      .attr('x', startx)
      .attr('y', verticalPos + 4 + totalOffset)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('textLength', '16px')
      .attr('class', 'sequenceNumber')
      .text(sequenceIndex);
  }
};

export const drawActors = function(diagram, actors, actorKeys, verticalPos) {
  // Draw the actors
  let prevWidth = 0;
  let prevMargin = 0;

  for (let i = 0; i < actorKeys.length; i++) {
    const actor = actors[actorKeys[i]];

    // Add some rendering data to the object
    actor.width = actor.width || calculateActorWidth(actor);
    actor.height = conf.height;
    actor.margin = actor.margin || conf.actorMargin;

    actor.x = prevWidth + prevMargin;
    actor.y = verticalPos;

    // Draw the box with the attached line
    svgDraw.drawActor(diagram, actor, conf);
    bounds.insert(actor.x, verticalPos, actor.x + actor.width, conf.height);

    prevWidth += actor.width;
    prevMargin += actor.margin;
  }

  // Add a margin between the actor boxes and the first arrow
  bounds.bumpVerticalPos(conf.height);
};

export const setConf = function(cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function(key) {
    conf[key] = cnf[key];
  });

  if (cnf.fontFamily) {
    conf.actorFontFamily = conf.noteFontFamily = cnf.fontFamily;
  }
};

const actorActivations = function(actor) {
  return bounds.activations.filter(function(activation) {
    return activation.actor === actor;
  });
};

const actorFlowVerticaBounds = function(actor) {
  // handle multiple stacked activations for same actor
  const actorObj = parser.yy.getActors()[actor];
  const activations = actorActivations(actor);

  const left = activations.reduce(function(acc, activation) {
    return Math.min(acc, activation.startx);
  }, actorObj.x + actorObj.width / 2);
  const right = activations.reduce(function(acc, activation) {
    return Math.max(acc, activation.stopx);
  }, actorObj.x + actorObj.width / 2);
  return [left, right];
};

/**
 * This calculates the actor's width, taking into account both the statically configured width,
 * and the actor's description.
 *
 * If the description text has greater length, we extend the width of the actor, so it's description
 * won't overflow.
 *
 * @param actor - An actor object
 * @return - The width for the given actor
 */
const calculateActorWidth = function(actor) {
  if (!actor.description) {
    return conf.width;
  }

  return Math.max(
    conf.width,
    calculateTextWidth(actor.description, conf.actorFontSize, conf.actorFontFamily)
  );
};

/**
 * This calculates the width of the given text, font size and family.
 *
 * @param text - The text to calculate the width of
 * @param fontSize - The font size of the given text
 * @param fontFamily - The font family (one, or more fonts) to render
 */
export const calculateTextWidth = function(text, fontSize, fontFamily) {
  if (!text) {
    return 0;
  }

  fontSize = fontSize ? fontSize : conf.actorFontSize;
  fontFamily = fontFamily ? fontFamily : conf.actorFontFamily;

  // We can't really know if the user supplied font family will render on the user agent;
  // thus, we'll take the max width between the user supplied font family, and a default
  // of sans-serif.
  const fontFamilies = ['sans-serif', fontFamily];
  const lines = text.split(common.lineBreakRegex);
  let maxWidth = 0;

  const body = select('body');
  // We don'y want to leak DOM elements - if a removal operation isn't available
  // for any reason, do not continue.
  if (!body.remove) {
    return 0;
  }

  const g = body.append('svg');

  for (let line of lines) {
    for (let fontFamily of fontFamilies) {
      const textObj = svgDraw.getTextObj();
      textObj.text = line;
      const textElem = svgDraw
        .drawText(g, textObj)
        .style('font-size', fontSize)
        .style('font-family', fontFamily);

      maxWidth = Math.max(maxWidth, (textElem._groups || textElem)[0][0].getBBox().width);
    }
  }

  g.remove();

  // Adds some padding, so the text won't sit exactly within the actor's borders
  return maxWidth + 35;
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  parser.yy.clear();
  parser.parse(text + '\n');

  bounds.init();
  const diagram = select(`[id="${id}"]`);

  let startx;
  let stopx;
  let forceWidth;

  // Fetch data from the parsing
  const actors = parser.yy.getActors();
  const actorKeys = parser.yy.getActorKeys();
  const messages = parser.yy.getMessages();
  const title = parser.yy.getTitle();

  const maxMessageWidthPerActor = getMaxMessageWidthPerActor(actors, messages);
  calculateActorMargins(actors, maxMessageWidthPerActor);

  drawActors(diagram, actors, actorKeys, 0);

  // The arrow head definition is attached to the svg once
  svgDraw.insertArrowHead(diagram);
  svgDraw.insertArrowCrossHead(diagram);
  svgDraw.insertSequenceNumber(diagram);

  function activeEnd(msg, verticalPos) {
    const activationData = bounds.endActivation(msg);
    if (activationData.starty + 18 > verticalPos) {
      activationData.starty = verticalPos - 6;
      verticalPos += 12;
    }
    svgDraw.drawActivation(
      diagram,
      activationData,
      verticalPos,
      conf,
      actorActivations(msg.from.actor).length
    );

    bounds.insert(activationData.startx, verticalPos - 10, activationData.stopx, verticalPos);
  }

  // Draw the messages/signals
  let sequenceIndex = 1;
  messages.forEach(function(msg) {
    let loopData;
    const noteWidth = Math.max(
      conf.width,
      calculateTextWidth(msg.message, conf.noteFontSize, conf.noteFontFamily)
    );

    switch (msg.type) {
      case parser.yy.LINETYPE.NOTE:
        bounds.bumpVerticalPos(conf.boxMargin);

        startx = actors[msg.from].x;
        stopx = actors[msg.to].x;

        if (msg.placement === parser.yy.PLACEMENT.RIGHTOF) {
          drawNote(
            diagram,
            startx + (actors[msg.from].width + conf.actorMargin) / 2,
            bounds.getVerticalPos(),
            msg,
            noteWidth
          );
        } else if (msg.placement === parser.yy.PLACEMENT.LEFTOF) {
          drawNote(
            diagram,
            startx - noteWidth + (actors[msg.from].width - conf.actorMargin) / 2,
            bounds.getVerticalPos(),
            msg,
            noteWidth
          );
        } else if (msg.to === msg.from) {
          // Single-actor over
          drawNote(
            diagram,
            startx + (actors[msg.to].width - noteWidth) / 2,
            bounds.getVerticalPos(),
            msg,
            noteWidth
          );
        } else {
          // Multi-actor over
          forceWidth = Math.abs(startx - stopx) + conf.actorMargin;
          let x =
            startx < stopx
              ? startx + (actors[msg.from].width - conf.actorMargin) / 2
              : stopx + (actors[msg.to].width - conf.actorMargin) / 2;

          drawNote(diagram, x, bounds.getVerticalPos(), msg, forceWidth);
        }
        break;
      case parser.yy.LINETYPE.ACTIVE_START:
        bounds.newActivation(msg, diagram);
        break;
      case parser.yy.LINETYPE.ACTIVE_END:
        activeEnd(msg, bounds.getVerticalPos());
        break;
      case parser.yy.LINETYPE.LOOP_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;
      case parser.yy.LINETYPE.LOOP_END:
        loopData = bounds.endLoop();

        svgDraw.drawLoop(diagram, loopData, 'loop', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      case parser.yy.LINETYPE.RECT_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(undefined, msg.message);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      case parser.yy.LINETYPE.RECT_END: {
        const rectData = bounds.endLoop();
        svgDraw.drawBackgroundRect(diagram, rectData);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      }
      case parser.yy.LINETYPE.OPT_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;
      case parser.yy.LINETYPE.OPT_END:
        loopData = bounds.endLoop();

        svgDraw.drawLoop(diagram, loopData, 'opt', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      case parser.yy.LINETYPE.ALT_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;
      case parser.yy.LINETYPE.ALT_ELSE:
        bounds.bumpVerticalPos(conf.boxMargin);
        loopData = bounds.addSectionToLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      case parser.yy.LINETYPE.ALT_END:
        loopData = bounds.endLoop();

        svgDraw.drawLoop(diagram, loopData, 'alt', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      case parser.yy.LINETYPE.PAR_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;
      case parser.yy.LINETYPE.PAR_AND:
        bounds.bumpVerticalPos(conf.boxMargin);
        loopData = bounds.addSectionToLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      case parser.yy.LINETYPE.PAR_END:
        loopData = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopData, 'par', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;
      default:
        try {
          // lastMsg = msg
          bounds.bumpVerticalPos(conf.messageMargin);
          const fromBounds = actorFlowVerticaBounds(msg.from);
          const toBounds = actorFlowVerticaBounds(msg.to);
          const fromIdx = fromBounds[0] <= toBounds[0] ? 1 : 0;
          const toIdx = fromBounds[0] < toBounds[0] ? 0 : 1;
          startx = fromBounds[fromIdx];
          stopx = toBounds[toIdx];

          const verticalPos = bounds.getVerticalPos();
          drawMessage(diagram, startx, stopx, verticalPos, msg, sequenceIndex);
          const allBounds = fromBounds.concat(toBounds);
          bounds.insert(
            Math.min.apply(null, allBounds),
            verticalPos,
            Math.max.apply(null, allBounds),
            verticalPos
          );
        } catch (e) {
          logger.error('error while drawing message', e);
        }
    }
    // Increment sequence counter if msg.type is a line (and not another event like activation or note, etc)
    if (
      [
        parser.yy.LINETYPE.SOLID_OPEN,
        parser.yy.LINETYPE.DOTTED_OPEN,
        parser.yy.LINETYPE.SOLID,
        parser.yy.LINETYPE.DOTTED,
        parser.yy.LINETYPE.SOLID_CROSS,
        parser.yy.LINETYPE.DOTTED_CROSS
      ].includes(msg.type)
    ) {
      sequenceIndex++;
    }
  });

  if (conf.mirrorActors) {
    // Draw actors below diagram
    bounds.bumpVerticalPos(conf.boxMargin * 2);
    drawActors(diagram, actors, actorKeys, bounds.getVerticalPos());
  }

  const box = bounds.getBounds();

  // Adjust line height of actor lines now that the height of the diagram is known
  logger.debug('For line height fix Querying: #' + id + ' .actor-line');
  const actorLines = selectAll('#' + id + ' .actor-line');
  actorLines.attr('y2', box.stopy);

  let height = box.stopy - box.starty + 2 * conf.diagramMarginY;
  if (conf.mirrorActors) {
    height = height - conf.boxMargin + conf.bottomMarginAdj;
  }

  const width = box.stopx - box.startx + 2 * conf.diagramMarginX;

  if (title) {
    diagram
      .append('text')
      .text(title)
      .attr('x', (box.stopx - box.startx) / 2 - 2 * conf.diagramMarginX)
      .attr('y', -25);
  }

  if (conf.useMaxWidth) {
    diagram.attr('height', '100%');
    diagram.attr('width', '100%');
    diagram.attr('style', 'max-width:' + width + 'px;');
  } else {
    diagram.attr('height', height);
    diagram.attr('width', width);
  }
  const extraVertForTitle = title ? 40 : 0;
  diagram.attr(
    'viewBox',
    box.startx -
      conf.diagramMarginX +
      ' -' +
      (conf.diagramMarginY + extraVertForTitle) +
      ' ' +
      width +
      ' ' +
      (height + extraVertForTitle)
  );
};

/**
 * Retrieves the max message width of each actor, supports signals (messages, loops)
 * and notes.
 *
 * It will enumerate each given message, and will determine its text width, in relation
 * to the actor it originates from, and destined to.
 *
 * @param actors - The actors map
 * @param messages - A list of message objects to iterate
 */
const getMaxMessageWidthPerActor = function(actors, messages) {
  const maxMessageWidthPerActor = {};

  messages.forEach(function(msg) {
    if (actors[msg.to] && actors[msg.from]) {
      const actor = actors[msg.to];

      // If this is the first actor, and the message is left of it, no need to calculate the margin
      if (msg.placement == parser.yy.PLACEMENT.LEFTOF && !actor.prevActor) {
        return;
      }

      // If this is the last actor, and the message is right of it, no need to calculate the margin
      if (msg.placement == parser.yy.PLACEMENT.RIGHTOF && !actor.nextActor) {
        return;
      }

      const isNote = msg.placement !== undefined;
      const isMessage = !isNote;

      const fontSize = isNote ? conf.noteFontSize : conf.messageFontSize;
      const fontFamily = isNote ? conf.noteFontFamily : conf.messageFontFamily;
      const messageWidth = calculateTextWidth(msg.message, fontSize, fontFamily);

      /*
       * The following scenarios should be supported:
       *
       * - There's a message (non-note) between fromActor and toActor
       *   - If fromActor is on the right and toActor is on the left, we should
       *     define the toActor's margin
       *   - If fromActor is on the left and toActor is on the right, we should
       *     define the fromActor's margin
       * - There's a note, in which case fromActor == toActor
       *   - If the note is to the left of the actor, we should define the previous actor
       *     margin
       *   - If the note is on the actor, we should define both the previous and next actor
       *     margins, each being the half of the note size
       *   - If the note is on the right of the actor, we should define the current actor
       *     margin
       */
      if (isMessage && msg.from == actor.nextActor) {
        maxMessageWidthPerActor[msg.to] = Math.max(
          maxMessageWidthPerActor[msg.to] || 0,
          messageWidth
        );
      } else if (
        (isMessage && msg.from == actor.prevActor) ||
        msg.placement == parser.yy.PLACEMENT.RIGHTOF
      ) {
        maxMessageWidthPerActor[msg.from] = Math.max(
          maxMessageWidthPerActor[msg.from] || 0,
          messageWidth
        );
      } else if (msg.placement == parser.yy.PLACEMENT.LEFTOF) {
        maxMessageWidthPerActor[actor.prevActor] = Math.max(
          maxMessageWidthPerActor[actor.prevActor] || 0,
          messageWidth
        );
      } else if (msg.placement == parser.yy.PLACEMENT.OVER) {
        if (actor.prevActor) {
          maxMessageWidthPerActor[actor.prevActor] = Math.max(
            maxMessageWidthPerActor[actor.prevActor] || 0,
            messageWidth / 2
          );
        }

        if (actor.nextActor) {
          maxMessageWidthPerActor[msg.from] = Math.max(
            maxMessageWidthPerActor[msg.from] || 0,
            messageWidth / 2
          );
        }
      }
    }
  });

  return maxMessageWidthPerActor;
};

/**
 * This will calculate the optimal margin for each given actor, for a given
 * actor->messageWidth map.
 *
 * An actor's margin is determined by the width of the actor, the width of the
 * largest message that originates from it, and the configured conf.actorMargin.
 *
 * @param actors - The actors map to calculate margins for
 * @param actorToMessageWidth - A map of actor key -> max message width it holds
 */
const calculateActorMargins = function(actors, actorToMessageWidth) {
  for (let actorKey in actorToMessageWidth) {
    const actor = actors[actorKey];

    if (!actor) {
      continue;
    }

    const nextActor = actors[actor.nextActor];

    // No need to space out an actor that doesn't have a next link
    if (!nextActor) {
      continue;
    }

    actor.width = Math.max(
      conf.width,
      calculateTextWidth(actor.description, conf.actorFontSize, conf.actorFontFamily)
    );

    nextActor.width = Math.max(
      conf.width,
      calculateTextWidth(nextActor.description, conf.actorFontSize, conf.actorFontFamily)
    );

    const messageWidth = actorToMessageWidth[actorKey];
    const actorWidth = messageWidth + conf.actorMargin - actor.width / 2 - nextActor.width / 2;

    actor.margin = Math.max(actorWidth, conf.actorMargin);
  }
};

export default {
  bounds,
  drawActors,
  setConf,
  draw
};
