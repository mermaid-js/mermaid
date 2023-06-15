// @ts-ignore: TODO Fix ts errors
import parser from './parser/exampleDiagram.jison';
import * as db from './exampleDiagramDb.js';
import renderer from './exampleDiagramRenderer.js';
import styles from './styles.js';
import { injectUtils } from './mermaidUtils.js';

export const diagram = {
  db,
  renderer,
  parser,
  styles,
  injectUtils,
};
