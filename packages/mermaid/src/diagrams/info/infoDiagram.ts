import { DiagramDefinition } from '../../diagram-api/types';
// @ts-ignore: TODO Fix ts errors
import parser from './parser/info';
import db from './infoDb';
import styles from './styles';
import renderer from './infoRenderer';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
