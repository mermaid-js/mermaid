import { describe, expect, it } from 'vitest';
import { sanitizeDirective } from './sanitizeDirective.js';

describe('sanitizeDirective', () => {
  it('deletes keys that are not known config keys', () => {
    const args = { fontSize: 12, notAConfigKey: 'x' };
    sanitizeDirective(args);
    expect(args).toEqual({ fontSize: 12 });
  });

  describe('theme variables only the default theme is missing', () => {
    it('keeps treeView theme variables that only the default theme lacked', () => {
      const args = {
        themeVariables: {
          treeView: {
            iconColor: '#ff0000',
            descriptionColor: '#ff0000',
            highlightBg: '#ff0000',
            highlightStroke: '#ff0000',
          },
        },
      };
      sanitizeDirective(args);
      expect(args.themeVariables.treeView).toEqual({
        iconColor: '#ff0000',
        descriptionColor: '#ff0000',
        highlightBg: '#ff0000',
        highlightStroke: '#ff0000',
      });
    });

    it('keeps packet theme variables that only the default theme lacked', () => {
      const args = {
        themeVariables: {
          packet: {
            startByteColor: '#ff0000',
            endByteColor: '#ff0000',
            blockStrokeColor: '#ff0000',
            blockFillColor: '#ff0000',
          },
        },
      };
      sanitizeDirective(args);
      expect(args.themeVariables.packet).toEqual({
        startByteColor: '#ff0000',
        endByteColor: '#ff0000',
        blockStrokeColor: '#ff0000',
        blockFillColor: '#ff0000',
      });
    });

    it('keeps stateBorder and commitLineColor, only defined by the redux themes', () => {
      const args = {
        themeVariables: {
          stateBorder: '#ff0000',
          commitLineColor: '#ff0000',
        },
      };
      sanitizeDirective(args);
      expect(args.themeVariables).toEqual({
        stateBorder: '#ff0000',
        commitLineColor: '#ff0000',
      });
    });

    it('blanks out hostile values nested under treeView and packet, same as top-level theme variables', () => {
      const args = {
        themeVariables: {
          primaryColor: 'url(javascript:alert(1))',
          treeView: {
            iconColor: 'url(javascript:alert(1))',
            descriptionColor: '#00ff00',
          },
          packet: {
            startByteColor: '</style><script>alert(1)</script>',
            endByteColor: 'black',
          },
        },
      };
      sanitizeDirective(args);
      expect(args.themeVariables.primaryColor).toBe('');
      expect(args.themeVariables.treeView).toEqual({
        iconColor: '',
        descriptionColor: '#00ff00',
      });
      expect(args.themeVariables.packet).toEqual({
        startByteColor: '',
        endByteColor: 'black',
      });
    });
  });

  describe('dictionary-style configs', () => {
    it('preserves treeView filenameIcons and extensionIcons entries', () => {
      const args = {
        treeView: {
          filenameIcons: { Makefile: 'cmake', 'README.md': 'fa:bell' },
          extensionIcons: { '.tf': 'terraform', '.txt': 'none' },
        },
      };
      sanitizeDirective(args);
      expect(args.treeView.filenameIcons).toEqual({ Makefile: 'cmake', 'README.md': 'fa:bell' });
      expect(args.treeView.extensionIcons).toEqual({ '.tf': 'terraform', '.txt': 'none' });
    });

    it('deletes icon map values that are not plain icon references', () => {
      const args = {
        treeView: {
          extensionIcons: {
            '.ts': 'logos:typescript-icon',
            '.html': '<script>alert(1)</script>',
            '.css': 'not a valid name',
          },
        },
      };
      sanitizeDirective(args);
      expect(args.treeView.extensionIcons).toEqual({ '.ts': 'logos:typescript-icon' });
    });

    it('deletes suspicious icon map keys', () => {
      const args = {
        treeView: {
          filenameIcons: { __proto__hack: 'docker', 'constructor.js': 'docker', 'a.ts': 'docker' },
        },
      };
      sanitizeDirective(args);
      expect(args.treeView.filenameIcons).toEqual({ 'a.ts': 'docker' });
    });

    it('preserves valid nodeColors and deletes invalid ones', () => {
      const args = {
        sankey: {
          nodeColors: { a: '#ff0000', b: 'rgb(0, 0, 0)', c: 'url(javascript:alert(1))' },
        },
      };
      sanitizeDirective(args);
      expect(args.sankey.nodeColors).toEqual({ a: '#ff0000', b: 'rgb(0, 0, 0)' });
    });
  });
});
