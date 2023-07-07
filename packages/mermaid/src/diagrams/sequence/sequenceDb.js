import mermaidAPI from '../../mermaidAPI.js';
import * as configApi from '../../config.js';
import { log } from '../../logger.js';
import { sanitizeText } from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb.js';

let prevActor = undefined;
let actors = {};
let createdActors = {};
let destroyedActors = {};
let boxes = [];
let messages = [];
const notes = [];
let sequenceNumbersEnabled = false;
let wrapEnabled;
let currentBox = undefined;
let lastCreated = undefined;
let lastDestroyed = undefined;

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

export const addBox = function (data) {
  boxes.push({
    name: data.text,
    wrap: (data.wrap === undefined && autoWrap()) || !!data.wrap,
    fill: data.color,
    actorKeys: [],
  });
  currentBox = boxes.slice(-1)[0];
};

export const addActor = function (id, name, description, type) {
  let assignedBox = currentBox;
  const old = actors[id];
  if (old) {
    // If already set and trying to set to a new one throw error
    if (currentBox && old.box && currentBox !== old.box) {
      throw new Error(
        'A same participant should only be defined in one Box: ' +
          old.name +
          " can't be in '" +
          old.box.name +
          "' and in '" +
          currentBox.name +
          "' at the same time."
      );
    }

    // Don't change the box if already
    assignedBox = old.box ? old.box : currentBox;
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

  actors[id] = {
    box: assignedBox,
    name: name,
    description: description.text,
    wrap: (description.wrap === undefined && autoWrap()) || !!description.wrap,
    prevActor: prevActor,
    links: {},
    properties: {},
    actorCnt: null,
    rectData: null,
    type: type || 'participant',
  };
  if (prevActor && actors[prevActor]) {
    actors[prevActor].nextActor = id;
  }

  if (currentBox) {
    currentBox.actorKeys.push(id);
  }
  prevActor = id;
};

const activationCount = (part) => {
  let i;
  let count = 0;
  for (i = 0; i < messages.length; i++) {
    if (messages[i].type === LINETYPE.ACTIVE_START && messages[i].from.actor === part) {
      count++;
    }
    if (messages[i].type === LINETYPE.ACTIVE_END && messages[i].from.actor === part) {
      count--;
    }
  }
  return count;
};

export const addMessage = function (idFrom, idTo, message, answer) {
  messages.push({
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
  messageType
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
  messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: (message.wrap === undefined && autoWrap()) || !!message.wrap,
    type: messageType,
  });
  return true;
};

export const hasAtLeastOneBox = function () {
  return boxes.length > 0;
};

export const hasAtLeastOneBoxWithTitle = function () {
  return boxes.some((b) => b.name);
};

export const getMessages = function () {
  return messages;
};

export const getBoxes = function () {
  return boxes;
};
export const getActors = function () {
  return actors;
};
export const getCreatedActors = function () {
  return createdActors;
};
export const getDestroyedActors = function () {
  return destroyedActors;
};
export const getActor = function (id) {
  return actors[id];
};
export const getActorKeys = function () {
  return Object.keys(actors);
};
export const enableSequenceNumbers = function () {
  sequenceNumbersEnabled = true;
};
export const disableSequenceNumbers = function () {
  sequenceNumbersEnabled = false;
};
export const showSequenceNumbers = () => sequenceNumbersEnabled;

export const setWrap = function (wrapSetting) {
  wrapEnabled = wrapSetting;
};

export const autoWrap = () => {
  // if setWrap has been called, use that value, otherwise use the value from the config
  // TODO: refactor, always use the config value let setWrap update the config value
  if (wrapEnabled !== undefined) {
    return wrapEnabled;
  }
  return configApi.getConfig().sequence.wrap;
};

export const clear = function () {
  actors = {};
  createdActors = {};
  destroyedActors = {};
  boxes = [];
  messages = [];
  sequenceNumbersEnabled = false;
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

  const boxData = {
    color: color,
    text:
      title !== undefined
        ? sanitizeText(title.replace(/^:?(?:no)?wrap:/, ''), configApi.getConfig())
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
  return boxData;
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

  notes.push(note);
  messages.push({
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
    let sanitizedText = sanitizeText(text.text, configApi.getConfig());
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
    let sanitizedText = sanitizeText(text.text, configApi.getConfig());
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
    let sanitizedText = sanitizeText(text.text, configApi.getConfig());
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
  currentBox = undefined;
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

export const apply = function (param) {
  if (Array.isArray(param)) {
    param.forEach(function (item) {
      apply(item);
    });
  } else {
    switch (param.type) {
      case 'sequenceIndex':
        messages.push({
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
        if (actors[param.actor]) {
          throw new Error(
            "It is not possible to have actors with the same id, even if one is destroyed before the next is created. Use 'AS' aliases to simulate the behavior"
          );
        }
        lastCreated = param.actor;
        addActor(param.actor, param.actor, param.description, param.draw);
        createdActors[param.actor] = messages.length;
        break;
      case 'destroyParticipant':
        lastDestroyed = param.actor;
        destroyedActors[param.actor] = messages.length;
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
        if (lastCreated) {
          if (param.to !== lastCreated) {
            throw new Error(
              'The created participant ' +
                lastCreated +
                ' does not have an associated creating message after its declaration. Please check the sequence diagram.'
            );
          } else {
            lastCreated = undefined;
          }
        } else if (lastDestroyed) {
          if (param.to !== lastDestroyed && param.from !== lastDestroyed) {
            throw new Error(
              'The destroyed participant ' +
                lastDestroyed +
                ' does not have an associated destroying message after its declaration. Please check the sequence diagram.'
            );
          } else {
            lastDestroyed = undefined;
          }
        }
        addSignal(param.from, param.to, param.msg, param.signalType);
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
  parseDirective,
  getConfig: () => configApi.getConfig().sequence,
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
