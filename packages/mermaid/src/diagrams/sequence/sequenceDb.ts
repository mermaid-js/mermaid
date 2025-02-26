import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDB } from '../../diagram-api/types.js';
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

const LINETYPE = {
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
} as const;

const ARROWTYPE = {
  FILLED: 0,
  OPEN: 1,
} as const;

const PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2,
} as const;

export class SequenceDB implements DiagramDB {
  private readonly state = new ImperativeState<SequenceState>(() => ({
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

  constructor() {
    // Needed for JISON since it only supports direct properties
    this.apply = this.apply.bind(this);
    this.parseBoxData = this.parseBoxData.bind(this);
    this.parseMessage = this.parseMessage.bind(this);

    this.clear();

    this.setWrap(getConfig().wrap);
    this.LINETYPE = LINETYPE;
    this.ARROWTYPE = ARROWTYPE;
    this.PLACEMENT = PLACEMENT;
  }

  public addBox(data: { text: string; color: string; wrap: boolean }) {
    this.state.records.boxes.push({
      name: data.text,
      wrap: data.wrap ?? this.autoWrap(),
      fill: data.color,
      actorKeys: [],
    });
    this.state.records.currentBox = this.state.records.boxes.slice(-1)[0];
  }

  public addActor(
    id: string,
    name: string,
    description: { text: string; wrap?: boolean | null; type: string },
    type: string
  ) {
    let assignedBox = this.state.records.currentBox;
    const old = this.state.records.actors.get(id);
    if (old) {
      // If already set and trying to set to a new one throw error
      if (this.state.records.currentBox && old.box && this.state.records.currentBox !== old.box) {
        throw new Error(
          `A same participant should only be defined in one Box: ${old.name} can't be in '${old.box.name}' and in '${this.state.records.currentBox.name}' at the same time.`
        );
      }

      // Don't change the box if already
      assignedBox = old.box ? old.box : this.state.records.currentBox;
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

    this.state.records.actors.set(id, {
      box: assignedBox,
      name: name,
      description: description.text,
      wrap: description.wrap ?? this.autoWrap(),
      prevActor: this.state.records.prevActor,
      links: {},
      properties: {},
      actorCnt: null,
      rectData: null,
      type: type ?? 'participant',
    });
    if (this.state.records.prevActor) {
      const prevActorInRecords = this.state.records.actors.get(this.state.records.prevActor);
      if (prevActorInRecords) {
        prevActorInRecords.nextActor = id;
      }
    }

    if (this.state.records.currentBox) {
      this.state.records.currentBox.actorKeys.push(id);
    }
    this.state.records.prevActor = id;
  }

  private activationCount(part: string) {
    let i;
    let count = 0;
    if (!part) {
      return 0;
    }
    for (i = 0; i < this.state.records.messages.length; i++) {
      if (
        this.state.records.messages[i].type === this.LINETYPE.ACTIVE_START &&
        this.state.records.messages[i].from === part
      ) {
        count++;
      }
      if (
        this.state.records.messages[i].type === this.LINETYPE.ACTIVE_END &&
        this.state.records.messages[i].from === part
      ) {
        count--;
      }
    }
    return count;
  }

  public addMessage(
    idFrom: Message['from'],
    idTo: Message['to'],
    message: { text: string; wrap?: boolean },
    answer: Message['answer']
  ) {
    this.state.records.messages.push({
      id: this.state.records.messages.length.toString(),
      from: idFrom,
      to: idTo,
      message: message.text,
      wrap: message.wrap ?? this.autoWrap(),
      answer: answer,
    });
  }

  public addSignal(
    idFrom?: Message['from'],
    idTo?: Message['to'],
    message?: { text: string; wrap: boolean },
    messageType?: number,
    activate = false
  ) {
    if (messageType === this.LINETYPE.ACTIVE_END) {
      const cnt = this.activationCount(idFrom ?? '');
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
    this.state.records.messages.push({
      id: this.state.records.messages.length.toString(),
      from: idFrom,
      to: idTo,
      message: message?.text ?? '',
      wrap: message?.wrap ?? this.autoWrap(),
      type: messageType,
      activate,
    });
    return true;
  }

  public hasAtLeastOneBox() {
    return this.state.records.boxes.length > 0;
  }

  public hasAtLeastOneBoxWithTitle() {
    return this.state.records.boxes.some((b) => b.name);
  }

  public getMessages() {
    return this.state.records.messages;
  }

  public getBoxes() {
    return this.state.records.boxes;
  }
  public getActors() {
    return this.state.records.actors;
  }
  public getCreatedActors() {
    return this.state.records.createdActors;
  }
  public getDestroyedActors() {
    return this.state.records.destroyedActors;
  }
  public getActor(id: string) {
    // TODO: do we ever use this function in a way that it might return undefined?
    return this.state.records.actors.get(id)!;
  }
  public getActorKeys() {
    return [...this.state.records.actors.keys()];
  }
  public enableSequenceNumbers() {
    this.state.records.sequenceNumbersEnabled = true;
  }
  public disableSequenceNumbers() {
    this.state.records.sequenceNumbersEnabled = false;
  }
  public showSequenceNumbers() {
    return this.state.records.sequenceNumbersEnabled;
  }

  public setWrap(wrapSetting?: boolean) {
    this.state.records.wrapEnabled = wrapSetting;
  }

  private extractWrap(text?: string): { cleanedText?: string; wrap?: boolean } {
    if (text === undefined) {
      return {};
    }
    text = text.trim();
    const wrap =
      /^:?wrap:/.exec(text) !== null ? true : /^:?nowrap:/.exec(text) !== null ? false : undefined;
    const cleanedText = (wrap === undefined ? text : text.replace(/^:?(?:no)?wrap:/, '')).trim();
    return { cleanedText, wrap };
  }

  public autoWrap() {
    // if setWrap has been called, use that value, otherwise use the value from the config
    // TODO: refactor, always use the config value let setWrap update the config value
    if (this.state.records.wrapEnabled !== undefined) {
      return this.state.records.wrapEnabled;
    }
    return getConfig().sequence?.wrap ?? false;
  }

  public clear() {
    this.state.reset();
    commonClear();
  }

  public parseMessage(str: string) {
    const trimmedStr = str.trim();
    const { wrap, cleanedText } = this.extractWrap(trimmedStr);
    const message = {
      text: cleanedText,
      wrap,
    };
    log.debug(`parseMessage: ${JSON.stringify(message)}`);
    return message;
  }

  // We expect the box statement to be color first then description
  // The color can be rgb,rgba,hsl,hsla, or css code names  #hex codes are not supported for now because of the way the char # is handled
  // We extract first segment as color, the rest of the line is considered as text
  public parseBoxData(str: string) {
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
    const { wrap, cleanedText } = this.extractWrap(title);
    return {
      text: cleanedText ? sanitizeText(cleanedText, getConfig()) : undefined,
      color,
      wrap,
    };
  }

  public readonly LINETYPE: typeof LINETYPE;
  public readonly ARROWTYPE: typeof ARROWTYPE;
  public readonly PLACEMENT: typeof PLACEMENT;

  public addNote(
    actor: { actor: string },
    placement: Message['placement'],
    message: { text: string; wrap?: boolean }
  ) {
    const note: Note = {
      actor: actor,
      placement: placement,
      message: message.text,
      wrap: message.wrap ?? this.autoWrap(),
    };

    //@ts-ignore: Coerce actor into a [to, from, ...] array
    // eslint-disable-next-line unicorn/prefer-spread
    const actors = [].concat(actor, actor);
    this.state.records.notes.push(note);
    this.state.records.messages.push({
      id: this.state.records.messages.length.toString(),
      from: actors[0],
      to: actors[1],
      message: message.text,
      wrap: message.wrap ?? this.autoWrap(),
      type: this.LINETYPE.NOTE,
      placement: placement,
    });
  }

  public addLinks(actorId: string, text: { text: string }) {
    // find the actor
    const actor = this.getActor(actorId);
    // JSON.parse the text
    try {
      let sanitizedText = sanitizeText(text.text, getConfig());
      sanitizedText = sanitizedText.replace(/&equals;/g, '=');
      sanitizedText = sanitizedText.replace(/&amp;/g, '&');
      const links = JSON.parse(sanitizedText);
      // add the deserialized text to the actor's links field.
      this.insertLinks(actor, links);
    } catch (e) {
      log.error('error while parsing actor link text', e);
    }
  }

  public addALink(actorId: string, text: { text: string }) {
    // find the actor
    const actor = this.getActor(actorId);
    try {
      const links: Record<string, string> = {};
      let sanitizedText = sanitizeText(text.text, getConfig());
      const sep = sanitizedText.indexOf('@');
      sanitizedText = sanitizedText.replace(/&equals;/g, '=');
      sanitizedText = sanitizedText.replace(/&amp;/g, '&');
      const label = sanitizedText.slice(0, sep - 1).trim();
      const link = sanitizedText.slice(sep + 1).trim();

      links[label] = link;
      // add the deserialized text to the actor's links field.
      this.insertLinks(actor, links);
    } catch (e) {
      log.error('error while parsing actor link text', e);
    }
  }

  private insertLinks(actor: Actor, links: Record<string, string>) {
    if (actor.links == null) {
      actor.links = links;
    } else {
      for (const key in links) {
        actor.links[key] = links[key];
      }
    }
  }

  public addProperties(actorId: string, text: { text: string }) {
    // find the actor
    const actor = this.getActor(actorId);
    // JSON.parse the text
    try {
      const sanitizedText = sanitizeText(text.text, getConfig());
      const properties: Record<string, unknown> = JSON.parse(sanitizedText);
      // add the deserialized text to the actor's property field.
      this.insertProperties(actor, properties);
    } catch (e) {
      log.error('error while parsing actor properties text', e);
    }
  }

  private insertProperties(actor: Actor, properties: Record<string, unknown>) {
    if (actor.properties == null) {
      actor.properties = properties;
    } else {
      for (const key in properties) {
        actor.properties[key] = properties[key];
      }
    }
  }

  private boxEnd() {
    this.state.records.currentBox = undefined;
  }

  public addDetails(actorId: string, text: { text: string }) {
    // find the actor
    const actor = this.getActor(actorId);
    const elem = document.getElementById(text.text)!;

    // JSON.parse the text
    try {
      const text = elem.innerHTML;
      const details = JSON.parse(text);
      // add the deserialized text to the actor's property field.
      if (details.properties) {
        this.insertProperties(actor, details.properties);
      }

      if (details.links) {
        this.insertLinks(actor, details.links);
      }
    } catch (e) {
      log.error('error while parsing actor details text', e);
    }
  }

  public getActorProperty(actor: Actor, key: string) {
    if (actor?.properties !== undefined) {
      return actor.properties[key];
    }

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-redundant-type-constituents
  public apply(param: any | AddMessageParams | AddMessageParams[]) {
    if (Array.isArray(param)) {
      param.forEach((item) => {
        this.apply(item);
      });
    } else {
      switch (param.type) {
        case 'sequenceIndex':
          this.state.records.messages.push({
            id: this.state.records.messages.length.toString(),
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
          this.addActor(param.actor, param.actor, param.description, param.draw);
          break;
        case 'createParticipant':
          if (this.state.records.actors.has(param.actor)) {
            throw new Error(
              "It is not possible to have actors with the same id, even if one is destroyed before the next is created. Use 'AS' aliases to simulate the behavior"
            );
          }
          this.state.records.lastCreated = param.actor;
          this.addActor(param.actor, param.actor, param.description, param.draw);
          this.state.records.createdActors.set(param.actor, this.state.records.messages.length);
          break;
        case 'destroyParticipant':
          this.state.records.lastDestroyed = param.actor;
          this.state.records.destroyedActors.set(param.actor, this.state.records.messages.length);
          break;
        case 'activeStart':
          this.addSignal(param.actor, undefined, undefined, param.signalType);
          break;
        case 'activeEnd':
          this.addSignal(param.actor, undefined, undefined, param.signalType);
          break;
        case 'addNote':
          this.addNote(param.actor, param.placement, param.text);
          break;
        case 'addLinks':
          this.addLinks(param.actor, param.text);
          break;
        case 'addALink':
          this.addALink(param.actor, param.text);
          break;
        case 'addProperties':
          this.addProperties(param.actor, param.text);
          break;
        case 'addDetails':
          this.addDetails(param.actor, param.text);
          break;
        case 'addMessage':
          if (this.state.records.lastCreated) {
            if (param.to !== this.state.records.lastCreated) {
              throw new Error(
                'The created participant ' +
                  this.state.records.lastCreated.name +
                  ' does not have an associated creating message after its declaration. Please check the sequence diagram.'
              );
            } else {
              this.state.records.lastCreated = undefined;
            }
          } else if (this.state.records.lastDestroyed) {
            if (
              param.to !== this.state.records.lastDestroyed &&
              param.from !== this.state.records.lastDestroyed
            ) {
              throw new Error(
                'The destroyed participant ' +
                  this.state.records.lastDestroyed.name +
                  ' does not have an associated destroying message after its declaration. Please check the sequence diagram.'
              );
            } else {
              this.state.records.lastDestroyed = undefined;
            }
          }
          this.addSignal(param.from, param.to, param.msg, param.signalType, param.activate);
          break;
        case 'boxStart':
          this.addBox(param.boxData);
          break;
        case 'boxEnd':
          this.boxEnd();
          break;
        case 'loopStart':
          this.addSignal(undefined, undefined, param.loopText, param.signalType);
          break;
        case 'loopEnd':
          this.addSignal(undefined, undefined, undefined, param.signalType);
          break;
        case 'rectStart':
          this.addSignal(undefined, undefined, param.color, param.signalType);
          break;
        case 'rectEnd':
          this.addSignal(undefined, undefined, undefined, param.signalType);
          break;
        case 'optStart':
          this.addSignal(undefined, undefined, param.optText, param.signalType);
          break;
        case 'optEnd':
          this.addSignal(undefined, undefined, undefined, param.signalType);
          break;
        case 'altStart':
          this.addSignal(undefined, undefined, param.altText, param.signalType);
          break;
        case 'else':
          this.addSignal(undefined, undefined, param.altText, param.signalType);
          break;
        case 'altEnd':
          this.addSignal(undefined, undefined, undefined, param.signalType);
          break;
        case 'setAccTitle':
          setAccTitle(param.text);
          break;
        case 'parStart':
          this.addSignal(undefined, undefined, param.parText, param.signalType);
          break;
        case 'and':
          this.addSignal(undefined, undefined, param.parText, param.signalType);
          break;
        case 'parEnd':
          this.addSignal(undefined, undefined, undefined, param.signalType);
          break;
        case 'criticalStart':
          this.addSignal(undefined, undefined, param.criticalText, param.signalType);
          break;
        case 'option':
          this.addSignal(undefined, undefined, param.optionText, param.signalType);
          break;
        case 'criticalEnd':
          this.addSignal(undefined, undefined, undefined, param.signalType);
          break;
        case 'breakStart':
          this.addSignal(undefined, undefined, param.breakText, param.signalType);
          break;
        case 'breakEnd':
          this.addSignal(undefined, undefined, undefined, param.signalType);
          break;
      }
    }
  }

  public setAccTitle = setAccTitle;
  public setAccDescription = setAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getAccTitle = getAccTitle;
  public getAccDescription = getAccDescription;
  public getDiagramTitle = getDiagramTitle;
  public getConfig() {
    return getConfig().sequence;
  }
}
