import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: jison doesn't export types
import parser from './parser/venn.jison';
import { db } from './vennDB.js';
import flowStyles from './styles.js';
import { renderer } from './vennRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles: flowStyles,
};
