import { FlowDB } from '../flowDb.js';
import flow from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
  maxEdges: 1000, // Increase edge limit for performance testing
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

    // Add a smaller performance test that actually runs for comparison
    it('should handle moderately large diagrams', function () {
      // Create the same diagram as Lezer test for direct comparison
      const nodes = ('A-->B;B-->A;'.repeat(50) + 'A-->B;').repeat(5) + 'A-->B;B-->A;'.repeat(25);
      const input = `graph LR;${nodes}`;

      console.log(`UIO TIMING: JISON parser - Input size: ${input.length} characters`);

      // Measure parsing time
      const startTime = performance.now();
      flow.parser.parse(input);
      const endTime = performance.now();

      const parseTime = endTime - startTime;
      console.log(`UIO TIMING: JISON parser - Parse time: ${parseTime.toFixed(2)}ms`);

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      console.log(
        `UIO TIMING: JISON parser - Result: ${edges.length} edges, ${vert.size} vertices`
      );
      console.log(
        `UIO TIMING: JISON parser - Performance: ${((edges.length / parseTime) * 1000).toFixed(0)} edges/second`
      );

      expect(edges[0].type).toBe('arrow_point');
      expect(edges.length).toBe(555); // Same expected count as Lezer
      expect(vert.size).toBe(2); // Only nodes A and B
    });

    // Add multi-type test for comparison
    it('should handle large diagrams with multiple node types', function () {
      // Create a simpler diagram that focuses on edge creation
      const simpleEdges = 'A-->B;B-->C;C-->D;D-->A;'.repeat(25); // 100 edges total
      const input = `graph TD;${simpleEdges}`;

      console.log(`UIO TIMING: JISON multi-type - Input size: ${input.length} characters`);

      // Measure parsing time
      const startTime = performance.now();
      flow.parser.parse(input);
      const endTime = performance.now();

      const parseTime = endTime - startTime;
      console.log(`UIO TIMING: JISON multi-type - Parse time: ${parseTime.toFixed(2)}ms`);

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      console.log(
        `UIO TIMING: JISON multi-type - Result: ${edges.length} edges, ${vert.size} vertices`
      );
      console.log(
        `UIO TIMING: JISON multi-type - Performance: ${((edges.length / parseTime) * 1000).toFixed(0)} edges/second`
      );

      expect(edges.length).toBe(100); // 4 edges * 25 repeats = 100 edges
      expect(vert.size).toBe(4); // Nodes A, B, C, D
      expect(edges[0].type).toBe('arrow_point');
    });
  });
});
