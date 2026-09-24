import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './parser/bpmn.chevrotain.js';
import { db } from './bpmnDb.js';
import { renderer } from './bpmnRenderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
