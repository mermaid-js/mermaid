// @ts-ignore: JISON typing missing
import parser from '../../mermaid/src/diagrams/flowchart/parser/flow.jison';
import db from '../../mermaid/src/diagrams/flowchart/flowDb.js';
import styles from '../../mermaid/src/diagrams/flowchart/styles.js';
import renderer from './flowRenderer-elk.js';

export const diagram = {
  db,
  renderer,
  parser,
  styles,
};
