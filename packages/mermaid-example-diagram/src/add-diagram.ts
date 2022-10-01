// @ts-ignore: TODO Fix ts errors
import parser from './parser/exampleDiagram';
import * as db from './exampleDiagramDb';
import renderer from './exampleDiagramRenderer';
import styles from './styles';
import { injectUtils } from './mermaidUtils';

window.mermaid.connectDiagram(
  'example-diagram',
  {
    db,
    renderer,
    parser,
    styles,
  },
  injectUtils
);
