import { markerId, markerUrl } from './markers';

describe('Markers', () => {
  describe('markerId()', () => {
    it('should include current theme, diagram type and marker name', () => {
      expect(markerId('diagram', 'name')).toBe('default-diagram-name');
    });
  });

  describe('markerUrl()', () => {
    it('should include current theme, diagram type and marker name', () => {
      expect(markerUrl('diagram', 'name')).toBe('url(#default-diagram-name)');
    });

    it('should support absolute marker urls', () => {
      expect(markerUrl('diagram', 'name')).toBe('url(#default-diagram-name)');
    });
  });
});
