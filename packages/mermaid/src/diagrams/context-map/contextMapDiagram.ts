import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './contextMapParser.js';
import db from './contextMapDb.js';
import { renderer } from './contextMapRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
