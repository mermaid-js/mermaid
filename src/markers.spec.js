const { select } = jest.requireActual('d3');

import { markerUrl } from './markers';
import { setSiteConfig } from './config';

describe('markers', () => {
  describe('markerUrl()', () => {
    it('should use parent SVG element id as a prefix', () => {
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

      expect(markerUrl(select('#a'), 'A')).toBe('url(#svg-1-A)');
      expect(markerUrl(select('#b'), 'B')).toBe('url(#svg-2-B)');
      expect(markerUrl(select('#c'), 'C')).toBe('url(#svg-3-C)');
      expect(markerUrl(select('#d'), 'D')).toBe('url(#svg-4-D)');
      expect(markerUrl(select('#e'), 'E')).toBe('url(#E)');
    });

    it('should return "url(#null)" if no name provided', () => {
      expect(markerUrl(select('_'), undefined)).toBe('url(#null)');
      expect(markerUrl(select('_'), null)).toBe('url(#null)');
      expect(markerUrl(select('_'), '')).toBe('url(#null)');
    });

    const expectedAbsoluteUrl = () => {
      const location = window.location;
      return location.protocol + '//' + location.host + location.pathname + location.search;
    };

    it('absolute urls should be configurable for flowcharts', () => {
      setSiteConfig({ flowchart: { arrowMarkerAbsolute: true } });
      expect(markerUrl(select('_'), 'foo')).toBe('url(' + expectedAbsoluteUrl() + '#foo)');
    });

    it('absolute urls should be configurable for state diagrams', () => {
      setSiteConfig({ state: { arrowMarkerAbsolute: true } });
      expect(markerUrl(select('_'), 'foo')).toBe('url(' + expectedAbsoluteUrl() + '#foo)');
    });
  });
});
