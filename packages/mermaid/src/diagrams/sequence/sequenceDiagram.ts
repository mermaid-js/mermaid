import { DiagramDefinition } from '../../diagram-api/types';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/sequenceDiagram';
import db from './sequenceDb';
import styles from './styles';
import renderer from './sequenceRenderer';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
