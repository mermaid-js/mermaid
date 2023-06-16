import diagram from './sankey.jison';
import { parser } from './sankey.jison';
import db from '../sankeyDB.js';
// import { fail } from 'assert';

describe('Sankey diagram', function () {
  // TODO - these examples should be put into ./parser/stateDiagram.spec.js
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = db;
      diagram.parser.yy = db;
      diagram.parser.yy.clear();
    });

    it('recognizes its type', () => {
      const str=`sankey`;
      
      parser.parse(str);
    });

    it('recognizes one flow', () => {
      const str = `
      sankey
      a -> 30 -> b -> 20 -> c
      `;
      
      parser.parse(str);
    });
    
    it('recognizes multiple flows', () => {
      const str = `
      sankey
      a -> 30 -> b -> 12 -> e;
      c -> 30 -> d -> 12 -> e;
      c -> 40 -> e -> 12 -> q;
      `;
      
      parser.parse(str);
    });
    
    it('recognizes a separate node with its attributes', () => {
      const str = `
      sankey
      a[]
      b[attr=1]
      c[attr=2]
      d[attrWithoutValue]
      d[attr = 3]
      `;
      
      parser.parse(str);
    });

    // it('recognizes grouped values', () => {
    //   const str = `
    //   sankey
    //   a -> {30} -> b
    //   `;
      
    //   parser.parse(str);
    // });



    // it('recognizes intake group', () => {
    //   const str = `
    //   sankey
    //   a -> {
    //     30 -> b
    //     40 -> c
    //   }
    //   `;
      
    //   parser.parse(str);
    // });

    // it('recognizes exhaust group', () => {
    //   const str = `
    //   sankey
    //   {
    //     b -> 30
    //     c -> 40
    //   } -> a
    //   `;
      
    //   parser.parse(str);
    // });

    // it('what to do?', () => {
    //   const str = `
    //   sankey
    //   {
    //     b -> 30
    //     c -> 40
    //   } -> {
    //     e
    //     d
    //   }
    //   `;
      
    //   parser.parse(str);
    // });

    // it('complex', () => {
    //   const str = `
    //   sankey
    //   {
    //     a -> 30
    //     b -> 40
    //   } -> c -> {
    //     20 -> e -> 49
    //     20 -> d -> 23
    //   } -> k -> 20 -> i -> {
    //     10 -> f
    //     11 -> j
    //   }
    //   `;
      
    //   parser.parse(str);
    // });
  });
});
