const { select } = jest.requireActual('d3');

import { markerUrl } from './markers';
import { setSiteConfig } from './config';

describe('markers', () => {
  describe('markerUrl()', () => {
    const markerUrlForElement = (id) => markerUrl(select('#' + id), id);
    const markerUrlForName = (name) => markerUrl(select('empty'), name);

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

      expect(markerUrlForElement('a')).toBe('url(#svg-1-a)');
      expect(markerUrlForElement('b')).toBe('url(#svg-2-b)');
      expect(markerUrlForElement('c')).toBe('url(#svg-3-c)');
      expect(markerUrlForElement('d')).toBe('url(#svg-4-d)');
      expect(markerUrlForElement('e')).toBe('url(#e)');
    });

    it('should return "url(#null)" if no name provided', () => {
      expect(markerUrlForName(undefined)).toBe('url(#null)');
      expect(markerUrlForName(null)).toBe('url(#null)');
      expect(markerUrlForName('')).toBe('url(#null)');
    });

    it('absolute urls should be configurable for flowcharts', () => {
      setSiteConfig({ flowchart: { arrowMarkerAbsolute: true } });
      expect(markerUrlForName('james')).toBe('url(' + window.location.href + '#james)');
    });

    it('absolute urls should be configurable for state diagrams', () => {
      setSiteConfig({ state: { arrowMarkerAbsolute: true } });
      expect(markerUrlForName('bond')).toBe('url(' + window.location.href + '#bond)');
    });
  });
});
