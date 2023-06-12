import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/info.jison';
import db from './infoDb.js';
import renderer from './infoRenderer.js';

export const diagram: DiagramDefinition = {
  parser: parser,
  db: db,
  renderer: renderer,
  styles: () => '',
};
