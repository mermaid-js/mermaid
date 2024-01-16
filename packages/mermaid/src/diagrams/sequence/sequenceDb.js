import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { sanitizeText } from '../common/common.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import { ImperativeState } from '../../utils/imperativeState.js';

const state = new ImperativeState(() => ({
  prevActor: undefined,
  actors: {},
  createdActors: {},
  destroyedActors: {},
  boxes: [],
  messages: [],
  notes: [],
  sequenceNumbersEnabled: false,
  wrapEnabled: undefined,
  currentBox: undefined,
  lastCreated: undefined,
  lastDestroyed: undefined,
}));

export const addBox = function (data) {
  state.records.boxes.push({
    name: data.text,
    wrap: (data.wrap === undefined && autoWrap()) || !!data.wrap,
    fill: data.color,
    actorKeys: [],
  });
  state.records.currentBox = state.records.boxes.slice(-1)[0];
};

export const addActor = function (id, name, description, type) {
  let assignedBox = state.records.currentBox;
  const old = state.records.actors[id];
  if (old) {
    // If already set and trying to set to a new one throw error
    if (state.records.currentBox && old.box && state.records.currentBox !== old.box) {
      throw new Error(
        'A same participant should only be defined in one Box: ' +
          old.name +
          " can't be in '" +
          old.box.name +
          "' and in '" +
          state.records.currentBox.name +
          "' at the same time."
      );
    }

    // Don't change the box if already
    assignedBox = old.box ? old.box : state.records.currentBox;
    old.box = assignedBox;

    // Don't allow description nulling
    if (old && name === old.name && description == null) {
      return;
    }
  }

  // Don't allow null descriptions, either
  if (description == null || description.text == null) {
    description = { text: name, wrap: null, type };
  }
  if (type == null || description.text == null) {
    description = { text: name, wrap: null, type };
  }

  state.records.actors[id] = {
    box: assignedBox,
    name: name,
    description: description.text,
    wrap: (description.wrap === undefined && autoWrap()) || !!description.wrap,
    prevActor: state.records.prevActor,
    links: {},
    properties: {},
    actorCnt: null,
    rectData: null,
    type: type || 'participant',
  };
  if (state.records.prevActor && state.records.actors[state.records.prevActor]) {
    state.records.actors[state.records.prevActor].nextActor = id;
  }

  if (state.records.currentBox) {
    state.records.currentBox.actorKeys.push(id);
  }
  state.records.prevActor = id;
};

const activationCount = (part) => {
  let i;
  let count = 0;
  for (i = 0; i < state.records.messages.length; i++) {
    if (
      state.records.messages[i].type === LINETYPE.ACTIVE_START &&
      state.records.messages[i].from.actor === part
    ) {
      count++;
    }
    if (
      state.records.messages[i].type === LINETYPE.ACTIVE_END &&
      state.records.messages[i].from.actor === part
    ) {
      count--;
    }
  }
  return count;
};

export const addMessage = function (idFrom, idTo, message, answer) {
  state.records.messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: (message.wrap === undefined && autoWrap()) || !!message.wrap,
    answer: answer,
  });
};

export const addSignal = function (
  idFrom,
  idTo,
  message = { text: undefined, wrap: undefined },
  messageType,
  activate = false
) {
  if (messageType === LINETYPE.ACTIVE_END) {
    const cnt = activationCount(idFrom.actor);
    if (cnt < 1) {
      // Bail out as there is an activation signal from an inactive participant
      let error = new Error('Trying to inactivate an inactive participant (' + idFrom.actor + ')');
      error.hash = {
        text: '->>-',
        token: '->>-',
        line: '1',
        loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
        expected: ["'ACTIVE_PARTICIPANT'"],
      };
      throw error;
    }
  }
  state.records.messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: (message.wrap === undefined && autoWrap()) || !!message.wrap,
    type: messageType,
    activate,
  });
  return true;
};

export const hasAtLeastOneBox = function () {
  return state.records.boxes.length > 0;
};

