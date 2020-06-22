import { select, selectAll } from 'd3';
import svgDraw, { drawText } from './svgDraw';
import { logger } from '../../logger';
import { parser } from './parser/sequenceDiagram';
import common from '../common/common';
import sequenceDb from './sequenceDb';
import utils, { assignWithDepth } from '../../utils';

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
  // 400 = normal
  actorFontWeight: 400,
  // Note font settings
  noteFontSize: 14,
  noteFontFamily: '"trebuchet ms", verdana, arial',
  noteFontWeight: 400,
  noteAlign: 'center',
  // Message font settings
  messageFontSize: 16,
  messageFontFamily: '"trebuchet ms", verdana, arial',
  messageFontWeight: 400,
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
  labelBoxWidth: 50,
  labelBoxHeight: 20,

  // text placement as: tspan | fo | old only text as before
  textPlacement: 'tspan',

  showSequenceNumbers: false,

  // wrap text
  wrapEnabled: false,
  // padding for wrapped text
  wrapPadding: 15,

  messageFont: () => {
    return {
      fontFamily: conf.messageFontFamily,
      fontSize: conf.messageFontSize,
      fontWeight: conf.messageFontWeight
    };
  },
  noteFont: () => {
    return {
      fontFamily: conf.noteFontFamily,
      fontSize: conf.noteFontSize,
      fontWeight: conf.noteFontWeight
    };
  },
  actorFont: () => {
    return {
      fontFamily: conf.actorFontFamily,
      fontSize: conf.actorFontSize,
      fontWeight: conf.actorFontWeight
    };
  }
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
  models: {
    loops: [],
    messages: [],
    notes: []
  },
  init: function() {
    this.sequenceItems = [];
    this.activations = [];
    this.models = {
      loops: [],
      messages: [],
      notes: []
    };
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
  newActivation: function(message, diagram, actors) {
    const actorRect = actors[message.from.actor];
    const stackedSize = actorActivations(message.from.actor).length;
    const x = actorRect.x + actorRect.width / 2 + ((stackedSize - 1) * conf.activationWidth) / 2;
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
    return this.activations.splice(lastActorActivationIdx, 1)[0];
  },
  createLoop: function(title = { message: undefined, wrap: false, width: undefined }, fill) {
    return {
      startx: undefined,
      starty: this.verticalPos,
      stopx: undefined,
      stopy: undefined,
      title: title.message,
      wrap: title.wrap,
      width: title.width,
      height: 0,
      fill: fill
    };
  },
  newLoop: function(title = { message: undefined, wrap: false, width: undefined }, fill) {
    this.sequenceItems.push(this.createLoop(title, fill));
  },
  endLoop: function() {
    return this.sequenceItems.pop();
  },
  addSectionToLoop: function(message) {
    const loop = this.sequenceItems.pop();
    loop.sections = loop.sections || [];
    loop.sectionTitles = loop.sectionTitles || [];
    loop.sections.push({ y: bounds.getVerticalPos(), height: 0 });
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

/**
 * Draws an note in the diagram with the attached line
 * @param elem - The diagram to draw to.
 * @param noteModel:{x: number, y: number, message: string, width: number} - startx: x axis start position, verticalPos: y axis position, messsage: the message to be shown, width: Set this with a custom width to override the default configured width.
 */
const drawNote = function(elem, noteModel) {
  const rect = svgDraw.getNoteRect();
  rect.x = noteModel.x;
  rect.y = noteModel.y;
  rect.width = noteModel.width || conf.width;
  rect.class = 'note';

  let g = elem.append('g');
  const rectElem = svgDraw.drawRect(g, rect);
  const textObj = svgDraw.getTextObj();
  textObj.x = noteModel.x;
  textObj.y = noteModel.y;
  textObj.width = rect.width;
  textObj.dy = '1em';
  textObj.text = noteModel.message;
  textObj.class = 'noteText';
  textObj.fontFamily = conf.noteFontFamily;
  textObj.fontSize = conf.noteFontSize;
  textObj.fontWeight = conf.noteFontWeight;
  textObj.anchor = conf.noteAlign;
  textObj.textMargin = conf.noteMargin;
  textObj.valign = conf.noteAlign;
  textObj.wrap = true;

  let textElem = drawText(g, textObj);

  let textHeight = Math.round(
    textElem.map(te => (te._groups || te)[0][0].getBBox().height).reduce((acc, curr) => acc + curr)
  );

  noteModel.height = textHeight + 2 * conf.noteMargin;

  bounds.insert(noteModel.x, noteModel.y, noteModel.x + rect.width, noteModel.y + noteModel.height);

  rectElem.attr('height', noteModel.height);
  bounds.bumpVerticalPos(noteModel.height);
};

/**
 * Draws a message
 * @param g - the parent of the message element
 * @param msgModel - the model containing fields describing a message
 */
const drawMessage = function(g, msgModel) {
  const { startx, stopx, starty: verticalPos, message, type, sequenceIndex, wrap } = msgModel;
  const textObj = svgDraw.getTextObj();
  textObj.x = startx;
  textObj.y = verticalPos - (conf.messageFontSize + 7);
  textObj.width = stopx - startx;
  textObj.class = 'messageText';
  textObj.dy = '1em';
  textObj.text = message;
  textObj.fontFamily = conf.messageFontFamily;
  textObj.fontSize = conf.messageFontSize;
  textObj.fontWeight = conf.messageFontWeight;
  textObj.anchor = conf.messageAlign;
  textObj.valign = conf.messageAlign;
  textObj.textMargin = conf.wrapPadding;
  textObj.tspan = false;
  textObj.wrap = wrap;

  let textElem = drawText(g, textObj);

  const lines = message.split(common.lineBreakRegex).length - 1 > 0 ? 1 : 0;

  let totalOffset = Math.round(
    textElem.map(te => (te._groups || te)[0][0].getBBox().height).reduce((acc, curr) => acc + curr)
  );

  let textWidth = Math.max.apply(
    null,
    textElem.map(te => (te._groups || te)[0][0].getBBox().width)
  );

  bounds.bumpVerticalPos(totalOffset - lines * conf.messageFontSize);

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

    bounds.bumpVerticalPos(30);
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
    type === parser.yy.LINETYPE.DOTTED ||
    type === parser.yy.LINETYPE.DOTTED_CROSS ||
    type === parser.yy.LINETYPE.DOTTED_OPEN
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
  if (type === parser.yy.LINETYPE.SOLID || type === parser.yy.LINETYPE.DOTTED) {
    line.attr('marker-end', 'url(' + url + '#arrowhead)');
  }

  if (type === parser.yy.LINETYPE.SOLID_CROSS || type === parser.yy.LINETYPE.DOTTED_CROSS) {
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
    actor.width = actor.width || conf.width;
    actor.height = Math.max(actor.height || conf.height, conf.height);
    actor.margin = actor.margin || conf.actorMargin;

    actor.x = prevWidth + prevMargin;
    actor.y = verticalPos;

    // Draw the box with the attached line
    svgDraw.drawActor(diagram, actor, conf);
    bounds.insert(actor.x, verticalPos, actor.x + actor.width, actor.height);

    prevWidth += actor.width;
    prevMargin += actor.margin;
  }

  // Add a margin between the actor boxes and the first arrow
  bounds.bumpVerticalPos(conf.height);
};

export const setConf = function(cnf) {
  assignWithDepth(conf, cnf);

  if (cnf.fontFamily) {
    conf.actorFontFamily = conf.noteFontFamily = conf.messageFontFamily = cnf.fontFamily;
  }
  if (cnf.fontSize) {
    conf.actorFontSize = conf.noteFontSize = conf.messageFontSize = cnf.fontSize;
  }
  if (cnf.fontWeight) {
    conf.actorFontWeight = conf.noteFontWeight = conf.messageFontWeight = cnf.fontWeight;
  }
};

const actorActivations = function(actor) {
  return bounds.activations.filter(function(activation) {
    return activation.actor === actor;
  });
};

const actorFlowVerticaBounds = function(actor, actors) {
  // handle multiple stacked activations for same actor
  const actorObj = actors[actor];
  const activations = actorActivations(actor);

  const left = activations.reduce(function(acc, activation) {
    return Math.min(acc, activation.startx);
  }, actorObj.x + actorObj.width / 2);
  const right = activations.reduce(function(acc, activation) {
    return Math.max(acc, activation.stopx);
  }, actorObj.x + actorObj.width / 2);
  return [left, right];
};

function adjustLoopHeightForWrap(loopWidths, msg, preMargin, postMargin, addLoopFn) {
  bounds.bumpVerticalPos(preMargin);
  let heightAdjust = postMargin;
  if (msg.id && msg.message && loopWidths[msg.id]) {
    let loopWidth = loopWidths[msg.id].width;
    let textConf = conf.messageFont();
    msg.message = utils.wrapLabel(`[${msg.message}]`, loopWidth - 2 * conf.wrapPadding, textConf);
    msg.width = loopWidth;

    const textHeight = utils.calculateTextHeight(msg.message, textConf);
    heightAdjust += textHeight;
  }
  addLoopFn(msg);
  bounds.bumpVerticalPos(heightAdjust);
}

/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  parser.yy.clear();
  parser.yy.setWrap(conf.wrapEnabled);
  parser.parse(text + '\n');

  bounds.init();
  const diagram = select(`[id="${id}"]`);

  // Fetch data from the parsing
  const actors = parser.yy.getActors();
  const actorKeys = parser.yy.getActorKeys();
  const messages = parser.yy.getMessages();
  const title = parser.yy.getTitle();

  const maxMessageWidthPerActor = getMaxMessageWidthPerActor(actors, messages);
  conf.height = calculateActorMargins(actors, maxMessageWidthPerActor);

  drawActors(diagram, actors, actorKeys, 0);
  const loopWidths = calculateLoopBounds(messages, actors, maxMessageWidthPerActor);

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
    let loopModel, noteModel, msgModel;

    switch (msg.type) {
      case parser.yy.LINETYPE.NOTE:
        bounds.bumpVerticalPos(conf.boxMargin);
        noteModel = msg.noteModel;
        noteModel.y = bounds.getVerticalPos();
        drawNote(diagram, noteModel);
        bounds.models.notes.push(noteModel);
        break;
      case parser.yy.LINETYPE.ACTIVE_START:
        bounds.newActivation(msg, diagram, actors);
        break;
      case parser.yy.LINETYPE.ACTIVE_END:
        activeEnd(msg, bounds.getVerticalPos());
        break;
      case parser.yy.LINETYPE.LOOP_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          message => bounds.newLoop(message)
        );
        break;
      case parser.yy.LINETYPE.LOOP_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'loop', conf);
        bounds.models.loops.push(loopModel);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        break;
      case parser.yy.LINETYPE.RECT_START:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin, conf.boxMargin, message =>
          bounds.newLoop(undefined, message.message)
        );
        break;
      case parser.yy.LINETYPE.RECT_END:
        loopModel = bounds.endLoop();
        svgDraw.drawBackgroundRect(diagram, loopModel);
        bounds.models.loops.push(loopModel);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        break;
      case parser.yy.LINETYPE.OPT_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          message => bounds.newLoop(message)
        );
        break;
      case parser.yy.LINETYPE.OPT_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'opt', conf);
        bounds.models.loops.push(loopModel);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        break;
      case parser.yy.LINETYPE.ALT_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          message => bounds.newLoop(message)
        );
        break;
      case parser.yy.LINETYPE.ALT_ELSE:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin + conf.boxTextMargin,
          conf.boxMargin,
          message => bounds.addSectionToLoop(message)
        );
        break;
      case parser.yy.LINETYPE.ALT_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'alt', conf);
        bounds.models.loops.push(loopModel);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        break;
      case parser.yy.LINETYPE.PAR_START:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin,
          conf.boxMargin + conf.boxTextMargin,
          message => bounds.newLoop(message)
        );
        break;
      case parser.yy.LINETYPE.PAR_AND:
        adjustLoopHeightForWrap(
          loopWidths,
          msg,
          conf.boxMargin + conf.boxTextMargin,
          conf.boxMargin,
          message => bounds.addSectionToLoop(message)
        );
        break;
      case parser.yy.LINETYPE.PAR_END:
        loopModel = bounds.endLoop();
        svgDraw.drawLoop(diagram, loopModel, 'par', conf);
        bounds.models.loops.push(loopModel);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        break;
      default:
        try {
          // lastMsg = msg
          bounds.bumpVerticalPos(conf.messageMargin);
          msgModel = msg.msgModel;
          msgModel.starty = bounds.getVerticalPos();
          msgModel.sequenceIndex = sequenceIndex;
          drawMessage(diagram, msgModel);
          bounds.models.messages.push(msgModel);
          bounds.insert(msgModel.fromBounds, msgModel.starty, msgModel.toBounds, msgModel.starty);
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
    // diagram.attr('style', 'max-width:100%;');
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
  logger.debug('bounds', bounds);
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
      if (msg.placement === parser.yy.PLACEMENT.LEFTOF && !actor.prevActor) {
        return;
      }

      // If this is the last actor, and the message is right of it, no need to calculate the margin
      if (msg.placement === parser.yy.PLACEMENT.RIGHTOF && !actor.nextActor) {
        return;
      }

      const isNote = msg.placement !== undefined;
      const isMessage = !isNote;

      const textFont = isNote ? conf.noteFont() : conf.messageFont();
      let wrappedMessage = msg.wrap
        ? utils.wrapLabel(msg.message, conf.width - 2 * conf.wrapPadding, textFont)
        : msg.message;
      const messageDimensions = utils.calculateTextDimensions(wrappedMessage, textFont);
      const messageWidth = messageDimensions.width + 2 * conf.wrapPadding;

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
      if (isMessage && msg.from === actor.nextActor) {
        maxMessageWidthPerActor[msg.to] = Math.max(
          maxMessageWidthPerActor[msg.to] || 0,
          messageWidth
        );
      } else if (msg.placement === parser.yy.PLACEMENT.RIGHTOF) {
        maxMessageWidthPerActor[msg.from] = Math.max(
          maxMessageWidthPerActor[msg.from] || 0,
          messageWidth
        );
      } else if (msg.placement === parser.yy.PLACEMENT.LEFTOF) {
        maxMessageWidthPerActor[actor.prevActor] = Math.max(
          maxMessageWidthPerActor[actor.prevActor] || 0,
          messageWidth
        );
      } else if (msg.placement === parser.yy.PLACEMENT.OVER) {
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

  logger.debug('maxMessageWidthPerActor:', maxMessageWidthPerActor);
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
  let maxHeight = 0;
  Object.keys(actors).forEach(prop => {
    const actor = actors[prop];
    if (actor.wrap) {
      actor.description = utils.wrapLabel(
        actor.description,
        conf.width - 2 * conf.wrapPadding,
        conf.actorFont()
      );
    }
    const actDims = utils.calculateTextDimensions(actor.description, conf.actorFont());
    actor.width = actor.wrap
      ? conf.width
      : Math.max(conf.width, actDims.width + 2 * conf.wrapPadding);

    actor.height = actor.wrap ? Math.max(actDims.height, conf.height) : conf.height;
    maxHeight = Math.max(maxHeight, actor.height);
  });

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

    const messageWidth = actorToMessageWidth[actorKey];
    const actorWidth = messageWidth + conf.actorMargin - actor.width / 2 - nextActor.width / 2;

    actor.margin = Math.max(actorWidth, conf.actorMargin);
  }

  return Math.max(maxHeight, conf.height);
};

