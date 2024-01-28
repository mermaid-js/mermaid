// @ts-ignore: JISON doesn't support types
import mindmapParser from './parser/mindmap.jison';
import * as mindmapDb from './mindmapDb.js';
import mindmapRenderer from './mindmapRenderer.js';
import mindmapStyles from './styles.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

export const diagram: DiagramDefinition = {
  db: mindmapDb,
  renderer: mindmapRenderer,
  parser: mindmapParser,
  styles: mindmapStyles,
};
