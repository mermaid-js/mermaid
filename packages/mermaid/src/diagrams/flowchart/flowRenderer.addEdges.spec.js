import flowDb from './flowDb';
import flowParser from './parser/flow';
import flowRenderer from './flowRenderer';
import Diagram from '../../Diagram';
import * as d3 from 'd3';

import { addDiagrams } from '../../diagram-api/diagram-orchestration';
addDiagrams();

describe('when using mermaid and ', function () {
  describe('when calling addEdges ', function () {
    beforeEach(function () {
      flowParser.parser.yy = flowDb;
      flowDb.clear();
      flowDb.setGen('gen-2');
    });
    it('should handle edges with text', function () {
      const diag = new Diagram('graph TD;A-->|text ex|B;');
      diag.db.getVertices();
      const edges = diag.db.getEdges();

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

    it('should handle edges without text', function () {
      const diag = new Diagram('graph TD;A-->B;');
      const edges = diag.db.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('normal');
        },
      };

      flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should handle open-ended edges', function () {
      const diag = new Diagram('graph TD;A---B;');
      diag.db.getVertices();
      const edges = diag.db.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toContain('flowchart-A-');
          expect(end).toContain('flowchart-B-');
          expect(options.arrowhead).toBe('none');
        },
      };

      flowRenderer.addEdges(edges, mockG, diag);
    });

    it('should handle edges with styles defined', function () {
      const diagram = new Diagram('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;');
      const edges = diagram.db.getEdges();

      const mockG = {
        setEdge: function (_, __, options) {
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;');
        },
      };

      flowRenderer.addEdges(edges, mockG, diagram);
    });

    it('should handle edges with interpolation defined', function () {
      const diag = new Diagram('graph TD;A---B; linkStyle 0 interpolate basis');
      diag.db.getVertices();
      const edges = diag.db.getEdges();

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toMatch(/^flowchart-A-\d+$/);
          expect(end).toMatch(/^flowchart-B-\d+$/);
          expect(options.arrowhead).toBe('none');
          expect(options.curve).toBe(d3.curveBasis);
        },
      };

      flowRenderer.addEdges(edges, mockG, diag);
    });
    it('should handle edges with text and styles defined', function () {
      const diag = new Diagram(
        'graph TD;A---|the text|B; linkStyle 0 stroke:val1,stroke-width:val2;'
      );
      diag.db.getVertices();
      const edges = diag.db.getEdges();

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

    it('should set fill to "none" by default when handling edges', function () {
      const diag = new Diagram('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;');
      diag.db.getVertices();
      const edges = diag.db.getEdges();

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

    it('should not set fill to none if fill is set in linkStyle', function () {
      const diag = new Diagram(
        'graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2,fill:blue;'
      );
      diag.db.getVertices();
      const edges = diag.db.getEdges();
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
