/* eslint-disable @typescript-eslint/unbound-method */
import type { SVG } from '../../diagram-api/types.js';
import type { Mocked } from 'vitest';
import { addEdgeMarkers, drawsMarginMarkers, isAnimatedEdge } from './edgeMarker.js';

describe('addEdgeMarker', () => {
  const svgPath = {
    attr: vitest.fn(),
  } as unknown as Mocked<SVG>;
  const url = 'http://example.com';
  const id = 'test';
  const diagramType = 'test';

  beforeEach(() => {
    svgPath.attr.mockReset();
  });

  it('should add markers for arrow_cross:arrow_point', () => {
    const arrowTypeStart = 'arrow_cross';
    const arrowTypeEnd = 'arrow_point';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-crossStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-pointEnd)`
    );
  });

  it('should add markers for aggregation:arrow_point', () => {
    const arrowTypeStart = 'aggregation';
    const arrowTypeEnd = 'arrow_point';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-aggregationStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-pointEnd)`
    );
  });

  it('should add markers for arrow_point:aggregation', () => {
    const arrowTypeStart = 'arrow_point';
    const arrowTypeEnd = 'aggregation';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-pointStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-aggregationEnd)`
    );
  });

  it('should add markers for aggregation:composition', () => {
    const arrowTypeStart = 'aggregation';
    const arrowTypeEnd = 'composition';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-aggregationStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-compositionEnd)`
    );
  });

  it('should add markers for arrow_hollow_circle:arrow_open_head', () => {
    const arrowTypeStart = 'arrow_hollow_circle';
    const arrowTypeEnd = 'arrow_open_head';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-hollowCircleStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-openArrowEnd)`
    );
  });

  it('should draw no marker for the arrow_open a block edge carries as its start type', () => {
    addEdgeMarkers(
      svgPath,
      { arrowTypeStart: 'arrow_open', arrowTypeEnd: 'arrow_point' },
      url,
      id,
      diagramType
    );
    expect(svgPath.attr).not.toHaveBeenCalledWith('marker-start', expect.anything());
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-pointEnd)`
    );
  });

  it('should not add invalid markers', () => {
    const arrowTypeStart = 'this is an invalid marker';
    const arrowTypeEnd = ') url(https://my-malicious-site.example)';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).not.toHaveBeenCalled();
  });
});

describe('isAnimatedEdge', () => {
  it.each([
    ['sets animate', { animate: true }, true],
    ['names an animation speed', { animation: 'slow' as const }, true],
    [
      'takes an animation from a class',
      { cssCompiledStyles: ['stroke: red', 'animation: dash 25s'] },
      true,
    ],
    ['takes only a colour from a class', { cssCompiledStyles: ['stroke: red'] }, false],
    ['sets animate to false', { animate: false }, false],
    ['has no animation at all', {}, false],
  ])('is %s: %s', (_, edge, animated) => {
    expect(isAnimatedEdge(edge)).toBe(animated);
  });
});

describe('drawsMarginMarkers', () => {
  it.each([
    ['a neo edge', { look: 'neo' }, true],
    [
      'a neo edge animated by its class',
      { look: 'neo', cssCompiledStyles: ['animation: dash 25s'] },
      false,
    ],
    ['a neo edge that sets animate', { look: 'neo', animate: true }, false],
    ['a classic edge', { look: 'classic' }, false],
    ['an edge with no look', {}, false],
  ])('is decided for %s', (_, edge, margin) => {
    expect(drawsMarginMarkers(edge)).toBe(margin);
  });
});
