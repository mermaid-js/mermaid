import type { DiagramDefinition } from '../../diagram-api/types.js';
import { renderer } from './errorRenderer.js';

const diagram: DiagramDefinition = {
  db: {},
  renderer,
  parser: {
    parser: { yy: {} },
    parse: (): void => {
      return;
    },
  },
};

export default diagram;
