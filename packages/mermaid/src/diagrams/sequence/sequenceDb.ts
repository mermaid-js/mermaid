import mermaidAPI from '../../mermaidAPI.js';
import { getConfig as commonGetConfig } from '../../config.js';
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
} from '../common/commonDb.js';
import type {
  SequenceDB,
  BoxData,
  ActorData,
  Text,
  Message,
  Note,
  LINETYPE,
} from './sequenceTypes.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { SequenceDiagramConfig } from '../../config.type.js';

export const DEFAULT_SEQUENCE_CONFIG: Required<SequenceDiagramConfig> = DEFAULT_CONFIG.sequence;
const config: Required<SequenceDiagramConfig> = structuredClone(DEFAULT_SEQUENCE_CONFIG);

let prevActor: string | undefined = undefined;
let actors: Record<string, ActorData> = {};
let createdActors: Record<string, ActorData> = {};
let destroyedActors: Record<string, ActorData> = {};
let boxes: BoxData[] = [];
let messages: Message[] = [];
let notes: Note[] = [];
let sequenceNumbersEnabled = false;
let wrapEnabled;
let currentBox: BoxData | undefined = undefined;
const lastCreated = undefined;
const lastDestroyed = undefined;

const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};

const activationCount = (actorId: string): number => {
  let i;
  let count = 0;
  for (i = 0; i < messages.length; i++) {
    if (messages[i].type === 'ACTIVE_START' && messages[i].from === actorId) {
      count++;
    }
    if (messages[i].type === 'ACTIVE_END' && messages[i].from === actorId) {
      count--;
    }
  }
  return count;
};

const addBox = function (data: BoxData): void {
  boxes.push({
    title: data.title,
    wrap: data.wrap ?? autoWrap(),
    color: data.color,
    actorKeys: [],
  });
  currentBox = boxes[boxes.length - 1];
};

export const addActor = function (id: string, name: string, description: Text, type: string) {
  let assignedBox = currentBox;
  const oldActor = actors[id];
  if (oldActor) {
    // If already set and trying to set to a new one throw error
    if (currentBox && oldActor.box && currentBox !== oldActor.box) {
      throw new Error(
        `The same participant should only be defined in one Box: ${oldActor.name} can't be in ${oldActor.box.title} and in ${currentBox.title} at the same time`
      );
    }

    //TODO: we throw an error above if they're not equal. Do we need this?
    // Don't change the box if already
    assignedBox = oldActor.box ? oldActor.box : currentBox;
    // oldActor.box = currentBox; //old code that I'm unsure is needed
  }

  actors[id] = {
    box: assignedBox,
    name: name,
    description: description.text ?? name,
    wrap: description.wrap ?? autoWrap(),
    prevActor: prevActor,
    links: {},
    properties: {},
    actorCnt: 0,
    rectData: null,
    type: type ?? 'participant',
  };

  if (prevActor && actors[prevActor]) {
    actors[prevActor].nextActor = id;
  }

  if (currentBox) {
    currentBox?.actorKeys?.push(id);
  }
  prevActor = id;
};

export const addMessage = function (
  idFrom: string,
  idTo: string,
  message: Text,
  answer: string
): void {
  messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: message.wrap ?? autoWrap(),
    answer: answer,
  });
};

export const addLinks = function (actorId: string, text: Text): void {
  // find the actor
  const actor = getActor(actorId);
  // JSON.parse the text
  try {
    let sanitizedText = sanitizeText(text.text, commonGetConfig());
    sanitizedText = sanitizedText.replace(/&amp;/g, '&');
    sanitizedText = sanitizedText.replace(/&equals;/g, '=');
    const links = JSON.parse(sanitizedText);
    // add the deserialized text to the actor's links field.
    insertLinks(actor, links);
  } catch (e) {
    log.error('error while parsing actor link text', e);
  }
};

export const addALink = function (actorId: string, text: Text): void {
  // find the actor
  const actor = getActor(actorId);
  try {
    const links: Record<string, string> = {};
    let sanitizedText = sanitizeText(text.text, commonGetConfig());
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

function insertLinks(actor: ActorData, links: Record<string, string>): void {
  if (actor.links == null) {
    actor.links = links;
  } else {
    for (const key in links) {
      actor.links[key] = links[key];
    }
  }
}

export const addSignal = function (
  idFrom: string,
  idTo: string,
  message: Text,
  messageType: LINETYPE,
  activate = false
): void {
  if (messageType === 'ACTIVE_END') {
    const cnt = activationCount(idFrom);
    if (cnt < 1) {
      // Bail out as there is an activation signal from an inactive participant
      throw new Error(`Trying to inactivate an inactive participant (${idFrom})`);
    }
  }
  messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: message.wrap ?? autoWrap(),
    type: messageType,
    activate,
  });
};

const hasAtleastOneBox = function (): boolean {
  return boxes.length > 0;
};

const hasAtleastOneBoxWithTitle = function (): boolean {
  return boxes.some((b) => b.title);
};

const getBoxes = function (): BoxData[] {
  return boxes;
};