export const hasAtLeastOneBoxWithTitle = function () {
  return state.records.boxes.some((b) => b.name);
};

export const getMessages = function () {
  return state.records.messages;
};

export const getBoxes = function () {
  return state.records.boxes;
};
export const getActors = function () {
  return state.records.actors;
};
export const getCreatedActors = function () {
  return state.records.createdActors;
};
export const getDestroyedActors = function () {
  return state.records.destroyedActors;
};
export const getActor = function (id) {
  return state.records.actors[id];
};
export const getActorKeys = function () {
  return Object.keys(state.records.actors);
};
export const enableSequenceNumbers = function () {
  state.records.sequenceNumbersEnabled = true;
};
export const disableSequenceNumbers = function () {
  state.records.sequenceNumbersEnabled = false;
};
export const showSequenceNumbers = () => state.records.sequenceNumbersEnabled;

export const setWrap = function (wrapSetting) {
  state.records.wrapEnabled = wrapSetting;
};

export const autoWrap = () => {
  // if setWrap has been called, use that value, otherwise use the value from the config
  // TODO: refactor, always use the config value let setWrap update the config value
  if (state.records.wrapEnabled !== undefined) {
    return state.records.wrapEnabled;
  }
  return getConfig().sequence.wrap;
};

export const clear = function () {
  state.reset();
  commonClear();
};

export const parseMessage = function (str) {
  const _str = str.trim();
  const message = {
    text: _str.replace(/^:?(?:no)?wrap:/, '').trim(),
    wrap:
      _str.match(/^:?wrap:/) !== null
        ? true
        : _str.match(/^:?nowrap:/) !== null
        ? false
        : undefined,
  };
  log.debug('parseMessage:', message);
  return message;
};

// We expect the box statement to be color first then description
// The color can be rgb,rgba,hsl,hsla, or css code names  #hex codes are not supported for now because of the way the char # is handled
// We extract first segment as color, the rest of the line is considered as text
export const parseBoxData = function (str) {
  const match = str.match(/^((?:rgba?|hsla?)\s*\(.*\)|\w*)(.*)$/);
  let color = match != null && match[1] ? match[1].trim() : 'transparent';
  let title = match != null && match[2] ? match[2].trim() : undefined;

  // check that the string is a color
  if (window && window.CSS) {
    if (!window.CSS.supports('color', color)) {
      color = 'transparent';
      title = str.trim();
    }
  } else {
    const style = new Option().style;
    style.color = color;
    if (style.color !== color) {
      color = 'transparent';
      title = str.trim();
    }
  }

  return {
    color: color,
    text:
      title !== undefined
        ? sanitizeText(title.replace(/^:?(?:no)?wrap:/, ''), getConfig())
        : undefined,
    wrap:
      title !== undefined
        ? title.match(/^:?wrap:/) !== null
          ? true
          : title.match(/^:?nowrap:/) !== null
          ? false
          : undefined
        : undefined,
  };
};

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
  PAR_END: 21,
  RECT_START: 22,
  RECT_END: 23,
  SOLID_POINT: 24,
  DOTTED_POINT: 25,
  AUTONUMBER: 26,
  CRITICAL_START: 27,
  CRITICAL_OPTION: 28,
  CRITICAL_END: 29,
  BREAK_START: 30,
  BREAK_END: 31,
  PAR_OVER_START: 32,
};

export const ARROWTYPE = {
  FILLED: 0,
  OPEN: 1,
};

export const PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2,
};

export const addNote = function (actor, placement, message) {
  const note = {
    actor: actor,
    placement: placement,
    message: message.text,
    wrap: (message.wrap === undefined && autoWrap()) || !!message.wrap,
  };

  // Coerce actor into a [to, from, ...] array
  // eslint-disable-next-line unicorn/prefer-spread
  const actors = [].concat(actor, actor);

  state.records.notes.push(note);
  state.records.messages.push({
    from: actors[0],
    to: actors[1],
    message: message.text,
    wrap: (message.wrap === undefined && autoWrap()) || !!message.wrap,
    type: LINETYPE.NOTE,
    placement: placement,
  });
};

