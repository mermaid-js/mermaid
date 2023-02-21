import { DiagramDefinition } from '../../diagram-api/types';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/requirementDiagram';
import db from './requirementDb';
import styles from './styles';
import renderer from './requirementRenderer';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
