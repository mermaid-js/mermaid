import flowDb from './flowDb';
import { parser } from './parser/flow';
import flowRenderer from './flowRenderer';
import { addDiagrams } from '../../diagram-api/diagram-orchestration';

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
    it('should handle edges with text', () => {
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

      flowRenderer.addEdges(edges, mockG, diag);
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

      flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should handle open-ended edges', () => {
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

      flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should handle edges with styles defined', () => {
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

      flowRenderer.addEdges(edges, mockG, diag);
    });
    it('should handle edges with interpolation defined', () => {
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

      flowRenderer.addEdges(edges, mockG, diag);
    });
    it('should handle edges with text and styles defined', () => {
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

      flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should set fill to "none" by default when handling edges', () => {
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

      flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should not set fill to none if fill is set in linkStyle', () => {
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

      flowRenderer.addEdges(edges, mockG, diag);
    });
  });
});
