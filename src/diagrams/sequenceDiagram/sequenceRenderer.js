import svgDraw from './svgDraw'
import { logger } from '../../logger'
import d3 from '../../d3'
import { parser } from './parser/sequenceDiagram'
import sequenceDb from './sequenceDb'

parser.yy = sequenceDb

const conf = {

  diagramMarginX: 50,
  diagramMarginY: 30,
  // Margin between actors
  actorMargin: 50,
  // Width of actor boxes
  width: 150,
  // Height of actor boxes
  height: 65,
  // Margin around loop boxes
  boxMargin: 10,
  boxTextMargin: 5,
  noteMargin: 10,
  // Space between messages
  messageMargin: 35,
  // mirror actors under diagram
  mirrorActors: false,
  // Depending on css styling this might need adjustment
  // Prolongs the edge of the diagram downwards
  bottomMarginAdj: 1,

  // width of activation box
  activationWidth: 10,

  // text placement as: tspan | fo | old only text as before
  textPlacement: 'tspan'
}

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
  init: function () {
    this.sequenceItems = []
    this.activations = []
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined
    }
    this.verticalPos = 0
  },
  updateVal: function (obj, key, val, fun) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = val
    } else {
      obj[key] = fun(val, obj[key])
    }
  },
  updateBounds: function (startx, starty, stopx, stopy) {
    const _self = this
    let cnt = 0
    function updateFn (type) {
      return function updateItemBounds (item) {
        cnt++
        // The loop sequenceItems is a stack so the biggest margins in the beginning of the sequenceItems
        const n = _self.sequenceItems.length - cnt + 1

        _self.updateVal(item, 'starty', starty - n * conf.boxMargin, Math.min)
        _self.updateVal(item, 'stopy', stopy + n * conf.boxMargin, Math.max)

        _self.updateVal(bounds.data, 'startx', startx - n * conf.boxMargin, Math.min)
        _self.updateVal(bounds.data, 'stopx', stopx + n * conf.boxMargin, Math.max)

        if (!(type === 'activation')) {
          _self.updateVal(item, 'startx', startx - n * conf.boxMargin, Math.min)
          _self.updateVal(item, 'stopx', stopx + n * conf.boxMargin, Math.max)

          _self.updateVal(bounds.data, 'starty', starty - n * conf.boxMargin, Math.min)
          _self.updateVal(bounds.data, 'stopy', stopy + n * conf.boxMargin, Math.max)
        }
      }
    }

    this.sequenceItems.forEach(updateFn())
    this.activations.forEach(updateFn('activation'))
  },
  insert: function (startx, starty, stopx, stopy) {
    const _startx = Math.min(startx, stopx)
    const _stopx = Math.max(startx, stopx)
    const _starty = Math.min(starty, stopy)
    const _stopy = Math.max(starty, stopy)

    this.updateVal(bounds.data, 'startx', _startx, Math.min)
    this.updateVal(bounds.data, 'starty', _starty, Math.min)
    this.updateVal(bounds.data, 'stopx', _stopx, Math.max)
    this.updateVal(bounds.data, 'stopy', _stopy, Math.max)

    this.updateBounds(_startx, _starty, _stopx, _stopy)
  },
  newActivation: function (message, diagram) {
    const actorRect = parser.yy.getActors()[message.from.actor]
    const stackedSize = actorActivations(message.from.actor).length
    const x = actorRect.x + conf.width / 2 + (stackedSize - 1) * conf.activationWidth / 2
    this.activations.push({
      startx: x,
      starty: this.verticalPos + 2,
      stopx: x + conf.activationWidth,
      stopy: undefined,
      actor: message.from.actor,
      anchored: svgDraw.anchorElement(diagram)
    })
  },
  endActivation: function (message) {
    // find most recent activation for given actor
    const lastActorActivationIdx = this.activations
      .map(function (activation) { return activation.actor })
      .lastIndexOf(message.from.actor)
    const activation = this.activations.splice(lastActorActivationIdx, 1)[0]
    return activation
  },
  newLoop: function (title) {
    this.sequenceItems.push({ startx: undefined, starty: this.verticalPos, stopx: undefined, stopy: undefined, title: title })
  },
  endLoop: function () {
    const loop = this.sequenceItems.pop()
    return loop
  },
  addSectionToLoop: function (message) {
    const loop = this.sequenceItems.pop()
    loop.sections = loop.sections || []
    loop.sectionTitles = loop.sectionTitles || []
    loop.sections.push(bounds.getVerticalPos())
    loop.sectionTitles.push(message)
    this.sequenceItems.push(loop)
  },
  bumpVerticalPos: function (bump) {
    this.verticalPos = this.verticalPos + bump
    this.data.stopy = this.verticalPos
  },
  getVerticalPos: function () {
    return this.verticalPos
  },
  getBounds: function () {
    return this.data
  }
}

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */
const drawNote = function (elem, startx, verticalPos, msg, forceWidth) {
  const rect = svgDraw.getNoteRect()
  rect.x = startx
  rect.y = verticalPos
  rect.width = forceWidth || conf.width
  rect.class = 'note'

  let g = elem.append('g')
  const rectElem = svgDraw.drawRect(g, rect)

  const textObj = svgDraw.getTextObj()
  textObj.x = startx - 4
  textObj.y = verticalPos - 13
  textObj.textMargin = conf.noteMargin
  textObj.dy = '1em'
  textObj.text = msg.message
  textObj.class = 'noteText'

  let textElem = svgDraw.drawText(g, textObj, rect.width - conf.noteMargin)

  let textHeight = textElem[0][0].getBBox().height
  if (!forceWidth && textHeight > conf.width) {
    textElem.remove()
    g = elem.append('g')

    textElem = svgDraw.drawText(g, textObj, 2 * rect.width - conf.noteMargin)
    textHeight = textElem[0][0].getBBox().height
    rectElem.attr('width', 2 * rect.width)
    bounds.insert(startx, verticalPos, startx + 2 * rect.width, verticalPos + 2 * conf.noteMargin + textHeight)
  } else {
    bounds.insert(startx, verticalPos, startx + rect.width, verticalPos + 2 * conf.noteMargin + textHeight)
  }

  rectElem.attr('height', textHeight + 2 * conf.noteMargin)
  bounds.bumpVerticalPos(textHeight + 2 * conf.noteMargin)
}

