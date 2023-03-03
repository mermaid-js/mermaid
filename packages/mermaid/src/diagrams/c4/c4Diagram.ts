// @ts-ignore: TODO Fix ts errors
import c4Parser from './parser/c4Diagram.jison';
import c4Db from './c4Db.js';
import c4Renderer from './c4Renderer.js';
import c4Styles from './styles.js';
import { MermaidConfig } from '../../config.type.ts';
import { DiagramDefinition } from '../../diagram-api/types.ts';

export const diagram: DiagramDefinition = {
  parser: c4Parser,
  db: c4Db,
  renderer: c4Renderer,
  styles: c4Styles,
  init: (cnf: MermaidConfig) => {
    c4Renderer.setConf(cnf.c4);
  },
};
