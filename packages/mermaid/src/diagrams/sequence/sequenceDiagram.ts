import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/sequenceDiagram.jison';
import { SequenceDB } from './sequenceDb.js';
import styles from './styles.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import renderer from './sequenceRenderer.js';
import type { MermaidConfig } from '../../config.type.js';

const db = new SequenceDB();
parser.yy = {
  parseMessage: db.parseMessage.bind(db),
  matchAsActorOrParticipant: db.matchAsActorOrParticipant.bind(db),
};

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return db;
  },
  renderer,
  styles,
  init: (cnf: MermaidConfig) => {
    if (!cnf.sequence) {
      cnf.sequence = {};
    }
    if (cnf.wrap) {
      cnf.sequence.wrap = cnf.wrap;
      setConfig({ sequence: { wrap: cnf.wrap } });
    }
  },
};
