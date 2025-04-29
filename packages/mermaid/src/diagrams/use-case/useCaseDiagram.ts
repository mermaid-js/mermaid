import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './useCaseParser.js';
import { db } from './useCaseDb.js';
import styles from './useCaseStyles.js';
import { renderer } from './useCaseRenderer.js';

// console.log('[useCaseDiagram] loaded');

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