export const addLinks = function (actorId, text) {
  // find the actor
  const actor = getActor(actorId);
  // JSON.parse the text
  try {
    let sanitizedText = sanitizeText(text.text, getConfig());
    sanitizedText = sanitizedText.replace(/&amp;/g, '&');
    sanitizedText = sanitizedText.replace(/&equals;/g, '=');
    const links = JSON.parse(sanitizedText);
    // add the deserialized text to the actor's links field.
    insertLinks(actor, links);
  } catch (e) {
    log.error('error while parsing actor link text', e);
  }
};

export const addALink = function (actorId, text) {
  // find the actor
  const actor = getActor(actorId);
  try {
    const links = {};
    let sanitizedText = sanitizeText(text.text, getConfig());
    var sep = sanitizedText.indexOf('@');
    sanitizedText = sanitizedText.replace(/&amp;/g, '&');
    sanitizedText = sanitizedText.replace(/&equals;/g, '=');
    var label = sanitizedText.slice(0, sep - 1).trim();
    var link = sanitizedText.slice(sep + 1).trim();

    links[label] = link;
    // add the deserialized text to the actor's links field.
    insertLinks(actor, links);
  } catch (e) {
    log.error('error while parsing actor link text', e);
  }
};

/**
 * @param {any} actor
 * @param {any} links
 */
function insertLinks(actor, links) {
  if (actor.links == null) {
    actor.links = links;
  } else {
    for (let key in links) {
      actor.links[key] = links[key];
    }
  }
}

export const addProperties = function (actorId, text) {
  // find the actor
  const actor = getActor(actorId);
  // JSON.parse the text
  try {
    let sanitizedText = sanitizeText(text.text, getConfig());
    const properties = JSON.parse(sanitizedText);
    // add the deserialized text to the actor's property field.
    insertProperties(actor, properties);
  } catch (e) {
    log.error('error while parsing actor properties text', e);
  }
};

/**
 * @param {any} actor
 * @param {any} properties
 */
function insertProperties(actor, properties) {
  if (actor.properties == null) {
    actor.properties = properties;
  } else {
    for (let key in properties) {
      actor.properties[key] = properties[key];
    }
  }
}

/**
 *
 */
function boxEnd() {
  state.records.currentBox = undefined;
}

export const addDetails = function (actorId, text) {
  // find the actor
  const actor = getActor(actorId);
  const elem = document.getElementById(text.text);

  // JSON.parse the text
  try {
    const text = elem.innerHTML;
    const details = JSON.parse(text);
    // add the deserialized text to the actor's property field.
    if (details['properties']) {
      insertProperties(actor, details['properties']);
    }

    if (details['links']) {
      insertLinks(actor, details['links']);
    }
  } catch (e) {
    log.error('error while parsing actor details text', e);
  }
};

export const getActorProperty = function (actor, key) {
  if (actor !== undefined && actor.properties !== undefined) {
    return actor.properties[key];
  }

  return undefined;
};

/**
 * @typedef {object} AddMessageParams A message from one actor to another.
 * @property {string} from - The id of the actor sending the message.
 * @property {string} to - The id of the actor receiving the message.
 * @property {string} msg - The message text.
 * @property {number} signalType - The type of signal.
 * @property {"addMessage"} type - Set to `"addMessage"` if this is an `AddMessageParams`.
 * @property {boolean} [activate] - If `true`, this signal starts an activation.
 */

/**
 * @param {object | object[] | AddMessageParams} param - Object of parameters.
 */
