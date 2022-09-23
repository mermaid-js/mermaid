const { select } = jest.requireActual('d3');

import { appendMarker, markerUrl } from './markers';
import { setSiteConfig } from './config';

describe('markers', () => {
  describe('markerUrl()', () => {
    const markerUrlForName = (name) => markerUrl(select('empty'), name);

    it('should use parent SVG element id as a prefix', () => {
      const markerUrlForElement = (id) => markerUrl(select('#' + id), 'marker');

      document.body.innerHTML = `
      <svg id="svg-1">
        <text id="a"/>
        <svg id="svg-2">
          <text id="b"/>
        </svg>
      </svg>
    
      <svg id="svg-3">
        <text id="c"/>
        <svg id="svg-4">
          <text id="d"/>
        </svg>
      </svg>
      
      <text id="e"/>
    `;

      expect(markerUrlForElement('a')).toBe('url(#svg-1-marker)');
      expect(markerUrlForElement('b')).toBe('url(#svg-2-marker)');
      expect(markerUrlForElement('c')).toBe('url(#svg-3-marker)');
      expect(markerUrlForElement('d')).toBe('url(#svg-4-marker)');
      expect(markerUrlForElement('e')).toBe('url(#marker)');
    });

    it('should support absolute urls for flowcharts', () => {
      setSiteConfig({ flowchart: { arrowMarkerAbsolute: true } });
      expect(markerUrlForName('marker')).toBe('url(' + window.location.href + '#marker)');
    });

    it('should support absolute urls for state diagrams', () => {
      setSiteConfig({ state: { arrowMarkerAbsolute: true } });
      expect(markerUrlForName('marker')).toBe('url(' + window.location.href + '#marker)');
    });
  });

  describe('appendMarker()', () => {
    it('should prefix the marker id with the id of its parent SVG', () => {
      document.body.innerHTML = `
      <svg id="svg-1">
        <g>
      </svg>
    `;

      const g = select('g');
      appendMarker(g, 'marker');
      const marker = select('g > defs > marker');

      expect(marker.attr('id')).toBe('svg-1-marker');
    });

    it('should just use the marker name for the id if no parent SVG found', () => {
      document.body.innerHTML = `
        <g>
    `;

      const g = select('g');
      appendMarker(g, 'marker');
      const marker = select('g > defs > marker');

      expect(marker.attr('id')).toBe('marker');
    });
  });
});
