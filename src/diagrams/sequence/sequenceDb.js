import { logger } from '../../logger'

let actors = {}
let messages = []
const notes = []
let title = ''

export const addActor = function (id, name, description) {
  // Don't allow description nulling
  const old = actors[id]
  if (old && name === old.name && description == null) return

  // Don't allow null descriptions, either
  if (description == null) description = name

  actors[id] = { name: name, description: description }
}

export const addMessage = function (idFrom, idTo, message, answer) {
  messages.push({ from: idFrom, to: idTo, message: message, answer: answer })
}

export const addSignal = function (idFrom, idTo, message, messageType) {
  logger.debug('Adding message from=' + idFrom + ' to=' + idTo + ' message=' + message + ' type=' + messageType)
  messages.push({ from: idFrom, to: idTo, message: message, type: messageType })
}

export const getMessages = function () {
  return messages
}

export const getActors = function () {
  return actors
}
export const getActor = function (id) {
  return actors[id]
}
export const getActorKeys = function () {
  return Object.keys(actors)
}
export const getTitle = function () {
  return title
}

export const clear = function () {
  actors = {}
  messages = []
}

export const LINETYPE = {
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

export const ARROWTYPE = {
  FILLED: 0,
  OPEN: 1
}

export const PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2
}

export const addNote = function (actor, placement, message) {
  const note = { actor: actor, placement: placement, message: message }

  // Coerce actor into a [to, from, ...] array
  const actors = [].concat(actor, actor)

  notes.push(note)
  messages.push({ from: actors[0], to: actors[1], message: message, type: LINETYPE.NOTE, placement: placement })
}

export const setTitle = function (titleText) {
  title = titleText
}

export const apply = function (param) {
  if (param instanceof Array) {
    param.forEach(function (item) {
      apply(item)
    })
  } else {
    switch (param.type) {
      case 'addActor':
        addActor(param.actor, param.actor, param.description)
        break
      case 'activeStart':
        addSignal(param.actor, undefined, undefined, param.signalType)
        break
      case 'activeEnd':
        addSignal(param.actor, undefined, undefined, param.signalType)
        break
      case 'addNote':
        addNote(param.actor, param.placement, param.text)
        break
      case 'addMessage':
        addSignal(param.from, param.to, param.msg, param.signalType)
        break
      case 'loopStart':
        addSignal(undefined, undefined, param.loopText, param.signalType)
        break
      case 'loopEnd':
        addSignal(undefined, undefined, undefined, param.signalType)
        break
      case 'optStart':
        addSignal(undefined, undefined, param.optText, param.signalType)
        break
      case 'optEnd':
        addSignal(undefined, undefined, undefined, param.signalType)
        break
      case 'altStart':
        addSignal(undefined, undefined, param.altText, param.signalType)
        break
      case 'else':
        addSignal(undefined, undefined, param.altText, param.signalType)
        break
      case 'altEnd':
        addSignal(undefined, undefined, undefined, param.signalType)
        break
      case 'setTitle':
        setTitle(param.text)
        break
      case 'parStart':
        addSignal(undefined, undefined, param.parText, param.signalType)
        break
      case 'and':
        addSignal(undefined, undefined, param.parText, param.signalType)
        break
      case 'parEnd':
        addSignal(undefined, undefined, undefined, param.signalType)
        break
    }
  }
}

export default {
  addActor,
  addMessage,
  addSignal,
  getMessages,
  getActors,
  getActor,
  getActorKeys,
  getTitle,
  clear,
  LINETYPE,
  ARROWTYPE,
  PLACEMENT,
  addNote,
  setTitle,
  apply
}
