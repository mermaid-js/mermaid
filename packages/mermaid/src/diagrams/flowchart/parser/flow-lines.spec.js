import flowDb from '../flowDb.js';
import flow from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Lines] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle line interpolation default definitions', function () {
    flow.parser.parse('graph TD\n' + 'A-->B\n' + 'linkStyle default interpolate basis');

    const edges = flow.parser.yy.getEdges();

    expect(edges.defaultInterpolate).toBe('basis');
  });

  it('should handle line interpolation numbered definitions', function () {
    flow.parser.parse(
      'graph TD\n' +
        'A-->B\n' +
        'A-->C\n' +
        'linkStyle 0 interpolate basis\n' +
        'linkStyle 1 interpolate cardinal'
    );

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('cardinal');
  });

  it('should handle line interpolation non-numbered definitions', function () {
    flow.parser.parse(
      'graph TD\n' +
        'A-->B\n' +
        'linkStyle - interpolate basis\n' +
        'A-->C\n' +
        'linkStyle - interpolate cardinal'
    );

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('cardinal');
  });

  it('should handle line interpolation multi-numbered definitions', function () {
    flow.parser.parse('graph TD\n' + 'A-->B\n' + 'A-->C\n' + 'linkStyle 0,1 interpolate basis');

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('basis');
  });

  it('should handle line interpolation default with style', function () {
    flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'linkStyle default interpolate basis stroke-width:1px;'
    );

    const edges = flow.parser.yy.getEdges();

    expect(edges.defaultInterpolate).toBe('basis');
  });

  it('should handle line interpolation numbered with style', function () {
    flow.parser.parse(
      'graph TD\n' +
        'A-->B\n' +
        'A-->C\n' +
        'linkStyle 0 interpolate basis stroke-width:1px;\n' +
        'linkStyle 1 interpolate cardinal stroke-width:1px;'
    );

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('cardinal');
  });

  it('should handle line interpolation non-numbered with style', function () {
    flow.parser.parse(
      'graph TD\n' +
        'A-->B\n' +
        'linkStyle - interpolate basis stroke-width:1px;\n' +
        'A-->C\n' +
        'linkStyle - interpolate cardinal stroke-width:3px;'
    );

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('cardinal');
    expect(edges[0].style).toMatchInlineSnapshot(`
      [
        "stroke-width:1px",
        "fill:none",
      ]
    `);
    expect(edges[1].style).toMatchInlineSnapshot(`
      [
        "stroke-width:3px",
        "fill:none",
      ]
    `);
  });

  it('should handle non-numbered line style', function () {
    flow.parser.parse(
      'graph TD\n' +
        'A-->B\n' +
        'linkStyle - stroke-width:1px;\n' +
        'A-->C\n' +
        'linkStyle - stroke-width:3px;'
    );

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].style).toMatchInlineSnapshot(`
      [
        "stroke-width:1px",
        "fill:none",
      ]
    `);
    expect(edges[1].style).toMatchInlineSnapshot(`
      [
        "stroke-width:3px",
        "fill:none",
      ]
    `);
  });

  it('should handle line interpolation multi-numbered with style', function () {
    flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'A-->C\n' + 'linkStyle 0,1 interpolate basis stroke-width:1px;'
    );

    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('basis');
  });

  describe('it should handle new line type notation', function () {
    it('should handle regular lines', function () {
      flow.parser.parse('graph TD;A-->B;');

      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('normal');
    });

    it('should handle dotted lines', function () {
      flow.parser.parse('graph TD;A-.->B;');

      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('dotted');
    });

    it('should handle dotted lines', function () {
      flow.parser.parse('graph TD;A==>B;');

      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('thick');
    });
  });
});
