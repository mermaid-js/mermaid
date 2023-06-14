import diagram from './parser/sankey.jison';
import { parser } from './parser/sankey.jison';
import db from './sankeyDB.js';

describe('state diagram V2, ', function () {
  // TODO - these examples should be put into ./parser/stateDiagram.spec.js
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = stateDb;
      diagram.parser.yy = db;
      diagram.parser.yy.clear();
    });

    it('super simple', function () {
      const str = `
      stateDiagram-v2
      [*] --> State1
      State1 --> [*]
      `;

      parser.parse(str);
    });
  });
});
