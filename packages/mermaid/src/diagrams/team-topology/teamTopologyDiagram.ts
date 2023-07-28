import { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: TODO Fix ts errors
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