/**
 * Draws a message
 * @param elem
 * @param startx
 * @param stopx
 * @param verticalPos
 * @param txtCenter
 * @param msg
 */
const drawMessage = function (elem, startx, stopx, verticalPos, msg) {
  const g = elem.append('g')
  const txtCenter = startx + (stopx - startx) / 2

  const textElem = g.append('text')      // text label for the x axis
    .attr('x', txtCenter)
    .attr('y', verticalPos - 7)
    .style('text-anchor', 'middle')
    .attr('class', 'messageText')
    .text(msg.message)

  let textWidth
  if (typeof textElem[0][0].getBBox !== 'undefined') {
    textWidth = textElem[0][0].getBBox().width
  } else {
    textWidth = textElem[0][0].getBoundingClientRect()
  }

  let line
  if (startx === stopx) {
    line = g.append('path')
      .attr('d', 'M ' + startx + ',' + verticalPos + ' C ' + (startx + 60) + ',' + (verticalPos - 10) + ' ' + (startx + 60) + ',' +
      (verticalPos + 30) + ' ' + startx + ',' + (verticalPos + 20))

    bounds.bumpVerticalPos(30)
    const dx = Math.max(textWidth / 2, 100)
    bounds.insert(startx - dx, bounds.getVerticalPos() - 10, stopx + dx, bounds.getVerticalPos())
  } else {
    line = g.append('line')
    line.attr('x1', startx)
    line.attr('y1', verticalPos)
    line.attr('x2', stopx)
    line.attr('y2', verticalPos)
    bounds.insert(startx, bounds.getVerticalPos() - 10, stopx, bounds.getVerticalPos())
  }
  // Make an SVG Container
  // Draw the line
  if (msg.type === parser.yy.LINETYPE.DOTTED || msg.type === parser.yy.LINETYPE.DOTTED_CROSS || msg.type === parser.yy.LINETYPE.DOTTED_OPEN) {
    line.style('stroke-dasharray', ('3, 3'))
    line.attr('class', 'messageLine1')
  } else {
    line.attr('class', 'messageLine0')
  }

  let url = ''
  if (conf.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search
    url = url.replace(/\(/g, '\\(')
    url = url.replace(/\)/g, '\\)')
  }

  line.attr('stroke-width', 2)
  line.attr('stroke', 'black')
  line.style('fill', 'none')     // remove any fill colour
  if (msg.type === parser.yy.LINETYPE.SOLID || msg.type === parser.yy.LINETYPE.DOTTED) {
    line.attr('marker-end', 'url(' + url + '#arrowhead)')
  }

  if (msg.type === parser.yy.LINETYPE.SOLID_CROSS || msg.type === parser.yy.LINETYPE.DOTTED_CROSS) {
    line.attr('marker-end', 'url(' + url + '#crosshead)')
  }
}

