import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/block.jison';
import db from './blockDB.js';
import flowStyles from './styles.js';
import renderer from './blockRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles: flowStyles,
};
