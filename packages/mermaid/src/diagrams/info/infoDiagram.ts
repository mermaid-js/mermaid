import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore jison doesn't export types
import parser from './parser/info.jison';
import db from './infoDb.js';
import renderer from './infoRenderer.js';

export const diagram: DiagramDefinition = {
  parser: parser,
  db: db,
  renderer: renderer,
  styles: () => '',
};
