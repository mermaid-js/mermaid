import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON parser lacks type declarations
import parser from './wardleyParser.js';
import db from './wardleyDb.js';
import renderer from './wardleyRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles: () => '',
};
