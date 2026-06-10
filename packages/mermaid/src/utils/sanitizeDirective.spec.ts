import { sanitizeDirective } from './sanitizeDirective.js';

describe('sanitizeDirective', () => {
  describe('icons', () => {
    it('should keep packs and cdnTemplate from diagram text', () => {
      const directive: any = {
        icons: {
          packs: {
            logos: '@iconify-json/logos@1',
            'simple-icons': '@iconify-json/simple-icons@1',
          },
          cdnTemplate: 'https://unpkg.com/${packageSpec}/icons.json',
        },
      };
      sanitizeDirective(directive);
      expect(directive.icons).toEqual({
        packs: {
          logos: '@iconify-json/logos@1',
          'simple-icons': '@iconify-json/simple-icons@1',
        },
        cdnTemplate: 'https://unpkg.com/${packageSpec}/icons.json',
      });
    });

    it('should strip site-only security keys from diagram text', () => {
      const directive: any = {
        icons: {
          packs: { logos: '@iconify-json/logos@1' },
          allowedHosts: ['evil.example.com'],
          maxFileSizeMB: 9999,
          timeout: 999_999,
        },
      };
      sanitizeDirective(directive);
      expect(directive.icons).toEqual({ packs: { logos: '@iconify-json/logos@1' } });
    });

    it('should delete a non-object icons value', () => {
      const directive: any = { icons: 'https://evil.example.com/icons.json' };
      sanitizeDirective(directive);
      expect(directive.icons).toBeUndefined();
    });
  });
});
