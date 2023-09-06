import { injectUtils } from './mermaidUtils.js';
import parser from './parser.js';
import renderer from './zenumlRenderer.js';

export const diagram = {
  db: {
    clear: () => {
      // no-op
    },
  },
  renderer,
  parser,
  styles: () => {
    // no-op
  },
  injectUtils,
};
