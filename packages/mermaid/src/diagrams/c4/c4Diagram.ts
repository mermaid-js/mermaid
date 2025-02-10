// @ts-ignore: JISON doesn't support types
import parser from './parser/c4Diagram.jison';
import { C4DB } from './c4Db.js';
import renderer from './c4Renderer-unified.js';
import styles from './styles.js';
import type { MermaidConfig } from '../../config.type.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new C4DB();
  },
  renderer,
  styles,
  init: (cnf: MermaidConfig) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    if (cnf.layout) {
      setConfig({ layout: cnf.layout });
    }
  },
};
