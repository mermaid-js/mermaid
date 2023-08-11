import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/quadrant.jison';
import db from './quadrantDb.js';
import renderer from './quadrantRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles: () => '',
};
