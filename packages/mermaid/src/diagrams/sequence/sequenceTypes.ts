import type { SequenceDiagramConfig } from '../../config.type.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';

export interface BoxData {
  color?: string;
  title?: string;
  wrap?: boolean;
  actorKeys?: [];
}
export interface SequenceDB extends DiagramDB {
  //common db
  parseDirective: ParseDirectiveDefinition;

  //diagram db
  parseBoxData: (str: string) => BoxData;
  addBox: (data: BoxData) => void;
  hasAtleastOneBox: () => boolean;
  hasAtleastOneBoxWithTitle: () => boolean;
  getBoxes: () => BoxData[];
  boxEnd: () => void;
}