export const apply = function (param) {
  if (Array.isArray(param)) {
    param.forEach(function (item) {
      apply(item);
    });
  } else {
    switch (param.type) {
      case 'sequenceIndex':
        state.records.messages.push({
          from: undefined,
          to: undefined,
          message: {
            start: param.sequenceIndex,
            step: param.sequenceIndexStep,
            visible: param.sequenceVisible,
          },
          wrap: false,
          type: param.signalType,
        });
        break;
      case 'addParticipant':
        addActor(param.actor, param.actor, param.description, param.draw);
        break;
      case 'createParticipant':
        if (state.records.actors[param.actor]) {
          throw new Error(
            "It is not possible to have actors with the same id, even if one is destroyed before the next is created. Use 'AS' aliases to simulate the behavior"
          );
        }
        state.records.lastCreated = param.actor;
        addActor(param.actor, param.actor, param.description, param.draw);
        state.records.createdActors[param.actor] = state.records.messages.length;
        break;
      case 'destroyParticipant':
        state.records.lastDestroyed = param.actor;
        state.records.destroyedActors[param.actor] = state.records.messages.length;
        break;
      case 'activeStart':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;
      case 'activeEnd':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;
      case 'addNote':
        addNote(param.actor, param.placement, param.text);
        break;
      case 'addLinks':
        addLinks(param.actor, param.text);
        break;
      case 'addALink':
        addALink(param.actor, param.text);
        break;
      case 'addProperties':
        addProperties(param.actor, param.text);
        break;
      case 'addDetails':
        addDetails(param.actor, param.text);
        break;
      case 'addMessage':
        if (state.records.lastCreated) {
          if (param.to !== state.records.lastCreated) {
            throw new Error(
              'The created participant ' +
                state.records.lastCreated +
                ' does not have an associated creating message after its declaration. Please check the sequence diagram.'
            );
          } else {
            state.records.lastCreated = undefined;
          }
        } else if (state.records.lastDestroyed) {
          if (
            param.to !== state.records.lastDestroyed &&
            param.from !== state.records.lastDestroyed
          ) {
            throw new Error(
              'The destroyed participant ' +
                state.records.lastDestroyed +
                ' does not have an associated destroying message after its declaration. Please check the sequence diagram.'
            );
          } else {
            state.records.lastDestroyed = undefined;
          }
        }
        addSignal(param.from, param.to, param.msg, param.signalType, param.activate);
        break;
      case 'boxStart':
        addBox(param.boxData);
        break;
      case 'boxEnd':
        boxEnd();
        break;
      case 'loopStart':
        addSignal(undefined, undefined, param.loopText, param.signalType);
        break;
      case 'loopEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'rectStart':
        addSignal(undefined, undefined, param.color, param.signalType);
        break;
      case 'rectEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'optStart':
        addSignal(undefined, undefined, param.optText, param.signalType);
        break;
      case 'optEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'altStart':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;
      case 'else':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;
      case 'altEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'setAccTitle':
        setAccTitle(param.text);
        break;
      case 'parStart':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;
      case 'and':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;
      case 'parEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'criticalStart':
        addSignal(undefined, undefined, param.criticalText, param.signalType);
        break;
      case 'option':
        addSignal(undefined, undefined, param.optionText, param.signalType);
        break;
      case 'criticalEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'breakStart':
        addSignal(undefined, undefined, param.breakText, param.signalType);
        break;
      case 'breakEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
    }
  }
};

export default {
  addActor,
  addMessage,
  addSignal,
  addLinks,
  addDetails,
  addProperties,
  autoWrap,
  setWrap,
  enableSequenceNumbers,
  disableSequenceNumbers,
  showSequenceNumbers,
  getMessages,
  getActors,
  getCreatedActors,
  getDestroyedActors,
  getActor,
  getActorKeys,
  getActorProperty,
  getAccTitle,
  getBoxes,
  getDiagramTitle,
  setDiagramTitle,
  getConfig: () => getConfig().sequence,
  clear,
  parseMessage,
  parseBoxData,
  LINETYPE,
  ARROWTYPE,
  PLACEMENT,
  addNote,
  setAccTitle,
  apply,
  setAccDescription,
  getAccDescription,
  hasAtLeastOneBox,
  hasAtLeastOneBoxWithTitle,
};
