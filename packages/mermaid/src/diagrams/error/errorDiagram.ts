import type { DiagramDefinition } from '../../diagram-api/types.js';
import { renderer } from './errorRenderer.js';

export const diagram: DiagramDefinition = {
  db: {},
  renderer,
  parser: {
    parser: { yy: {} },
    parse: (): void => {
      return;
    },
  },
};
