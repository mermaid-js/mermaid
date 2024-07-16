import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { ImperativeState } from '../../utils/imperativeState.js';
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
import type { Actor, AddMessageParams, Box, Message, Note } from './types.js';

interface SequenceState {
  prevActor?: string;
  actors: Map<string, Actor>;
  createdActors: Map<string, number>;
  destroyedActors: Map<string, number>;
  boxes: Box[];
  messages: Message[];
  notes: Note[];
  sequenceNumbersEnabled: boolean;
  wrapEnabled?: boolean;
  currentBox?: Box;
  lastCreated?: Actor;
  lastDestroyed?: Actor;
}

const state = new ImperativeState<SequenceState>(() => ({
  prevActor: undefined,
  actors: new Map(),
  createdActors: new Map(),
  destroyedActors: new Map(),
  boxes: [],
  messages: [],
  notes: [],
  sequenceNumbersEnabled: false,
  wrapEnabled: undefined,
  currentBox: undefined,
  lastCreated: undefined,
  lastDestroyed: undefined,
}));

export const addBox = function (data: { text: string; color: string; wrap: boolean }) {
  state.records.boxes.push({
    name: data.text,
    wrap: data.wrap ?? autoWrap(),
    fill: data.color,
    actorKeys: [],
  });
  state.records.currentBox = state.records.boxes.slice(-1)[0];
};

