// cspell:ignore usecase usecases usecasediagram
import type { DiagramDefinition } from '../../diagram-api/types.js';
import type { UseCaseDB } from './usecaseDb.js';
import db from './usecaseDb.js';
import renderer from './usecaseRenderer.js';
import styles from './usecaseStyles.js';

const ucDb = db as UseCaseDB;

const parser = {
  parse: (text: string): void => {
    ucDb.clear();
    ucDb.parseDiagram(text);
  },
  yy: ucDb,
};

export const diagram: DiagramDefinition = {
  db,
  renderer,
  parser,
  styles,
};
