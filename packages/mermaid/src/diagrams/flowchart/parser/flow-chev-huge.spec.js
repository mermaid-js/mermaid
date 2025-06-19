import { FlowDB } from '../flowDb.js';
import flow from './flowParserAdapter.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Chevrotain Text] when parsing', () => {
  beforeEach(function () {
    flow.yy = new FlowDB();
    flow.yy.clear();
  });

  describe('it should handle huge files', function () {
    // skipped because this test takes like 2 minutes or more!
    it.skip('it should handle huge diagrams', function () {
      const nodes = ('A-->B;B-->A;'.repeat(415) + 'A-->B;').repeat(57) + 'A-->B;B-->A;'.repeat(275);
      flow.parse(`graph LR;${nodes}`);

      const vert = flow.yy.getVertices();
      const edges = flow.yy.getEdges();

      expect(edges[0].type).toBe('arrow_point');
      expect(edges.length).toBe(47917);
      expect(vert.size).toBe(2);
    });
  });
});
