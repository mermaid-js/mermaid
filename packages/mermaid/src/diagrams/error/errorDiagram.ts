import { DiagramDefinition } from '../../diagram-api/types';
import styles from './styles';
import renderer from './errorRenderer';
export const diagram: DiagramDefinition = {
  db: {
    clear: () => {
      // Quite ok, clear needs to be there for error to work as a regular diagram
    },
  },
  styles,
  renderer,
  parser: {
    parser: { yy: {} },
    parse: () => {
      // no op
    },
  },
  init: () => {
    // no op
  },
};
