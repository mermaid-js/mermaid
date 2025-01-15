import flowDb from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Text] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  describe('it should handle huge files', function () {
    // skipped because this test takes like 2 minutes or more!
    it.skip('it should handlehuge diagrams', function () {
      const nodes = ('A-->B;B-->A;'.repeat(415) + 'A-->B;').repeat(57) + 'A-->B;B-->A;'.repeat(275);
      flow.parser.parse(`graph LR;${nodes}`);

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].type).toBe('arrow_point');
      expect(edges.length).toBe(47917);
      expect(vert.size).toBe(2);
    });
  });
});
