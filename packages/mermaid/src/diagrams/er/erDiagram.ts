// @ts-ignore: TODO Fix ts errors
import erParser from './parser/erDiagram';
import erDb from './erDb';
import erRenderer from './erRenderer';
import erStyles from './styles';

export const diagram = {
  parser: erParser,
  db: erDb,
  renderer: erRenderer,
  styles: erStyles,
};
