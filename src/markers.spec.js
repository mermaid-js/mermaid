// jest.mock('./config');

import { markerUrl } from './markers';

describe('markers', function () {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    window.location = {
      protocol: 'protocol',
      host: 'host',
      location: 'location',
      pathname: 'pathname',
      search: 'search',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    window.location = location;
  });

  it('calls `reload`', () => {
    expect(window.location.host).toBe('host');
  });

  describe('#markerUrl', function () {
    it('should return #<name> if no parent SVG', function () {
      expect(markerUrl('_', 'foo')).toBe('url(#foo)');
    });

    it('should return #null if no name provided', function () {
      expect(markerUrl('_', undefined)).toBe('url(#null)');
      expect(markerUrl('_', null)).toBe('url(#null)');
    });

    it.skip('should support absolute urls (state diagrams)', function () {
      jest.mock('./config', () => {
        return {
          getConfig: jest.fn(() => {
            return {
              state: { arrowMarkerAbsolute: true },
            };
          }),
        };
      });

      expect(markerUrl('_', 'foo')).toBe('url()');
    });
  });
});
