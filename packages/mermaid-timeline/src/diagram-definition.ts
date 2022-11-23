// @ts-ignore: TODO Fix ts errors
import parser from './parser/timeline.jison';
import * as db from './timelineDb';
import renderer from './timelineRenderer';
import styles from './styles';
import { injectUtils } from './mermaidUtils';

export const diagram = {
  db,
  renderer,
  parser,
  styles,
  injectUtils,
};
