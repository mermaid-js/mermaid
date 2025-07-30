// @ts-ignore: JISON doesn't support types
import ganttParser from './parser/gantt.jison';
import GanttDb from './ganttDb.js';
import ganttRenderer from './ganttRenderer.js';
import ganttStyles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  parser: ganttParser,
  db: new GanttDb(),
  renderer: ganttRenderer,
  styles: ganttStyles,
};
