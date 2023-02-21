import { DiagramDefinition } from '../../diagram-api/types';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/pie';
import db from './pieDb';
import styles from './styles';
import renderer from './pieRenderer';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
