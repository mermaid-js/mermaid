// @ts-ignore: TODO: Fix ts errors
import erParser from './parser/erDiagram.jison';
import { ErDB } from './erDb.js';
import * as renderer from './erRenderer-unified.js';
import styles from './styles.js';

export const diagram = {
  parser: erParser,
  get db() {
    return new ErDB();
  },
  capabilities: {
    handDrawn: true,
  },
  renderer,
  styles,
};
