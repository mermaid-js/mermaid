import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/xychart.jison';
import db from './xychartDb.js';
import renderer from './xychartRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles: () => '',
};
