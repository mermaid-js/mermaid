// @ts-ignore: TODO Fix ts errors
import gitGraphParser from './parser/gitGraph';
import gitGraphDb from './gitGraphAst';
import gitGraphRenderer from './gitGraphRenderer';
import gitGraphStyles from './styles';
import { DiagramDefinition } from '../../diagram-api/types';

export const diagram: DiagramDefinition = {
  parser: gitGraphParser,
  db: gitGraphDb,
  renderer: gitGraphRenderer,
  styles: gitGraphStyles,
};
