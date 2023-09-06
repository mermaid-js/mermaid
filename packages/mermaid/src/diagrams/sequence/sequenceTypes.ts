import type { SequenceDiagramConfig } from '../../config.type.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';

export type LINETYPE =
  | 'SOLID'
  | 'DOTTED'
  | 'NOTE'
  | 'SOLID_CROSS'
  | 'DOTTED_CROSS'
  | 'SOLID_OPEN'
  | 'DOTTED_OPEN'
  | 'LOOP_START'
  | 'LOOP_END'
  | 'ALT_START'
  | 'ALT_ELSE'
  | 'ALT_END'
  | 'OPT_START'
  | 'OPT_END'
  | 'ACTIVE_START'
  | 'ACTIVE_END'
  | 'PAR_START'
  | 'PAR_AND'
  | 'PAR_END'
  | 'RECT_START'
  | 'RECT_END'
  | 'SOLID_POINT'
  | 'DOTTED_POINT'
  | 'AUTONUMBER'
  | 'CRITICAL_START'
  | 'CRITICAL_OPTION'
  | 'CRITICAL_END'
  | 'BREAK_START'
  | 'BREAK_END'
  | 'PAR_OVER_START';

export type ARROWTYPE = 'FILLED' | 'OPEN';

export type PLACEMENT = 'LEFTOF' | 'RIGHTOF' | 'OVER';

export interface BoxData {
  color?: string;
  title?: string;
  wrap?: boolean;
  actorKeys?: string[];
}

export interface Text {
  text: string;
  wrap?: boolean;
}

export interface Message {
  from?: string;
  to: string;
  message: string;
  wrap?: boolean;
  answer?: string;
  type?: string;
  activate?: boolean;
}

export interface ActorData {
  box?: BoxData;
  name: string;
  description: string;
  wrap?: boolean;
  prevActor?: string;
  nextActor?: string;
  links: Record<string, string>;
  properties: Record<string, string>;
  actorCnt: number;
  rectData: null;
  type: string;
}
export interface SequenceDB extends DiagramDB {
  //common db
  parseDirective: ParseDirectiveDefinition;

  //diagram db
  parseBoxData: (str: string) => BoxData;
  activationCount: (actorId: string) => number;
  parseText: (str: string) => Text;
  addBox: (data: BoxData) => void;
  addActor: (id: string, name: string, description: Text, type: string) => void;
  addMessage: (idFrom: string, idTo: string, message: Text, answer: string) => void;
  getMessages: () => Message[];
  addSignal: (
    idFrom: string,
    idTo: string,
    message: Text,
    messageType: LINETYPE,
    activate: boolean
  ) => void;
  addLinks: (id: string, text: Text) => void;
  addALink: (actorId: string, text: Text) => void;
  insertLinks: (actor: ActorData, link: Record<string, string>) => void;
  hasAtleastOneBox: () => boolean;
  hasAtleastOneBoxWithTitle: () => boolean;
  getBoxes: () => BoxData[];
  getActors: () => Record<string, ActorData>;
  getCreatedActors: () => Record<string, ActorData>;
  getDestroyedActors: () => Record<string, ActorData>;
  getActor: (id: string) => ActorData;
  getActorKeys: () => string[];
  getActorProperty: (actor: ActorData, key: string) => string | undefined;
  boxEnd: () => void;
}
