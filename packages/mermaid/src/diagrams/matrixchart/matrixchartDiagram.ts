import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: Jison doesn't support types.
import parser from './parser/matrixchart.jison';
import db from './matrixchartDb.js';
import renderer from './matrixchartRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
