import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: JISON doesn't support types.
import parser from './parser/teamTopology.jison';
import db from './teamTopologyDb.js';
import styles from './styles.js';
import renderer from './teamTopologyRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
