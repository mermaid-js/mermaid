// @ts-ignore: JISON doesn't support types
import parser from './parser/c4Diagram.jison';
import db from './c4Db.js';
import renderer from './c4Renderer.js';
import styles from './styles.js';
import type { MermaidConfig } from '../../config.type.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
  init: ({ c4, wrap }: MermaidConfig) => {
    renderer.setConf(c4);
    db.setWrap(wrap);
  },
};
