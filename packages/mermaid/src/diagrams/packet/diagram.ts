import type { DiagramDefinition } from '../../diagram-api/types.js';
import { PacketDB } from './db.js';
import { parser } from './parser.js';
import { renderer } from './renderer.js';
import { styles } from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    return new PacketDB();
  },
  renderer,
  styles,
};