export const getActors = function (): Record<string, ActorData> {
  return actors;
};

export const getCreatedActors = function (): Record<string, ActorData> {
  return createdActors;
};

export const getDestroyedActors = function (): Record<string, ActorData> {
  return destroyedActors;
};

export const getActor = function (id: string): ActorData {
  return actors[id];
};

export const getActorKeys = function (): string[] {
  return Object.keys(actors);
};

export const getActorProperty = function (actor: ActorData, key: string): string | undefined {
  return actor.properties[key];
};

export const getMessages = function () {
  return messages;
};

export const enableSequenceNumbers = function (): void {
  sequenceNumbersEnabled = true;
};

export const disableSequenceNumbers = function () {
  sequenceNumbersEnabled = false;
};

export const showSequenceNumbers = (): boolean => sequenceNumbersEnabled;

export const setWrap = function (wrapSetting: boolean): void {
  config.wrap = wrapSetting;
};

export const autoWrap = () => {
  return config.wrap;
};

export const clear = function (): void {
  actors = {};
  createdActors = {};
  destroyedActors = {};
  boxes = [];
  notes = [];
  messages = [];
  sequenceNumbersEnabled = false;
  commonClear();
};

export const addNote = function (actorId: string, placement: string, text: Text): void {
  const note: Note = {
    actorId: actorId,
    placement: placement,
    message: text.text,
    wrap: text.wrap ?? autoWrap(),
  };

  // Coerce actor into a [to, from, ...] array
  // eslint-disable-next-line unicorn/prefer-spread
  // why do we need this? seems like it's just to indicate that the note acts as a message
  // that goes from the actor back to themselves
  //const actors = [].concat(actor, actor);

  notes.push(note);
  messages.push({
    from: actorId,
    to: actorId,
    message: text.text,
    wrap: text.wrap ?? autoWrap(),
    type: 'NOTE',
    placement: placement,
  });
};

export const addProperties = function (actorId: string, text: Text) {
  // find the actor
  const actor = getActor(actorId);
  // JSON.parse the text
  try {
    const sanitizedText = sanitizeText(text.text, commonGetConfig());
    const properties = JSON.parse(sanitizedText);
    // add the deserialized text to the actor's property field.
    insertProperties(actor, properties);
  } catch (e) {
    log.error('error while parsing actor properties text', e);
  }
};

/**
 *
 * @param actor - the Actor you want to add the properties to
 * @param properties - properties to add such as css class and icon svg
 */
function insertProperties(actor: ActorData, properties: Record<string, string>): void {
  if (!actor.properties) {
    actor.properties = properties;
  } else {
    for (const key in properties) {
      actor.properties[key] = properties[key];
    }
  }
}

//TODO: no documentation on this feature, seems to be for accessing information
// concerning an element in the DOM and adding it to the actor
export const addDetails = function (actorId: string, text: Text) {
  // find the actor
  const actor = getActor(actorId);
  const elem = document.getElementById(text.text);

  // JSON.parse the text
  try {
    const text = elem?.innerHTML;
    const details = text ? JSON.parse(text) : null;
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

/**
 * We expect the box statement to be color first then description
 * The color can be rgb,rgba,hsl,hsla, or css code names #hex codes are not supported
 * for now because of the way the char # is handled
 * We extract first segment as color, the rest of the line is considered as text
 */
export const parseBoxData = function (str: string): BoxData {
  const match = str.match(/^((?:rgba?|hsla?)\s*\(.*\)|\w*)(.*)$/);
  let color = match && match[1] ? match[1].trim() : 'transparent';
  let title = match && match[2] ? match[2].trim() : '';

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

  const boxData: BoxData = {
    color: color,
    title: title ? sanitizeText(title.replace(/^:?(?:no)?wrap:/, ''), commonGetConfig()) : '',
    wrap: title && title.match(/^:?nowrap:/) ? false : title.match(/^:?wrap:/) ? true : autoWrap(),
  };
  return boxData;
};

export const parseText = function (str: string): Text {
  const _str = str.trim();
  const text = {
    text: _str.replace(/^:?(?:no)?wrap:/, '').trim(),
    wrap: _str.match(/^:?wrap:/) ? true : _str.match(/^:?nowrap:/) ? false : autoWrap(),
  };
  return text;
};

function boxEnd(): void {
  currentBox = undefined;
}

export const db: SequenceDB = {
  parseDirective,
  activationCount,
  parseText,
  addBox,
  addActor,
  addMessage,
  addSignal,
  addLinks,
  addALink,
  addNote,
  insertProperties,
  addProperties,
  addDetails,
  insertLinks,
  getMessages,
  hasAtleastOneBox,
  hasAtleastOneBoxWithTitle,
  enableSequenceNumbers,
  disableSequenceNumbers,
  showSequenceNumbers,
  setWrap,
  autoWrap,
  clear,
  getBoxes,
  getActors,
  getCreatedActors,
  getDestroyedActors,
  getActor,
  getActorKeys,
  getActorProperty,
  parseBoxData,
  boxEnd,
};