export const addActor = function (
  id: string,
  name: string,
  description: { text: string; wrap?: boolean | null; type: string },
  type: string
) {
  let assignedBox = state.records.currentBox;
  const old = state.records.actors.get(id);
  if (old) {
    // If already set and trying to set to a new one throw error
    if (state.records.currentBox && old.box && state.records.currentBox !== old.box) {
      throw new Error(
        `A same participant should only be defined in one Box: ${old.name} can't be in '${old.box.name}' and in '${state.records.currentBox.name}' at the same time.`
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
  if (description?.text == null) {
    description = { text: name, type };
  }
  if (type == null || description.text == null) {
    description = { text: name, type };
  }

  state.records.actors.set(id, {
    box: assignedBox,
    name: name,
    description: description.text,
    wrap: description.wrap ?? autoWrap(),
    prevActor: state.records.prevActor,
    links: {},
    properties: {},
    actorCnt: null,
    rectData: null,
    type: type ?? 'participant',
  });
  if (state.records.prevActor) {
    const prevActorInRecords = state.records.actors.get(state.records.prevActor);
    if (prevActorInRecords) {
      prevActorInRecords.nextActor = id;
    }
  }

  if (state.records.currentBox) {
    state.records.currentBox.actorKeys.push(id);
  }
  state.records.prevActor = id;
};

const activationCount = (part: string) => {
  let i;
  let count = 0;
  if (!part) {
    return 0;
  }
  for (i = 0; i < state.records.messages.length; i++) {
    if (
      state.records.messages[i].type === LINETYPE.ACTIVE_START &&
      state.records.messages[i].from === part
    ) {
      count++;
    }
    if (
      state.records.messages[i].type === LINETYPE.ACTIVE_END &&
      state.records.messages[i].from === part
    ) {
      count--;
    }
  }
  return count;
};

export const addMessage = function (
  idFrom: Message['from'],
  idTo: Message['to'],
  message: { text: string; wrap?: boolean },
  answer: Message['answer']
) {
  state.records.messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: message.wrap ?? autoWrap(),
    answer: answer,
  });
};

export const addSignal = function (
  idFrom?: Message['from'],
  idTo?: Message['to'],
  message?: { text: string; wrap: boolean },
  messageType?: number,
  activate = false
) {
  if (messageType === LINETYPE.ACTIVE_END) {
    const cnt = activationCount(idFrom ?? '');
    if (cnt < 1) {
      // Bail out as there is an activation signal from an inactive participant
      const error = new Error('Trying to inactivate an inactive participant (' + idFrom + ')');

      // @ts-ignore: we are passing hash param to the error object, however we should define our own custom error class to make it type safe
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
    message: message?.text ?? '',
    wrap: message?.wrap ?? autoWrap(),
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
export const getActor = function (id: string) {
  // TODO: do we ever use this function in a way that it might return undefined?
  return state.records.actors.get(id)!;
};
export const getActorKeys = function () {
  return [...state.records.actors.keys()];
};
export const enableSequenceNumbers = function () {
  state.records.sequenceNumbersEnabled = true;
};
export const disableSequenceNumbers = function () {
  state.records.sequenceNumbersEnabled = false;
};
export const showSequenceNumbers = () => state.records.sequenceNumbersEnabled;

export const setWrap = function (wrapSetting?: boolean) {
  state.records.wrapEnabled = wrapSetting;
};

const extractWrap = (text?: string): { cleanedText?: string; wrap?: boolean } => {
  if (text === undefined) {
    return {};
  }
  text = text.trim();
  const wrap =
    /^:?wrap:/.exec(text) !== null ? true : /^:?nowrap:/.exec(text) !== null ? false : undefined;
  const cleanedText = (wrap === undefined ? text : text.replace(/^:?(?:no)?wrap:/, '')).trim();
  return { cleanedText, wrap };
};

export const autoWrap = () => {
  // if setWrap has been called, use that value, otherwise use the value from the config
  // TODO: refactor, always use the config value let setWrap update the config value
  if (state.records.wrapEnabled !== undefined) {
    return state.records.wrapEnabled;
  }
  return getConfig().sequence?.wrap ?? false;
};

export const clear = function () {
  state.reset();
  commonClear();
};

export const parseMessage = function (str: string) {
  const trimmedStr = str.trim();
  const { wrap, cleanedText } = extractWrap(trimmedStr);
  const message = {
    text: cleanedText,
    wrap,
  };
  log.debug(`parseMessage: ${JSON.stringify(message)}`);
  return message;
};

// We expect the box statement to be color first then description
// The color can be rgb,rgba,hsl,hsla, or css code names  #hex codes are not supported for now because of the way the char # is handled
// We extract first segment as color, the rest of the line is considered as text
export const parseBoxData = function (str: string) {
  const match = /^((?:rgba?|hsla?)\s*\(.*\)|\w*)(.*)$/.exec(str);
  let color = match?.[1] ? match[1].trim() : 'transparent';
  let title = match?.[2] ? match[2].trim() : undefined;

  // check that the string is a color
  if (window?.CSS) {
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
  const { wrap, cleanedText } = extractWrap(title);
  return {
    text: cleanedText ? sanitizeText(cleanedText, getConfig()) : undefined,
    color,
    wrap,
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
  BIDIRECTIONAL_SOLID: 33,
  BIDIRECTIONAL_DOTTED: 34,
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

export const addNote = function (
  actor: { actor: string },
  placement: Message['placement'],
  message: { text: string; wrap?: boolean }
) {
  const note: Note = {
    actor: actor,
    placement: placement,
    message: message.text,
    wrap: message.wrap ?? autoWrap(),
  };

  //@ts-ignore: Coerce actor into a [to, from, ...] array
  // eslint-disable-next-line unicorn/prefer-spread
  const actors = [].concat(actor, actor);
  state.records.notes.push(note);
  state.records.messages.push({
    from: actors[0],
    to: actors[1],
    message: message.text,
    wrap: message.wrap ?? autoWrap(),
    type: LINETYPE.NOTE,
    placement: placement,
  });
};

export const addLinks = function (actorId: string, text: { text: string }) {
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

export const addALink = function (actorId: string, text: { text: string }) {
  // find the actor
  const actor = getActor(actorId);
  try {
    const links: Record<string, string> = {};
    let sanitizedText = sanitizeText(text.text, getConfig());
    const sep = sanitizedText.indexOf('@');
    sanitizedText = sanitizedText.replace(/&amp;/g, '&');
    sanitizedText = sanitizedText.replace(/&equals;/g, '=');
    const label = sanitizedText.slice(0, sep - 1).trim();
    const link = sanitizedText.slice(sep + 1).trim();

    links[label] = link;
    // add the deserialized text to the actor's links field.
    insertLinks(actor, links);
  } catch (e) {
    log.error('error while parsing actor link text', e);
  }
};

/**
 * @param actor - the actor to add the links to
 * @param links - the links to add to the actor
 */
function insertLinks(actor: Actor, links: Record<string, string>) {
  if (actor.links == null) {
    actor.links = links;
  } else {
    for (const key in links) {
      actor.links[key] = links[key];
    }
  }
}

export const addProperties = function (actorId: string, text: { text: string }) {
  // find the actor
  const actor = getActor(actorId);
  // JSON.parse the text
  try {
    const sanitizedText = sanitizeText(text.text, getConfig());
    const properties: Record<string, unknown> = JSON.parse(sanitizedText);
    // add the deserialized text to the actor's property field.
    insertProperties(actor, properties);
  } catch (e) {
    log.error('error while parsing actor properties text', e);
  }
};

/**
 * @param actor - the actor to add the properties to
 * @param properties - the properties to add to the actor's properties
 */
function insertProperties(actor: Actor, properties: Record<string, unknown>) {
  if (actor.properties == null) {
    actor.properties = properties;
  } else {
    for (const key in properties) {
      actor.properties[key] = properties[key];
    }
  }
}

function boxEnd() {
  state.records.currentBox = undefined;
}

export const addDetails = function (actorId: string, text: { text: string }) {
  // find the actor
  const actor = getActor(actorId);
  const elem = document.getElementById(text.text)!;

  // JSON.parse the text
  try {
    const text = elem.innerHTML;
    const details = JSON.parse(text);
    // add the deserialized text to the actor's property field.
    if (details.properties) {
      insertProperties(actor, details.properties);
    }

    if (details.links) {
      insertLinks(actor, details.links);
    }
  } catch (e) {
    log.error('error while parsing actor details text', e);
  }
};

export const getActorProperty = function (actor: Actor, key: string) {
  if (actor?.properties !== undefined) {
    return actor.properties[key];
  }

  return undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-redundant-type-constituents
export const apply = function (param: any | AddMessageParams | AddMessageParams[]) {
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
        if (state.records.actors.has(param.actor)) {
          throw new Error(
            "It is not possible to have actors with the same id, even if one is destroyed before the next is created. Use 'AS' aliases to simulate the behavior"
          );
        }
        state.records.lastCreated = param.actor;
        addActor(param.actor, param.actor, param.description, param.draw);
        state.records.createdActors.set(param.actor, state.records.messages.length);
        break;
      case 'destroyParticipant':
        state.records.lastDestroyed = param.actor;
        state.records.destroyedActors.set(param.actor, state.records.messages.length);
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
                state.records.lastCreated.name +
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
                state.records.lastDestroyed.name +
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
