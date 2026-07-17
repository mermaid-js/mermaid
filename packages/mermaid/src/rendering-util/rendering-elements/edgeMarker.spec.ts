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

  describe('with strokeColor', () => {
    const flowchartType = 'flowchart-v2';

    beforeEach(async () => {
      const { select } = await import('d3');
      const insertMarkers = (await import('./markers.js')).default;
      document.body.innerHTML = '<svg id="container"></svg>';
      const containerElement = select(document.getElementById('container'));
      insertMarkers(containerElement, ['point', 'circle', 'cross'], flowchartType, id);
    });

    it('should clone the point marker with the resolved stroke color', () => {
      addEdgeMarkers(
        svgPath,
        { arrowTypeStart: undefined, arrowTypeEnd: 'arrow_point' },
        url,
        id,
        flowchartType,
        false,
        'red'
      );
      const clonedMarker = document.getElementById(`${id}_${flowchartType}-pointEnd_red`);
      expect(clonedMarker).not.toBeNull();
      const path = clonedMarker?.querySelector('path');
      expect(path?.getAttribute('stroke')).toBe('red');
      expect(path?.getAttribute('fill')).toBe('red');
      expect(svgPath.attr).toHaveBeenCalledWith(
        'marker-end',
        `url(${url}#${id}_${flowchartType}-pointEnd_red)`
      );
    });

    it('should clone the cross marker with a colored stroke but no fill', () => {
      addEdgeMarkers(
        svgPath,
        { arrowTypeStart: 'arrow_cross', arrowTypeEnd: undefined },
        url,
        id,
        flowchartType,
        false,
        '#00ff00'
      );
      const clonedMarker = document.getElementById(`${id}_${flowchartType}-crossStart__00ff00`);
      expect(clonedMarker).not.toBeNull();
      const path = clonedMarker?.querySelector('path');
      expect(path?.getAttribute('stroke')).toBe('#00ff00');
      expect(path?.getAttribute('fill')).not.toBe('#00ff00');
      expect(svgPath.attr).toHaveBeenCalledWith(
        'marker-start',
        `url(${url}#${id}_${flowchartType}-crossStart__00ff00)`
      );
    });

    it('should reuse an existing colored marker instead of cloning again', () => {
      const edge = { arrowTypeStart: undefined, arrowTypeEnd: 'arrow_point' };
      addEdgeMarkers(svgPath, edge, url, id, flowchartType, false, 'red');
      addEdgeMarkers(svgPath, edge, url, id, flowchartType, false, 'red');
      const clonedMarkers = document.querySelectorAll(`[id="${id}_${flowchartType}-pointEnd_red"]`);
      expect(clonedMarkers).toHaveLength(1);
    });

    it('should keep the original marker for edges without strokeColor', () => {
      addEdgeMarkers(
        svgPath,
        { arrowTypeStart: undefined, arrowTypeEnd: 'arrow_point' },
        url,
        id,
        flowchartType,
        false,
        undefined
      );
      expect(svgPath.attr).toHaveBeenCalledWith(
        'marker-end',
        `url(${url}#${id}_${flowchartType}-pointEnd)`
      );
    });

    it('should clone the circle marker with the resolved stroke color', () => {
      addEdgeMarkers(
        svgPath,
        { arrowTypeStart: undefined, arrowTypeEnd: 'arrow_circle' },
        url,
        id,
        flowchartType,
        false,
        'blue'
      );
      const clonedMarker = document.getElementById(`${id}_${flowchartType}-circleEnd_blue`);
      expect(clonedMarker).not.toBeNull();
      const shape = clonedMarker?.querySelector('circle');
      expect(shape?.getAttribute('stroke')).toBe('blue');
      expect(svgPath.attr).toHaveBeenCalledWith(
        'marker-end',
        `url(${url}#${id}_${flowchartType}-circleEnd_blue)`
      );
    });

    it('should create distinct clones for differently colored edges without collision', () => {
      const edge = { arrowTypeStart: undefined, arrowTypeEnd: 'arrow_point' };
      addEdgeMarkers(svgPath, edge, url, id, flowchartType, false, 'red');
      addEdgeMarkers(svgPath, edge, url, id, flowchartType, false, 'blue');
      addEdgeMarkers(svgPath, edge, url, id, flowchartType, false, '#00ff00');

      const redMarker = document.getElementById(`${id}_${flowchartType}-pointEnd_red`);
      const blueMarker = document.getElementById(`${id}_${flowchartType}-pointEnd_blue`);
      const greenMarker = document.getElementById(`${id}_${flowchartType}-pointEnd__00ff00`);

      expect(redMarker).not.toBeNull();
      expect(blueMarker).not.toBeNull();
      expect(greenMarker).not.toBeNull();
      expect(redMarker?.id).not.toBe(blueMarker?.id);
      expect(redMarker?.id).not.toBe(greenMarker?.id);
      expect(blueMarker?.id).not.toBe(greenMarker?.id);

      expect(redMarker?.querySelector('path')?.getAttribute('stroke')).toBe('red');
      expect(blueMarker?.querySelector('path')?.getAttribute('stroke')).toBe('blue');
      expect(greenMarker?.querySelector('path')?.getAttribute('stroke')).toBe('#00ff00');

      // exactly one clone per color, no cross-contamination between them
      expect(document.querySelectorAll(`[id^="${id}_${flowchartType}-pointEnd_"]`)).toHaveLength(3);

      expect(svgPath.attr).toHaveBeenCalledWith(
        'marker-end',
        `url(${url}#${id}_${flowchartType}-pointEnd_red)`
      );
      expect(svgPath.attr).toHaveBeenCalledWith(
        'marker-end',
        `url(${url}#${id}_${flowchartType}-pointEnd_blue)`
      );
      expect(svgPath.attr).toHaveBeenCalledWith(
        'marker-end',
        `url(${url}#${id}_${flowchartType}-pointEnd__00ff00)`
      );
    });

    it('should leave the shared default marker untouched (pixel-unchanged) after colored clones are created', () => {
      const originalMarkerId = `${id}_${flowchartType}-pointEnd`;
      const originalPathBefore = document.getElementById(originalMarkerId)?.querySelector('path');
      expect(originalPathBefore?.getAttribute('fill')).toBe('context-stroke');
      expect(originalPathBefore?.getAttribute('stroke')).toBe('context-stroke');

      // Render a colored edge that clones the point marker.
      addEdgeMarkers(
        svgPath,
        { arrowTypeStart: undefined, arrowTypeEnd: 'arrow_point' },
        url,
        id,
        flowchartType,
        false,
        'purple'
      );

      // The shared, unstyled marker definition used by every default-theme
      // edge must still declare context-stroke, unmodified by the clone.
      const originalPathAfter = document.getElementById(originalMarkerId)?.querySelector('path');
      expect(originalPathAfter?.getAttribute('fill')).toBe('context-stroke');
      expect(originalPathAfter?.getAttribute('stroke')).toBe('context-stroke');

      // An edge with no strokeColor still resolves to the untouched original marker.
      addEdgeMarkers(
        svgPath,
        { arrowTypeStart: undefined, arrowTypeEnd: 'arrow_point' },
        url,
        id,
        flowchartType,
        false,
        undefined
      );
      expect(svgPath.attr).toHaveBeenCalledWith('marker-end', `url(${url}#${originalMarkerId})`);
    });
  });
});
