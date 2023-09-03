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
} from '../../commonDb.js';
import type { SequenceDB, BoxData, ActorData, Text, Message } from './sequenceTypes.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';

let prevActor: string | undefined = undefined;
const actors: Record<string, ActorData> = {};
const createdActors: Record<string, ActorData> = {};
const destroyedActors: Record<string, ActorData> = {};
const boxes: BoxData[] = [];
const messages: Message[] = [];
const notes = [];
const sequenceNumbersEnabled = false;
let wrapEnabled;
let currentBox: BoxData | undefined = undefined;
const lastCreated = undefined;
const lastDestroyed = undefined;

const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};
const addBox = function (data: BoxData): void {
  boxes.push({
    title: data.title,
    wrap: data.wrap,
    color: data.color,
    actorKeys: [],
  });
  currentBox = boxes[boxes.length - 1];
};
//TODO: look into changing description to type string. Currently, it is set to Message because
// jison calls parseMessage on the text portion of the participant_statement grammar
// changing it in jison causes over 100 tests to fail so need to ensure cascading changes don't
// occur from the type change.
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
    wrap: description.wrap,
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
    wrap: message.wrap ?? true,
    answer: answer,
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
    wrap: title && title.match(/^:?nowrap:/) ? false : true,
  };
  return boxData;
};

export const parseText = function (str: string): Text {
  const _str = str.trim();
  const text = {
    text: _str.replace(/^:?(?:no)?wrap:/, '').trim(),
    wrap: _str.match(/^:?wrap:/) ? true : _str.match(/^:?nowrap:/) ? false : undefined,
  };
  return text;
};

function boxEnd(): void {
  currentBox = undefined;
}

export const db: SequenceDB = {
  parseDirective,
  parseText,
  addBox,
  addActor,
  addMessage,
  getMessages,
  hasAtleastOneBox,
  hasAtleastOneBoxWithTitle,
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
