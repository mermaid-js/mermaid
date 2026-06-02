// cspell:ignore usecase usecases usecasediagram usecaserenderer collab collabs colour bbox
import type { DiagramDefinition } from '../../diagram-api/types.js';
import db from './usecaseDb.js';
import { parser } from './parser.js';
import renderer from './usecaseRenderer.js';
import styles from './usecaseStyles.js';

export const diagram: DiagramDefinition = {
  db,
  renderer,
  parser,
  styles,
};
