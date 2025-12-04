import type { IconifyJSON } from '@iconify/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MermaidConfig } from '../config.type.js';
import {
  clearIconPacks,
  getIconSVG,
  isIconAvailable,
  registerDiagramIconPacks,
  registerIconPacks,
  validatePackageVersion,
} from './icons.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Icons Loading', () => {
  // Mock objects for reuse
  const mockIcons: IconifyJSON = {
    prefix: 'test',
    icons: {
      'test-icon': {
        body: '<path d="M0 0h24v24H0z"/>',
        width: 24,
        height: 24,
      },
    },
  };

  const mockIconsWithMultipleIcons: IconifyJSON = {
    prefix: 'test',
    icons: {
      'test-icon': {
        body: '<path d="M0 0h24v24H0z"/>',
        width: 24,
        height: 24,
      },
      'another-icon': {
        body: '<path d="M12 12h12v12H12z"/>',
        width: 24,
        height: 24,
      },
    },
  };

  const mockFetchResponse = {
    ok: true,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') {
          return 'application/json';
        }
        if (name === 'content-length') {
          return '1024';
        }
        return null;
      },
    },
    json: () => Promise.resolve(mockIcons),
  };

  const mockFetchResponseLarge = {
    ok: true,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') {
          return 'application/json';
        }
        if (name === 'content-length') {
          return '10485760'; // 10MB
        }
        return null;
      },
    },
    json: () => Promise.resolve({}),
  };

  const mockFetchResponseWrongContentType = {
    ok: true,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') {
          return 'text/html';
        }
        return null;
      },
    },
    json: () => Promise.resolve({}),
  };

  const mockFetchResponseInvalidJson = {
    ok: true,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') {
          return 'application/json';
        }
        return null;
      },
    },
    json: () => Promise.resolve({}), // Missing prefix and icons
  };

  const mockFetchResponseHttpError = {
    ok: false,
    status: 404,
    statusText: 'Not Found',
  };

  const mockGlobalIcons: IconifyJSON = {
    prefix: 'global',
    icons: {
      'global-icon': {
        body: '<path d="M0 0h24v24H0z"/>',
        width: 24,
        height: 24,
      },
    },
  };

  const mockEphemeralIcons: IconifyJSON = {
    prefix: 'ephemeral',
    icons: {
      'ephemeral-icon': {
        body: '<path d="M0 0h24v24H0z"/>',
        width: 24,
        height: 24,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear icon manager state between tests
    clearIconPacks();
  });

  describe('validatePackageVersion', () => {
    const validPackages = [
      'package@1',
      'package@1.2.3',
      '@scope/package@1',
      '@scope/package@1.2.3',
      'package@1.0.0-alpha.1',
      'package@1.0.0+build.1',
      '@iconify-json/my-icons-package@2.1.0',
      '@scope@weird/package@1.0.0', // edge case: multiple @ symbols
    ];

    const invalidPackages = [
      'package', // no @
      '@scope/package', // scoped without version
      'package@', // empty version
      '@scope/package@', // scoped empty version
      'package@   ', // whitespace version
      '', // empty string
      '@', // just @
      '@scope@weird/package@', // multiple @ with empty version
    ];

    it.each(validPackages)('should accept "%s"', (packageName) => {
      expect(() => validatePackageVersion(packageName)).not.toThrow();
    });

    it.each(invalidPackages)('should reject "%s"', (packageName) => {
      expect(() => validatePackageVersion(packageName)).toThrow(
        /must include at least a major version/
      );
    });
  });

  describe('registerIconPacks', () => {
    it('should register sync icon packs', () => {
      const iconLoaders = [
        {
          name: 'test',
          icons: mockIcons,
        },
      ];

      expect(() => registerIconPacks(iconLoaders)).not.toThrow();
    });

    it('should register async icon packs', () => {
      const iconLoaders = [
        {
          name: 'test',
          loader: () => Promise.resolve(mockIcons),
        },
      ];

      expect(() => registerIconPacks(iconLoaders)).not.toThrow();
    });

    it('should throw error for invalid icon loaders', () => {
      expect(() => registerIconPacks([{ name: '', icons: {} as IconifyJSON }])).toThrow(
        'Invalid icon loader. Must have a "name" property with non-empty string value.'
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => registerIconPacks([{} as unknown as any])).toThrow(
        'Invalid icon loader. Must have a "name" property with non-empty string value.'
      );
    });
  });

  describe('isIconAvailable', () => {
    it('should return true for available icons', async () => {
      registerIconPacks([
        {
          name: 'test',
          icons: mockIcons,
        },
      ]);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(true);
    });

    it('should return false for unavailable icons', async () => {
      const available = await isIconAvailable('nonexistent:icon');
      expect(available).toBe(false);
    });
  });

  describe('getIconSVG', () => {
    it('should return SVG for available icons', async () => {
      registerIconPacks([
        {
          name: 'test',
          icons: mockIcons,
        },
      ]);

      const svg = await getIconSVG('test:test-icon');
      expect(svg).toContain('<svg');
      expect(svg).toContain('<path d="M0 0h24v24H0z"></path>');
    });

    it('should return unknown icon SVG for unavailable icons', async () => {
      const svg = await getIconSVG('nonexistent:icon');
      expect(svg).toContain('<svg');
      expect(svg).toContain('?'); // unknown icon contains a question mark
    });

    it('should apply customisations', async () => {
      registerIconPacks([
        {
          name: 'test',
          icons: mockIcons,
        },
      ]);

      const svg = await getIconSVG('test:test-icon', { width: 32, height: 32 });
      expect(svg).toContain('width="32"');
      expect(svg).toContain('height="32"');
    });
  });

  describe('registerDiagramIconPacks', () => {
    beforeEach(() => {
      // Reset fetch mock
      mockFetch.mockClear();
    });

    it('should register icon packs from config', () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          logos: '@iconify-json/logos@1',
        },
        cdnTemplate: 'https://cdn.jsdelivr.net/npm/${packageSpec}/icons.json',
        maxFileSizeMB: 5,
        timeout: 5000,
        allowedHosts: ['cdn.jsdelivr.net'],
      };

      expect(() => registerDiagramIconPacks(config)).not.toThrow();
    });

    it('should handle empty config', () => {
      expect(() => registerDiagramIconPacks({})).not.toThrow();
      expect(() => registerDiagramIconPacks(undefined)).not.toThrow();
    });

    it('should throw error for invalid package specs', () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          invalid: 'invalid-package-spec',
        },
      };

      expect(() => registerDiagramIconPacks(config)).toThrow(
        "Package name 'invalid-package-spec' must include at least a major version"
      );
    });

    it('should throw error for direct URLs', () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          direct: 'https://example.com/icons.json',
        },
      };

      expect(() => registerDiagramIconPacks(config)).toThrow(
        "Invalid icon pack configuration for 'direct': Direct URLs are not allowed."
      );
    });

    it('should throw error for invalid CDN template', () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          logos: '@iconify-json/logos@1',
        },
        cdnTemplate: 'https://example.com/package.json', // missing ${packageSpec}
      };

      expect(() => registerDiagramIconPacks(config)).toThrow(
        'CDN template must contain ${packageSpec} placeholder'
      );
    });

    it('should throw error for disallowed hosts', () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          logos: '@iconify-json/logos@1',
        },
        cdnTemplate: 'https://malicious.com/${packageSpec}/icons.json',
        allowedHosts: ['cdn.jsdelivr.net'],
      };

      expect(() => registerDiagramIconPacks(config)).toThrow(
        "Host 'malicious.com' is not in the allowed hosts list"
      );
    });
  });

  describe('Network fetching', () => {
    it('should handle successful fetch', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse);

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
      };

      registerDiagramIconPacks(config);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(true);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
      };

      registerDiagramIconPacks(config);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(false);
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponseHttpError);

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
      };

      registerDiagramIconPacks(config);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(false);
    });

    it('should handle invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'content-type') {
              return 'application/json';
            }
            return null;
          },
        },
        json: () => Promise.reject(new SyntaxError('Invalid JSON')),
      });

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
      };

      registerDiagramIconPacks(config);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(false);
    });

    it('should handle wrong content type', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponseWrongContentType);

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
      };

      registerDiagramIconPacks(config);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(false);
    });

    it('should handle file size limits', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponseLarge);

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
        maxFileSizeMB: 5,
      };

      registerDiagramIconPacks(config);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(false);
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('AbortError')), 100))
      );

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
        timeout: 50,
      };

      registerDiagramIconPacks(config);

      // Wait for async loading
      await new Promise((resolve) => setTimeout(resolve, 200));

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(false);
    });

    it('should validate Iconify format', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponseInvalidJson);

      const config: MermaidConfig['icons'] = {
        packs: {
          test: '@test/icons@1',
        },
      };

      registerDiagramIconPacks(config);

      const available = await isIconAvailable('test:test-icon');
      expect(available).toBe(false);
    });
  });

  describe('Configuration defaults', () => {
    it('should use default CDN template', () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          logos: '@iconify-json/logos@1',
        },
      };

      expect(() => registerDiagramIconPacks(config)).not.toThrow();
    });

    it('should use default allowed hosts', () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          logos: '@iconify-json/logos@1',
        },
        cdnTemplate: 'https://cdn.jsdelivr.net/npm/${packageSpec}/icons.json',
      };

      expect(() => registerDiagramIconPacks(config)).not.toThrow();
    });

    it('should use custom CDN template', async () => {
      const config: MermaidConfig['icons'] = {
        packs: {
          logos: '@iconify-json/logos@1',
        },
        cdnTemplate: 'https://unpkg.com/${packageSpec}/icons.json',
        allowedHosts: ['unpkg.com'],
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse);

      expect(() => registerDiagramIconPacks(config)).not.toThrow();

      // Trigger lazy loading by checking for an icon
      await isIconAvailable('logos:some-icon');

      // Verify that fetch was called with the correct unpkg URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://unpkg.com/@iconify-json/logos@1/icons.json',
        expect.any(Object)
      );
    });
  });

  describe('Ephemeral vs Global icon managers', () => {
    it('should prioritize ephemeral icon manager', async () => {
      // Register global icons
      registerIconPacks([
        {
          name: 'global',
          icons: mockGlobalIcons,
        },
      ]);

      // Register ephemeral icons
      registerDiagramIconPacks({
        packs: {
          ephemeral: '@ephemeral/icons@1',
        },
      });

      // Mock fetch for ephemeral icons
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'content-type') {
              return 'application/json';
            }
            return null;
          },
        },
        json: () => Promise.resolve(mockEphemeralIcons),
      });

      // Both should be available
      expect(await isIconAvailable('global:global-icon')).toBe(true);
      expect(await isIconAvailable('ephemeral:ephemeral-icon')).toBe(true);
    });
  });
});
