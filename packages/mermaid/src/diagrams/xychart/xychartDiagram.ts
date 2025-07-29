import type { DiagramDefinition } from '../../diagram-api/types.js';

import { parser } from './xychartParser.js';
import db from './xychartDb.js';
import renderer from './xychartRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
