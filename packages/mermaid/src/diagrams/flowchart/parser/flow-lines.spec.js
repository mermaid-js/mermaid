import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Lines] when parsing', () => {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  it('should handle line interpolation default definitions', function () {
    const res = flow.parser.parse('graph TD\n' + 'A-->B\n' + 'linkStyle default interpolate basis');

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.defaultInterpolate).toBe('basis');
  });

  it('should handle line interpolation numbered definitions', function () {
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

  it('should handle edge curve properties using edge ID', function () {
    const res = flow.parser.parse(
      'graph TD\n' +
        'A e1@-->B\n' +
        'A uniqueName@-->C\n' +
        'e1@{curve: basis}\n' +
        'uniqueName@{curve: cardinal}'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('cardinal');
  });

  it('should handle edge curve properties using edge ID but without overriding default', function () {
    const res = flow.parser.parse(
      'graph TD\n' +
        'A e1@-->B\n' +
        'A-->C\n' +
        'linkStyle default interpolate linear\n' +
        'e1@{curve: stepAfter}'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('stepAfter');
    expect(edges.defaultInterpolate).toBe('linear');
  });

  it('should handle edge curve properties using edge ID mixed with line interpolation', function () {
    const res = flow.parser.parse(
      'graph TD\n' +
        'A e1@-->B-->D\n' +
        'A-->C e4@-->D-->E\n' +
        'linkStyle default interpolate linear\n' +
        'linkStyle 1 interpolate basis\n' +
        'e1@{curve: monotoneX}\n' +
        'e4@{curve: stepBefore}'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('monotoneX');
    expect(edges[1].interpolate).toBe('basis');
    expect(edges.defaultInterpolate).toBe('linear');
    expect(edges[3].interpolate).toBe('stepBefore');
    expect(edges.defaultInterpolate).toBe('linear');
  });

  it('should handle line interpolation multi-numbered definitions', function () {
    const res = flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'A-->C\n' + 'linkStyle 0,1 interpolate basis'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('basis');
  });

  it('should handle line interpolation default with style', function () {
    const res = flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'linkStyle default interpolate basis stroke-width:1px;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges.defaultInterpolate).toBe('basis');
  });

  it('should handle line interpolation numbered with style', function () {
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

  it('should handle line interpolation multi-numbered with style', function () {
    const res = flow.parser.parse(
      'graph TD\n' + 'A-->B\n' + 'A-->C\n' + 'linkStyle 0,1 interpolate basis stroke-width:1px;'
    );

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(edges[0].interpolate).toBe('basis');
    expect(edges[1].interpolate).toBe('basis');
  });

  describe('it should handle new line type notation', function () {
    it('should handle regular lines', function () {
      const res = flow.parser.parse('graph TD;A-->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('normal');
    });

    it('should handle dotted lines', function () {
      const res = flow.parser.parse('graph TD;A-.->B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('dotted');
    });

    it('should handle dotted lines', function () {
      const res = flow.parser.parse('graph TD;A==>B;');

      const vert = flow.parser.yy.getVertices();
      const edges = flow.parser.yy.getEdges();

      expect(edges[0].stroke).toBe('thick');
    });
  });
});
