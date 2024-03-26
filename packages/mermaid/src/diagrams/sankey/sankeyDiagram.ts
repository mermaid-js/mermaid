import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './sankeyParser.js';
import { db } from './sankeyDB.js';
import { renderer } from './sankeyRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