const buildNoteModel = function(msg, actors) {
  let startx = actors[msg.from].x;
  let stopx = actors[msg.to].x;
  let shouldWrap = msg.wrap && msg.message && !common.lineBreakRegex.test(msg.message);

  let textDimensions = utils.calculateTextDimensions(
    shouldWrap ? utils.wrapLabel(msg.message, conf.width, conf.noteFont()) : msg.message,
    conf.noteFont()
  );
  let noteModel = {
    width: shouldWrap
      ? conf.width
      : Math.max(conf.width, textDimensions.width + 2 * conf.noteMargin),
    height: 0,
    x: actors[msg.from].x,
    y: 0,
    message: msg.message
  };
  if (msg.placement === parser.yy.PLACEMENT.RIGHTOF) {
    noteModel.width = shouldWrap
      ? Math.max(conf.width, textDimensions.width)
      : Math.max(
          actors[msg.from].width / 2 + actors[msg.to].width / 2,
          textDimensions.width + 2 * conf.noteMargin
        );
    noteModel.x = startx + (actors[msg.from].width + conf.actorMargin) / 2;
  } else if (msg.placement === parser.yy.PLACEMENT.LEFTOF) {
    noteModel.width = shouldWrap
      ? Math.max(conf.width, textDimensions.width + 2 * conf.noteMargin)
      : Math.max(
          actors[msg.from].width / 2 + actors[msg.to].width / 2,
          textDimensions.width + 2 * conf.noteMargin
        );
    noteModel.x = startx - noteModel.width + (actors[msg.from].width - conf.actorMargin) / 2;
  } else if (msg.to === msg.from) {
    textDimensions = utils.calculateTextDimensions(
      shouldWrap
        ? utils.wrapLabel(msg.message, Math.max(conf.width, actors[msg.to].width), conf.noteFont())
        : msg.message,
      conf.noteFont()
    );
    noteModel.width = shouldWrap
      ? Math.max(conf.width, actors[msg.to].width)
      : Math.max(actors[msg.to].width, conf.width, textDimensions.width + 2 * conf.noteMargin);
    noteModel.x = startx + (actors[msg.to].width - noteModel.width) / 2;
  } else {
    noteModel.width =
      Math.abs(startx + actors[msg.from].width / 2 - (stopx + actors[msg.to].width / 2)) +
      conf.actorMargin;
    noteModel.x =
      startx < stopx
        ? startx + actors[msg.from].width / 2 - conf.actorMargin / 2
        : stopx + actors[msg.to].width / 2 - conf.actorMargin / 2;
  }
  if (shouldWrap) {
    noteModel.message = utils.wrapLabel(
      msg.message,
      noteModel.width - 2 * conf.wrapPadding,
      conf.noteFont()
    );
  }
  return noteModel;
};

