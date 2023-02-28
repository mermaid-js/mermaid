// @ts-ignore: JISON typing missing
import parser from '../parser/flow';

import * as db from '../flowDb';
import renderer from './flowRenderer-elk';
import styles from './styles';

export const diagram = {
  db,
  renderer,
  parser,
  styles,
};
