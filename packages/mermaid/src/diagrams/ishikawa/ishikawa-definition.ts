// @ts-ignore: JISON doesn't support types
import parser from './parser/ishikawa.jison';
import { IshikawaDB } from './ishikawaDb.js';
import renderer from './ishikawaRenderer.js';
import styles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new IshikawaDB();
  },
  renderer,
  styles,
};
