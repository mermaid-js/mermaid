// @ts-ignore: TODO Fix ts errors
import parser from '../../mermaid/src/diagrams/flowchart/parser/flow';
import * as db from '../../mermaid/src/diagrams/flowchart/flowDb';
import renderer from './flowRenderer-v3';
import styles from './styles';
import { injectUtils } from './mermaidUtils';

export const diagram = {
  db,
  renderer,
  parser,
  styles,
  injectUtils,
};
