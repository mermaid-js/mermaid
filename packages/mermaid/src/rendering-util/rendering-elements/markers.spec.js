import { describe, it, expect, beforeEach } from 'vitest';
import { select } from 'd3';
import insertMarkers from './markers.js';

const diagramType = 'flowchart-v2';
const id = 'graph';

/**
 * The flowchart arrow markers declare `context-stroke` so that browsers that
 * support it (Chromium 119+, Firefox, Edge) paint the arrow head with the
 * stroke color of the edge that references the marker, including colors that
 * only exist in CSS (user stylesheets, themes). Browsers without support
 * (Safari) ignore the invalid paint value and fall back to the inherited
 * `.marker` theme color, and explicitly styled edges are still covered by the
 * per-edge colored marker clones created in edgeMarker.ts.
 */
describe('flowchart markers', () => {
  beforeEach(() => {
    document.body.innerHTML = '<svg id="container"></svg>';
    const svg = select(document.getElementById('container'));
    insertMarkers(svg, ['point', 'circle', 'cross'], diagramType, id);
  });

  it.each(['pointEnd', 'pointStart', 'pointEnd-margin', 'pointStart-margin'])(
    'point marker %s should inherit the edge stroke for both fill and stroke',
    (markerName) => {
      const marker = document.getElementById(`${id}_${diagramType}-${markerName}`);
      expect(marker).not.toBeNull();
      const shape = marker.querySelector('path, polygon');
      expect(shape.getAttribute('fill')).toBe('context-stroke');
      expect(shape.getAttribute('stroke')).toBe('context-stroke');
    }
  );

  it.each(['circleEnd', 'circleStart', 'circleEnd-margin', 'circleStart-margin'])(
    'circle marker %s should inherit the edge stroke',
    (markerName) => {
      const marker = document.getElementById(`${id}_${diagramType}-${markerName}`);
      expect(marker).not.toBeNull();
      const shape = marker.querySelector('circle');
      expect(shape.getAttribute('stroke')).toBe('context-stroke');
    }
  );

  it.each(['crossEnd', 'crossStart', 'crossEnd-margin', 'crossStart-margin'])(
    'cross marker %s should inherit the edge stroke',
    (markerName) => {
      const marker = document.getElementById(`${id}_${diagramType}-${markerName}`);
      expect(marker).not.toBeNull();
      const shape = marker.querySelector('path');
      expect(shape.getAttribute('stroke')).toBe('context-stroke');
    }
  );
});
