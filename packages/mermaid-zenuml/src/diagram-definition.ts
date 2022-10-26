/* eslint-disable @typescript-eslint/no-empty-function */
import { injectUtils } from './mermaidUtils';
import zenUmlRenderer from './zenumlRenderer';

export const diagram = {
  db: { clear: () => {} },
  renderer: zenUmlRenderer,
  parser: { parser: { parse: () => {} }, parse: () => {} },
  styles: () => {},
  injectUtils,
};
