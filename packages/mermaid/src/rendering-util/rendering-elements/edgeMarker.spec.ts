/* eslint-disable @typescript-eslint/unbound-method */
import type { SVG } from '../../diagram-api/types.js';
import type { Mocked } from 'vitest';
import { addEdgeMarkers } from './edgeMarker.js';

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

  it('should not add invalid markers', () => {
    const arrowTypeStart = 'this is an invalid marker';
    const arrowTypeEnd = ') url(https://my-malicious-site.example)';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).not.toHaveBeenCalled();
  });
});
