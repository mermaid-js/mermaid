// @ts-ignore: TODO: Fix ts errors
import erParser from './parser/erDiagram.jison';
import erDb from './erDb.js';
import erRenderer from './erRenderer.js';
import erStyles from './styles.js';

export const diagram = {
  parser: erParser,
  db: erDb,
  renderer: erRenderer,
  styles: erStyles,
};
