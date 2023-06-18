// @ts-ignore: TODO Fix ts errors
import parser from './parser/timeline.jison';
import * as db from './timelineDb.js';
import renderer from './timelineRenderer.js';
import styles from './styles.js';

export const diagram = {
  db,
  renderer,
  parser,
  styles,
};
