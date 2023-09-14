import type { SVG } from '../diagram-api/types.js';
import { addEdgeMarkers } from './edgeMarker.js';

describe('addEdgeMarker', () => {
  const svgPath = {
    attr: vitest.fn(),
  } as unknown as SVG;
  const url = 'http://example.com';
  const id = 'test';
  const diagramType = 'test';

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
});
