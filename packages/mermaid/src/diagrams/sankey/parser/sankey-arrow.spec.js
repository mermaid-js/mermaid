import diagram from './sankey-arrow.jison';
import { parser } from './sankey-arrow.jison';
import db from '../sankeyDB.js';
// import { fail } from 'assert';

describe('sankey-beta diagram', function () {
  // TODO - these examples should be put into ./parser/stateDiagram.spec.js
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = db;
      diagram.parser.yy = db;
      diagram.parser.yy.clear();
    });

    it('recognizes its type', () => {
      const str = `sankey-beta`;

      parser.parse(str);
    });

    it('recognizes one flow', () => {
      const str = `
      sankey-beta
      node_a -> 30 -> node_b -> 20 -> node_c
      `;

      parser.parse(str);
    });

    it('recognizes multiple flows', () => {
      const str = `
      sankey-beta
      node_a -> 30 -> node_b -> 12 -> node_e
      node_c -> 30 -> node_d -> 12 -> node_e
      node_c -> 40 -> node_e -> 12 -> node_q
      `;

      parser.parse(str);
    });

    it('parses node as a string', () => {
      const str = `
      sankey-beta
      "node a" -> 30 -> "node b" -> 12 -> "node e"
      "node c" -> 30 -> "node d" -> 12 -> "node e"
      "node c" -> 40 -> "node e" -> 12 -> "node q"
      `;

      parser.parse(str);
    });

    describe('while attributes parsing', () => {
      it('recognized node and attribute ids starting with numbers', () => {
        const str = `
        sankey-beta
        1st -> 200 -> 2nd -> 180 -> 3rd;
        `;

        parser.parse(str);
      });

      it('parses different quotless variations', () => {
        const str = `
        sankey-beta
        node[]
        
        node[attr=1]
        node_a -> 30 -> node_b
        node[attrWithoutValue]
        node[attr = 3]
        node[attr1 = 23413 attr2=1234]
        node[x1dfqowie attr1 = 23413 attr2]
        `;

        parser.parse(str);
      });

      it('parses strings as values', () => {
        const str = `
        sankey-beta
        node[title="hello, how are you?"]
        node[title="hello, mister \\"sankey-beta\\", backslash for you \\\\"]
        `;

        parser.parse(str);
      });

      it('parses real example', () => {
        const str = `
        sankey-beta

        "Agricultural 'waste'"      ->      124.729  -> "Bio-conversion"
        "Bio-conversion"            ->      0.597    -> "Liquid"
        "Bio-conversion"            ->      26.862   -> "Losses"
        "Bio-conversion"            ->      280.322  -> "Solid"
        "Bio-conversion"            ->      81.144   -> "Gas"
        "Biofuel imports"           ->      35       -> "Liquid"
        `;

        parser.parse(str);
      });
    });
  });
});
