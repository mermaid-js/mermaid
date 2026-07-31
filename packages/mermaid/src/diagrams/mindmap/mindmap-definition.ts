// @ts-ignore: JISON doesn't support types
import parser from './parser/mindmap.jison';
import { MindmapDB } from './mindmapDb.js';
import renderer from './mindmapRenderer.js';
import styles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  get db() {
    return new MindmapDB();
  },
  renderer,
  parser,
  styles,
};
