import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Text] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  describe('it should handle huge files', function () {
    // skipped because this test takes like 2 minutes or more!
    it.skip('it should handle huge diagrams', function () {
      const nodes = ('A-->B;B-->A;'.repeat(415) + 'A-->B;').repeat(57) + 'A-->B;B-->A;'.repeat(275);
      flow.parser.parse(`graph LR;${nodes}`);

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_point');
      expect(edges.length).toBe(47917);
      expect(vert.size).toBe(2);
    });

    it('should handle a long run of whitespace', function () {
      // The lexer used to emit one SPACE token per whitespace character, which made
      // parsing quadratic in the length of the run: 24 KiB of them took over 5 seconds.
      const run = ' \t\r'.repeat(8_000);
      const text = `graph LR;A-->B;\n${run}`;

      // The invariant behind the fix: the whole run reaches the parser as a single
      // SPACE token instead of one per character. The lexer gets its own FlowDB
      // because the `graph` rules consume `yy.firstGraph()`.
      const { lexer, symbols_ } = flow.parser;
      lexer.setInput(text, new FlowDB());
      const spaces = [];
      for (let token = lexer.lex(); token !== symbols_.EOF; token = lexer.lex()) {
        if (token === symbols_.SPACE) {
          spaces.push(lexer.yytext);
        }
      }
      expect(spaces).toEqual([run]);

      flow.parser.parse(text);

      expect(flow.parser.yy.getEdges().length).toBe(1);
      expect(flow.parser.yy.getVertices().size).toBe(2);
    });

    it('should treat a lone carriage return as whitespace', function () {
      // `\s` used to cover it. The SPACE rule excludes `\n` only, so CR-only line
      // endings keep lexing as whitespace instead of raising an unmatched-input error.
      flow.parser.parse('graph LR;\rA-->B;');

      expect(flow.parser.yy.getEdges().length).toBe(1);
      expect(flow.parser.yy.getVertices().size).toBe(2);
    });
  });
});
