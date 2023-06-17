import diagram from './sankey.jison';
import { parser } from './sankey.jison';
import db from '../sankeyDB.js';

describe('Sankey diagram', function () {
  // TODO - these examples should be put into ./parser/stateDiagram.spec.js
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = db;
      diagram.parser.yy = db;
      diagram.parser.yy.clear();
    });

    it('recognized its type', function() {
      const str=`sankey`;
      
      parser.parse(str);
    });

    // it('one simple flow', function () {
    //   const str = `
    //   sankey
    //   a -> 30 -> b
    //   `;

    //   parser.parse(str);
    // });

    // it('multiple flows', function () {
    //   const str = `
    //   sankey
    //   a -> 30 -> b
    //   c -> 30 -> d
    //   c -> 40 -> e
    //   `;

    //   parser.parse(str);
    // });

    // it('multiple flows', function () {
    //   const str = `
    //   sankey
    //   a -> 30 -> b
    //   c -> 30 -> d
    //   `;

    //   parser.parse(str);
    // });
  });
});
