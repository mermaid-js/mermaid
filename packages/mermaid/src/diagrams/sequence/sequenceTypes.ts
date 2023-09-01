import type { SequenceDiagramConfig } from '../../config.type.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';

export interface BoxData {
  color?: string;
  title?: string;
  wrap?: boolean;
  actorKeys?: string[];
}

export interface Message {
  text: string;
  wrap: boolean;
}

export interface ActorData {
  box?: BoxData;
  name: string;
  description: string;
  wrap: boolean;
  prevActor?: string;
  nextActor?: string;
  links: LinkData;
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
  addBox: (data: BoxData) => void;
  addActor: (id: string, name: string, description: Message, type: string) => void;
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
