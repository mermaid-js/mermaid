// @ts-ignore: TODO Fix ts errors
import ganttParser from './parser/gantt';
import ganttDb from './ganttDb';
import ganttRenderer from './ganttRenderer';
import ganttStyles from './styles';
import { DiagramDefinition } from '../../diagram-api/types';

export const diagram: DiagramDefinition = {
  parser: ganttParser,
  db: ganttDb,
  renderer: ganttRenderer,
  styles: ganttStyles,
};
