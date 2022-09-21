// jest.mock('./config');

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    window.location = location;
  });

  describe('#markerUrl', function () {
    it('should return #<name> if no parent SVG', function () {
      expect(markerUrl('_', 'foo')).toBe('url(#foo)');
    });

    it('should return #null if no name provided', function () {
      expect(markerUrl('_', undefined)).toBe('url(#null)');
      expect(markerUrl('_', null)).toBe('url(#null)');
      expect(markerUrl('_', '')).toBe('url(#null)');
    });

    it('should support absolute urls for state diagrams)', function () {
      setSiteConfig({ state: { arrowMarkerAbsolute: true } });

      expect(markerUrl('_', 'foo')).toBe('url(protocol://host:port/pathname?search#foo)');
    });

    it('should support absolute urls for state diagrams)', function () {
      setSiteConfig({ state: { arrowMarkerAbsolute: true } });

      expect(markerUrl('_', 'foo')).toBe('url(protocol://host:port/pathname?search#foo)');
    });
  });
});
