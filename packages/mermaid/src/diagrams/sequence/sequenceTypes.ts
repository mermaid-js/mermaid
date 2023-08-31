import type { SequenceDiagramConfig } from '../../config.type.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';

export interface SequenceDB extends DiagramDB {
  //common db
  parseDirective: ParseDirectiveDefinition;
}
