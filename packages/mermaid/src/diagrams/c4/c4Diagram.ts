// @ts-ignore: TODO Fix ts errors
import c4Parser from './parser/c4Diagram';
import c4Db from './c4Db';
import c4Renderer from './c4Renderer';
import c4Styles from './styles';
import { MermaidConfig } from '../../config.type';

export const diagram = {
  parser: c4Parser,
  db: c4Db,
  renderer: c4Renderer,
  styles: c4Styles,
  init: (cnf: MermaidConfig) => {
    c4Renderer.setConf(cnf.c4);
  },
};