export const drawActors = function (diagram, actors, actorKeys, verticalPos) {
  // Draw the actors
  for (let i = 0; i < actorKeys.length; i++) {
    const key = actorKeys[i]

    // Add some rendering data to the object
    actors[key].x = i * conf.actorMargin + i * conf.width
    actors[key].y = verticalPos
    actors[key].width = conf.diagramMarginX
    actors[key].height = conf.diagramMarginY

    // Draw the box with the attached line
    svgDraw.drawActor(diagram, actors[key].x, verticalPos, actors[key].description, conf)
    bounds.insert(actors[key].x, verticalPos, actors[key].x + conf.width, conf.height)
  }

  // Add a margin between the actor boxes and the first arrow
  bounds.bumpVerticalPos(conf.height)
}

export const setConf = function (cnf) {
  const keys = Object.keys(cnf)

  keys.forEach(function (key) {
    conf[key] = cnf[key]
  })
}

const actorActivations = function (actor) {
  return bounds.activations.filter(function (activation) {
    return activation.actor === actor
  })
}

const actorFlowVerticaBounds = function (actor) {
  // handle multiple stacked activations for same actor
  const actors = parser.yy.getActors()
  const activations = actorActivations(actor)

  const left = activations.reduce(function (acc, activation) { return Math.min(acc, activation.startx) }, actors[actor].x + conf.width / 2)
  const right = activations.reduce(function (acc, activation) { return Math.max(acc, activation.stopx) }, actors[actor].x + conf.width / 2)
  return [left, right]
}

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function (text, id) {
  parser.yy.clear()
  parser.parse(text + '\n')

  bounds.init()
  const diagram = d3.select('#' + id)

  let startx
  let stopx
  let forceWidth

  // Fetch data from the parsing
  const actors = parser.yy.getActors()
  const actorKeys = parser.yy.getActorKeys()
  const messages = parser.yy.getMessages()
  const title = parser.yy.getTitle()
  drawActors(diagram, actors, actorKeys, 0)

  // The arrow head definition is attached to the svg once
  svgDraw.insertArrowHead(diagram)
  svgDraw.insertArrowCrossHead(diagram)

  function activeEnd (msg, verticalPos) {
    const activationData = bounds.endActivation(msg)
    if (activationData.starty + 18 > verticalPos) {
      activationData.starty = verticalPos - 6
      verticalPos += 12
    }
    svgDraw.drawActivation(diagram, activationData, verticalPos, conf)

    bounds.insert(activationData.startx, verticalPos - 10, activationData.stopx, verticalPos)
  }

  // const lastMsg

  // Draw the messages/signals
  messages.forEach(function (msg) {
    let loopData
    switch (msg.type) {
      case parser.yy.LINETYPE.NOTE:
        bounds.bumpVerticalPos(conf.boxMargin)

        startx = actors[msg.from].x
        stopx = actors[msg.to].x

        if (msg.placement === parser.yy.PLACEMENT.RIGHTOF) {
          drawNote(diagram, startx + (conf.width + conf.actorMargin) / 2, bounds.getVerticalPos(), msg)
        } else if (msg.placement === parser.yy.PLACEMENT.LEFTOF) {
          drawNote(diagram, startx - (conf.width + conf.actorMargin) / 2, bounds.getVerticalPos(), msg)
        } else if (msg.to === msg.from) {
          // Single-actor over
          drawNote(diagram, startx, bounds.getVerticalPos(), msg)
        } else {
          // Multi-actor over
          forceWidth = Math.abs(startx - stopx) + conf.actorMargin
          drawNote(diagram, (startx + stopx + conf.width - forceWidth) / 2, bounds.getVerticalPos(), msg,
            forceWidth)
        }
        break
      case parser.yy.LINETYPE.ACTIVE_START:
        bounds.newActivation(msg, diagram)
        break
      case parser.yy.LINETYPE.ACTIVE_END:
        activeEnd(msg, bounds.getVerticalPos())
        break
      case parser.yy.LINETYPE.LOOP_START:
        bounds.bumpVerticalPos(conf.boxMargin)
        bounds.newLoop(msg.message)
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin)
        break
      case parser.yy.LINETYPE.LOOP_END:
        loopData = bounds.endLoop()

        svgDraw.drawLoop(diagram, loopData, 'loop', conf)
        bounds.bumpVerticalPos(conf.boxMargin)
        break
      case parser.yy.LINETYPE.OPT_START:
        bounds.bumpVerticalPos(conf.boxMargin)
        bounds.newLoop(msg.message)
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin)
        break
      case parser.yy.LINETYPE.OPT_END:
        loopData = bounds.endLoop()

        svgDraw.drawLoop(diagram, loopData, 'opt', conf)
        bounds.bumpVerticalPos(conf.boxMargin)
        break
      case parser.yy.LINETYPE.ALT_START:
        bounds.bumpVerticalPos(conf.boxMargin)
        bounds.newLoop(msg.message)
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin)
        break
      case parser.yy.LINETYPE.ALT_ELSE:
        bounds.bumpVerticalPos(conf.boxMargin)
        loopData = bounds.addSectionToLoop(msg.message)
        bounds.bumpVerticalPos(conf.boxMargin)
        break
      case parser.yy.LINETYPE.ALT_END:
        loopData = bounds.endLoop()

        svgDraw.drawLoop(diagram, loopData, 'alt', conf)
        bounds.bumpVerticalPos(conf.boxMargin)
        break
      case parser.yy.LINETYPE.PAR_START:
        bounds.bumpVerticalPos(conf.boxMargin)
        bounds.newLoop(msg.message)
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin)
        break
      case parser.yy.LINETYPE.PAR_AND:
        bounds.bumpVerticalPos(conf.boxMargin)
        loopData = bounds.addSectionToLoop(msg.message)
        bounds.bumpVerticalPos(conf.boxMargin)
        break
      case parser.yy.LINETYPE.PAR_END:
        loopData = bounds.endLoop()
        svgDraw.drawLoop(diagram, loopData, 'par', conf)
        bounds.bumpVerticalPos(conf.boxMargin)
        break
      default:
        try {
          // lastMsg = msg
          bounds.bumpVerticalPos(conf.messageMargin)
          const fromBounds = actorFlowVerticaBounds(msg.from)
          const toBounds = actorFlowVerticaBounds(msg.to)
          const fromIdx = fromBounds[0] <= toBounds[0] ? 1 : 0
          const toIdx = fromBounds[0] < toBounds[0] ? 0 : 1
          startx = fromBounds[fromIdx]
          stopx = toBounds[toIdx]

          const verticalPos = bounds.getVerticalPos()
          drawMessage(diagram, startx, stopx, verticalPos, msg)
          const allBounds = fromBounds.concat(toBounds)
          bounds.insert(Math.min.apply(null, allBounds), verticalPos, Math.max.apply(null, allBounds), verticalPos)
        } catch (e) {
          console.error('error while drawing message', e)
        }
    }
  })

  if (conf.mirrorActors) {
    // Draw actors below diagram
    bounds.bumpVerticalPos(conf.boxMargin * 2)
    drawActors(diagram, actors, actorKeys, bounds.getVerticalPos())
  }

  const box = bounds.getBounds()

  // Adjust line height of actor lines now that the height of the diagram is known
  logger.debug('For line height fix Querying: #' + id + ' .actor-line')
  const actorLines = d3.selectAll('#' + id + ' .actor-line')
  actorLines.attr('y2', box.stopy)

  let height = box.stopy - box.starty + 2 * conf.diagramMarginY
  if (conf.mirrorActors) {
    height = height - conf.boxMargin + conf.bottomMarginAdj
  }

  const width = (box.stopx - box.startx) + (2 * conf.diagramMarginX)

  if (title) {
    diagram.append('text')
      .text(title)
      .attr('x', ((box.stopx - box.startx) / 2) - (2 * conf.diagramMarginX))
      .attr('y', -25)
  }

  if (conf.useMaxWidth) {
    diagram.attr('height', '100%')
    diagram.attr('width', '100%')
    diagram.attr('style', 'max-width:' + (width) + 'px;')
  } else {
    diagram.attr('height', height)
    diagram.attr('width', width)
  }
  const extraVertForTitle = title ? 40 : 0
  diagram.attr('viewBox', (box.startx - conf.diagramMarginX) + ' -' + (conf.diagramMarginY + extraVertForTitle) + ' ' + width + ' ' + (height + extraVertForTitle))
}

export default {
  bounds,
  drawActors,
  setConf,
  draw
}
