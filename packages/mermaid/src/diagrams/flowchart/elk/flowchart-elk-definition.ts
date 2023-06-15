// @ts-ignore: JISON typing missing
import parser from '../parser/flow.jison';

import * as db from '../flowDb.js';
import renderer from './flowRenderer-elk.js';
import styles from './styles.js';

export const diagram = {
  db,
  renderer,
  parser,
  styles,
};
