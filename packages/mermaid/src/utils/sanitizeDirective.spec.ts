import { describe, expect, it } from 'vitest';
import { sanitizeDirective } from './sanitizeDirective.js';

describe('sanitizeDirective', () => {
  it('deletes keys that are not known config keys', () => {
    const args = { fontSize: 12, notAConfigKey: 'x' };
    sanitizeDirective(args);
    expect(args).toEqual({ fontSize: 12 });
  });

  it.each([false, 'arc', 'gap'])('preserves grid.lineHops=%s', (lineHops) => {
    const args = { grid: { lineHops } };

    sanitizeDirective(args);

    expect(args).toEqual({ grid: { lineHops } });
  });

  describe('grid.placements', () => {
    it('preserves node ids and their declared placement fields', () => {
      const args = {
        grid: {
          rowGap: 80,
          placements: {
            A: { row: 1, column: 2 },
            'my-group': { row: 3, column: 1, horizontalAlign: 'left', verticalAlign: 'bottom' },
          },
        },
      };

      sanitizeDirective(args);

      expect(args).toEqual({
        grid: {
          rowGap: 80,
          placements: {
            A: { row: 1, column: 2 },
            'my-group': { row: 3, column: 1, horizontalAlign: 'left', verticalAlign: 'bottom' },
          },
        },
      });
    });

    it('drops undeclared fields and values of the wrong type', () => {
      const args = {
        grid: {
          placements: {
            A: {
              row: '<img src=x onerror=alert(1)>',
              column: 2,
              horizontalAlign: 'javascript:alert(1)',
              verticalAlign: 'top',
              theme: 'dark',
              nested: { row: 1 },
            },
            B: { row: Number.NaN, column: Number.POSITIVE_INFINITY },
          },
        },
      };

      sanitizeDirective(args);

      expect(args).toEqual({
        grid: { placements: { A: { column: 2, verticalAlign: 'top' }, B: {} } },
      });
    });

    it('drops suspicious ids and entries that are not objects', () => {
      const placements = JSON.parse(
        '{"__proto__": {"row": 1}, "constructor": {"row": 1}, "prototype": {"row": 1},' +
          ' "A": "row", "B": [1, 2], "C": {"row": 4}}'
      );
      const args = { grid: { placements } };

      sanitizeDirective(args);

      expect(Object.keys(args.grid.placements)).toEqual(['C']);
      expect(args.grid.placements.C).toEqual({ row: 4 });
    });

    it('empties a placements array', () => {
      const args = { grid: { placements: [{ row: 1 }] } };

      sanitizeDirective(args);

      expect(Object.keys(args.grid.placements)).toEqual([]);
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
