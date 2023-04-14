import { expectTypeOf } from 'vitest';

import { parser } from './parser/stateDiagram.jison';
import stateDb from './stateDb.js';
import stateRendererV2 from './stateRenderer-v2.js';

// Can use this instead of having to register diagrams and load/orchestrate them, etc.
class FauxDiagramObj {
  db = stateDb;
  parser = parser;
  renderer = stateRendererV2;

  constructor(options = { db: stateDb, parser: parser, renderer: stateRendererV2 }) {
    this.db = options.db;
    this.parser = options.parser;
    this.renderer = options.renderer;
    this.parser.yy = this.db;
  }
}

describe('stateRenderer-v2', () => {
  describe('getClasses', () => {
    const diagramText = 'statediagram-v2\n';
    const fauxStateDiagram = new FauxDiagramObj();

    it('returns a {}', () => {
      const result = stateRendererV2.getClasses(diagramText, fauxStateDiagram);
      expectTypeOf(result).toBeObject();
    });
  });
});
