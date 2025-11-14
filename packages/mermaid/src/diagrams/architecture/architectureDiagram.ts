import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './architectureParser.js';
import { ArchitectureDB } from './architectureDb.js';
import styles from './architectureStyles.js';
import { renderer } from './architectureRenderer-unified.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new ArchitectureDB();
  },
  renderer,
  styles,
};
