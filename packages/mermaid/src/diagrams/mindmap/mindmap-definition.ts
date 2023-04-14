// @ts-ignore: TODO Fix ts errors
import mindmapParser from './parser/mindmap.jison';
import * as mindmapDb from './mindmapDb.js';
import mindmapRenderer from './mindmapRenderer.js';
import mindmapStyles from './styles.js';

export const diagram = {
  db: mindmapDb,
  renderer: mindmapRenderer,
  parser: mindmapParser,
  styles: mindmapStyles,
};
