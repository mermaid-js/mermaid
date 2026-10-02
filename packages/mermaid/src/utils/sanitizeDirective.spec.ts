import { describe, expect, it } from 'vitest';
import { sanitizeDirective } from './sanitizeDirective.js';

describe('sanitizeDirective', () => {
  it('deletes keys that are not known config keys', () => {
    const args = { fontSize: 12, notAConfigKey: 'x' };
    sanitizeDirective(args);
    expect(args).toEqual({ fontSize: 12 });
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

    it('preserves grid placements keyed by node id', () => {
      const args = {
        grid: {
          placements: {
            G: { row: 1, column: 2 },
            protocolGateway: { row: 2 },
            prototypeA: { column: 3 },
            constraintSolver: { horizontalAlign: 'center' },
            constructorNode: { verticalAlign: 'top' },
            __proto__hack: { row: 4 },
            'group.with-punctuation': {
              horizontalAlign: 'left',
              verticalAlign: 'bottom',
            },
          },
        },
      };
      sanitizeDirective(args);
      expect(args.grid.placements).toEqual({
        G: { row: 1, column: 2 },
        protocolGateway: { row: 2 },
        prototypeA: { column: 3 },
        constraintSolver: { horizontalAlign: 'center' },
        constructorNode: { verticalAlign: 'top' },
        __proto__hack: { row: 4 },
        'group.with-punctuation': {
          horizontalAlign: 'left',
          verticalAlign: 'bottom',
        },
      });
    });

    it('drops unsafe grid placement ids, non-object values, and unknown properties', () => {
      const args = {
        grid: {
          placements: {
            valid: { row: 1, notAConfigKey: 'x' },
            ['__proto__']: { column: 1 },
            constructor: { column: 2 },
            prototype: { column: 3 },
            scalar: 3,
          },
        },
      };
      sanitizeDirective(args);
      expect(args.grid.placements).toEqual({ valid: { row: 1 } });
    });

    it('deletes grid placement values that do not match the schema', () => {
      const args = {
        grid: {
          placements: {
            mixed: {
              row: 'first',
              column: 2,
              horizontalAlign: 'middle',
              verticalAlign: 'bottom',
            },
            invalid: {
              row: 0,
              column: 1.5,
              horizontalAlign: {},
              verticalAlign: null,
            },
          },
        },
      };
      sanitizeDirective(args);
      expect(args.grid.placements).toEqual({
        mixed: { column: 2, verticalAlign: 'bottom' },
        invalid: {},
      });
    });

    it('does not apply grid placement sanitization outside grid config', () => {
      const args = {
        flowchart: {
          placements: {
            protocolGateway: { row: 1 },
          },
        },
      };
      sanitizeDirective(args);
      expect(args.flowchart.placements).toEqual({});
    });
  });
});
