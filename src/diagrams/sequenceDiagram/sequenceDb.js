/**
 * Created by knut on 14-11-19.
 */
var actors = {}
var messages = []
var notes = []
var title = ''
var Logger = require('../../logger')
var log = Logger.Log

module.exports.addActor = function (id, name, description) {
  // Don't allow description nulling
  var old = actors[id]
  if (old && name === old.name && description == null) return

  // Don't allow null descriptions, either
  if (description == null) description = name

  actors[id] = { name: name, description: description }
}

module.exports.addMessage = function (idFrom, idTo, message, answer) {
  messages.push({ from: idFrom, to: idTo, message: message, answer: answer })
}

module.exports.addSignal = function (idFrom, idTo, message, messageType) {
  log.debug('Adding message from=' + idFrom + ' to=' + idTo + ' message=' + message + ' type=' + messageType)
  messages.push({ from: idFrom, to: idTo, message: message, type: messageType })
}

module.exports.getMessages = function () {
  return messages
}

module.exports.getActors = function () {
  return actors
}
module.exports.getActor = function (id) {
  return actors[id]
}
module.exports.getActorKeys = function () {
  return Object.keys(actors)
}
module.exports.getTitle = function () {
  return title
}

module.exports.clear = function () {
  actors = {}
  messages = []
}

module.exports.LINETYPE = {
  SOLID: 0,
  DOTTED: 1,
  NOTE: 2,
  SOLID_CROSS: 3,
  DOTTED_CROSS: 4,
  SOLID_OPEN: 5,
  DOTTED_OPEN: 6,
  LOOP_START: 10,
  LOOP_END: 11,
  ALT_START: 12,
  ALT_ELSE: 13,
  ALT_END: 14,
  OPT_START: 15,
  OPT_END: 16,
  ACTIVE_START: 17,
  ACTIVE_END: 18,
  PAR_START: 19,
  PAR_AND: 20,
  PAR_END: 21
}

module.exports.ARROWTYPE = {
  FILLED: 0,
  OPEN: 1
}

module.exports.PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2
}

module.exports.addNote = function (actor, placement, message) {
  var note = { actor: actor, placement: placement, message: message }

  // Coerce actor into a [to, from, ...] array
  var actors = [].concat(actor, actor)

  notes.push(note)
  messages.push({ from: actors[0], to: actors[1], message: message, type: module.exports.LINETYPE.NOTE, placement: placement })
}

module.exports.setTitle = function (titleText) {
  title = titleText
}

module.exports.parseError = function (err, hash) {
  global.mermaidAPI.parseError(err, hash)
}

module.exports.apply = function (param) {
  if (param instanceof Array) {
    param.forEach(function (item) {
      module.exports.apply(item)
    })
  } else {
    switch (param.type) {
      case 'addActor':
        module.exports.addActor(param.actor, param.actor, param.description)
        break
      case 'activeStart':
        module.exports.addSignal(param.actor, undefined, undefined, param.signalType)
        break
      case 'activeEnd':
        module.exports.addSignal(param.actor, undefined, undefined, param.signalType)
        break
      case 'addNote':
        module.exports.addNote(param.actor, param.placement, param.text)
        break
      case 'addMessage':
        module.exports.addSignal(param.from, param.to, param.msg, param.signalType)
        break
      case 'loopStart':
        module.exports.addSignal(undefined, undefined, param.loopText, param.signalType)
        break
      case 'loopEnd':
        module.exports.addSignal(undefined, undefined, undefined, param.signalType)
        break
      case 'optStart':
        module.exports.addSignal(undefined, undefined, param.optText, param.signalType)
        break
      case 'optEnd':
        module.exports.addSignal(undefined, undefined, undefined, param.signalType)
        break
      case 'altStart':
        module.exports.addSignal(undefined, undefined, param.altText, param.signalType)
        break
      case 'else':
        module.exports.addSignal(undefined, undefined, param.altText, param.signalType)
        break
      case 'altEnd':
        module.exports.addSignal(undefined, undefined, undefined, param.signalType)
        break
      case 'setTitle':
        module.exports.setTitle(param.text)
        break
      case 'parStart':
        module.exports.addSignal(undefined, undefined, param.parText, param.signalType)
        break
      case 'and':
        module.exports.addSignal(undefined, undefined, param.parText, param.signalType)
        break
      case 'parEnd':
        module.exports.addSignal(undefined, undefined, undefined, param.signalType)
        break
    }
  }
}
