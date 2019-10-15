import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('[Lines] when parsing', () => {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle line interpolation default definitions', function() {
    const res = flow.parser.parse('graph TD\n' + 'A-->B\n' + 'linkStyle default interpolate basis');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.defaultInterpolate).toBe('basis');
  });

  it('should handle line interpolation numbered definitions', function() {
    const res = flow.parser.parse(
      'graph TD\n' +
        'A-->B\n' +
        'A-->C\n' +
        'linkStyle 0 interpolate basis\n' +
        'linkStyle 1 interpolate cardinal'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('cardinal');
  });

  it('should handle line interpolation multi-numbered definitions', function() {
    const res = flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'A-->C\n' + 'linkStyle 0,1 interpolate basis'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('basis');
  });

  it('should handle line interpolation default with style', function() {
    const res = flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'linkStyle default interpolate basis stroke-width:1px;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.defaultInterpolate).toBe('basis');
  });

  it('should handle line interpolation numbered with style', function() {
    const res = flow.parser.parse(
      'graph TD\n' +
        'A-->B\n' +
        'A-->C\n' +
        'linkStyle 0 interpolate basis stroke-width:1px;\n' +
        'linkStyle 1 interpolate cardinal stroke-width:1px;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('cardinal');
  });

  it('should handle line interpolation multi-numbered with style', function() {
    const res = flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'A-->C\n' + 'linkStyle 0,1 interpolate basis stroke-width:1px;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('basis');
  });

  describe('it should handle new line type notation', function() {
    it('it should handle regular lines', function() {
      const res = flow.parser.parse('graph TD;A-->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('normal');
    });

    it('it should handle dotted lines', function() {
      const res = flow.parser.parse('graph TD;A-.->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('dotted');
    });

    it('it should handle dotted lines', function() {
      const res = flow.parser.parse('graph TD;A==>B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('thick');
    });
  });
});
