import { markerUrl } from './markers';
import { setSiteConfig } from './config';

describe('markers', function () {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    window.location = {
      protocol: 'protocol:',
      host: 'host:port',
      pathname: '/pathname',
      search: '?search',
    };
  });

  afterAll(() => {
    window.location = location;
  });

  describe('#markerUrl', () => {
    it('should return "url(#<name>)" if no parent SVG', function () {
      expect(markerUrl('_', 'foo')).toBe('url(#foo)');
    });

    it('should return "url(#null)" if no name provided', () => {
      expect(markerUrl('_', undefined)).toBe('url(#null)');
      expect(markerUrl('_', null)).toBe('url(#null)');
      expect(markerUrl('_', '')).toBe('url(#null)');
    });

    it('should be configurable for flowchart absolute urls)', () => {
      setSiteConfig({ flowchart: { arrowMarkerAbsolute: false } });
      expect(markerUrl('_', 'foo')).toBe('url(#foo)');

      setSiteConfig({ flowchart: { arrowMarkerAbsolute: true } });
      expect(markerUrl('_', 'foo')).toBe('url(protocol://host:port/pathname?search#foo)');
    });

    it('should be configurable for state diagram absolute urls)', () => {
      setSiteConfig({ state: { arrowMarkerAbsolute: false } });
      expect(markerUrl('_', 'foo')).toBe('url(#foo)');

      setSiteConfig({ state: { arrowMarkerAbsolute: true } });
      expect(markerUrl('_', 'foo')).toBe('url(protocol://host:port/pathname?search#foo)');
    });
  });
});
