// @ts-ignore: TODO Fix ts errors
import ganttParser from './parser/gantt.jison';
import ganttDb from './ganttDb.js';
import ganttRenderer from './ganttRenderer.js';
import ganttStyles from './styles.js';
import { DiagramDefinition } from '../../diagram-api/types.ts';

export const diagram: DiagramDefinition = {
  parser: ganttParser,
  db: ganttDb,
  renderer: ganttRenderer,
  styles: ganttStyles,
};
