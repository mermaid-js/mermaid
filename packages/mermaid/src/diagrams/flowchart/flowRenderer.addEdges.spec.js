import flowDb from './flowDb.js';
import { parser } from './parser/flow.jison';
import flowRenderer from './flowRenderer.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';

const diag = {
  db: flowDb,
};
addDiagrams();

describe('when using mermaid and ', function () {
  describe('when calling addEdges ', function () {
    beforeEach(function () {
      parser.yy = flowDb;
      flowDb.clear();
      flowDb.setGen('gen-2');
    });
    it('should handle edges with text', async () => {
      parser.parse('graph TD;A-->|text ex|B;');
      flowDb.getVertices();
      const edges = flowDb.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('normal');
          expect(options.label.match('text ex')).toBeTruthy();
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should handle edges without text', async function () {
      parser.parse('graph TD;A-->B;');
      flowDb.getVertices();
      const edges = flowDb.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('normal');
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should handle open-ended edges', async () => {
      parser.parse('graph TD;A---B;');
      flowDb.getVertices();
      const edges = flowDb.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('none');
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should handle edges with styles defined', async () => {
      parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;');
      flowDb.getVertices();
      const edges = flowDb.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('none');
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;');
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });
    it('should handle edges with interpolation defined', async () => {
      parser.parse('graph TD;A---B; linkStyle 0 interpolate basis');
      flowDb.getVertices();
      const edges = flowDb.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('none');
          expect(options.curve).toBe('basis'); // mocked as string
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });
    it('should handle edges with text and styles defined', async () => {
      parser.parse('graph TD;A---|the text|B; linkStyle 0 stroke:val1,stroke-width:val2;');
      flowDb.getVertices();
      const edges = flowDb.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('none');
          expect(options.label.match('the text')).toBeTruthy();
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;');
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should set fill to "none" by default when handling edges', async () => {
      parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;');
      flowDb.getVertices();
      const edges = flowDb.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B');
          expect(options.arrowhead).toBe('none');
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;');
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should not set fill to none if fill is set in linkStyle', async () => {
      parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2,fill:blue;');
      flowDb.getVertices();
      const edges = flowDb.getEdges();
      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('none');
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:blue;');
        },
      };

      await flowRenderer.addEdges(edges, mockG, diag);
    });
  });
});
