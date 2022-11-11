/* eslint-disable @typescript-eslint/no-empty-function */
import { injectUtils } from './mermaidUtils';
import parser from './parser';
import db from './db';
import renderer from './zenumlRenderer';

export const diagram = {
  db,
  renderer,
  parser,
  styles: () => {},
  injectUtils,
};