const buildMessageModel = function(msg, actors) {
  let process = false;
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
    process = true;
  }
  if (!process) {
    return {};
  }
  const fromBounds = actorFlowVerticaBounds(msg.from, actors);
  const toBounds = actorFlowVerticaBounds(msg.to, actors);
  const fromIdx = fromBounds[0] <= toBounds[0] ? 1 : 0;
  const toIdx = fromBounds[0] < toBounds[0] ? 0 : 1;
  const allBounds = fromBounds.concat(toBounds);
  const msgModel = {
    width: Math.abs(toBounds[toIdx] - fromBounds[fromIdx]),
    height: 0,
    startx: fromBounds[fromIdx],
    stopx: toBounds[toIdx],
    starty: 0,
    stopy: 0,
    message: msg.message,
    type: msg.type,
    wrap: msg.wrap,
    fromBounds: Math.min.apply(null, allBounds),
    toBounds: Math.max.apply(null, allBounds)
  };
  if (msg.wrap && msg.message && !common.lineBreakRegex.test(msg.message)) {
    msgModel.message = utils.wrapLabel(
      msg.message,
      Math.max(msgModel.width, conf.width),
      conf.messageFont()
    );
  }
  return msgModel;
};

const calculateLoopBounds = function(messages, actors) {
  const loops = {};
  const stack = [];
  let current, noteModel, msgModel;

  messages.forEach(function(msg) {
    msg.id = utils.generateId();
    switch (msg.type) {
      case parser.yy.LINETYPE.LOOP_START:
      case parser.yy.LINETYPE.ALT_START:
      case parser.yy.LINETYPE.OPT_START:
      case parser.yy.LINETYPE.PAR_START:
        stack.push({
          id: msg.id,
          msg: msg.message,
          from: Number.MAX_SAFE_INTEGER,
          to: Number.MIN_SAFE_INTEGER,
          width: 0
        });
        break;
      case parser.yy.LINETYPE.ALT_ELSE:
      case parser.yy.LINETYPE.PAR_AND:
        if (msg.message) {
          current = stack.pop();
          loops[current.id] = current;
          loops[msg.id] = current;
          stack.push(current);
        }
        break;
      case parser.yy.LINETYPE.LOOP_END:
      case parser.yy.LINETYPE.ALT_END:
      case parser.yy.LINETYPE.OPT_END:
      case parser.yy.LINETYPE.PAR_END:
        current = stack.pop();
        loops[current.id] = current;
        break;
      case parser.yy.LINETYPE.ACTIVE_START:
        {
          const actorRect = actors[msg.from.actor];
          const stackedSize = actorActivations(msg.from.actor).length;
          const x =
            actorRect.x + actorRect.width / 2 + ((stackedSize - 1) * conf.activationWidth) / 2;
          const toAdd = {
            startx: x,
            stopx: x + conf.activationWidth,
            actor: msg.from.actor,
            enabled: true
          };
          bounds.activations.push(toAdd);
        }
        break;
      case parser.yy.LINETYPE.ACTIVE_END:
        {
          const lastActorActivationIdx = bounds.activations
            .map(a => a.actor)
            .lastIndexOf(msg.from.actor);
          delete bounds.activations.splice(lastActorActivationIdx, 1)[0];
        }
        break;
    }
    const isNote = msg.placement !== undefined;
    if (isNote) {
      noteModel = buildNoteModel(msg, actors);
      msg.noteModel = noteModel;
      let depth = 0;
      stack.forEach(stk => {
        current = stk;
        current.from = Math.min(current.from, noteModel.x);
        current.to = Math.max(current.to, noteModel.x + noteModel.width);
        current.width =
          Math.max(current.width, Math.abs(current.from - current.to)) -
          50 -
          conf.boxMargin * depth;
        depth++;
      });
    } else {
      msgModel = buildMessageModel(msg, actors);
      msg.msgModel = msgModel;
      if (msg.from && msg.to && stack.length > 0) {
        let depth = 0;
        stack.forEach(stk => {
          current = stk;
          let from = actors[msg.from];
          let to = actors[msg.to];
          if (from.x === to.x) {
            current.from = Math.min(current.from, from.x);
            current.to = Math.max(current.to, to.x);
            current.width = Math.max(current.width, from.width) - 50 - conf.boxMargin * depth;
          } else {
            if (from.x < to.x) {
              current.from = Math.min(current.from, from.x);
              current.to = Math.max(current.to, to.x);
            } else {
              current.from = Math.min(current.from, to.x);
              current.to = Math.max(current.to, from.x);
            }
            current.width =
              Math.max(current.width, Math.abs(current.from - current.to)) -
              50 -
              conf.boxMargin * depth;
          }
          depth++;
        });
      }
    }
  });
  bounds.activations = [];
  logger.debug('Loop type widths:', loops);
  return loops;
};

export default {
  bounds,
  drawActors,
  setConf,
  draw
};
