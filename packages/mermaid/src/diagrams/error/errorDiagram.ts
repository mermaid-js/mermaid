import { DiagramDefinition } from '../../diagram-api/types.js';
import styles from './styles.js';
import renderer from './errorRenderer.js';
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
