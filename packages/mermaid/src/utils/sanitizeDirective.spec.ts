import { describe, expect, it } from 'vitest';
import { sanitizeDirective } from './sanitizeDirective.js';

describe('sanitizeDirective', () => {
  it('deletes keys that are not known config keys', () => {
    const args = { fontSize: 12, notAConfigKey: 'x' };
    sanitizeDirective(args);
    expect(args).toEqual({ fontSize: 12 });
  });

  it('keeps config keys whose default is undefined', () => {
    const args = { elk: { wrappingStrategy: 'MULTI_EDGE', aspectRatio: 1.78 } };
    sanitizeDirective(args);
    expect(args).toEqual({ elk: { wrappingStrategy: 'MULTI_EDGE', aspectRatio: 1.78 } });
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

    it('drops undeclared fields and invalid alignments', () => {
      const args = {
        grid: {
          placements: {
            A: {
              row: 1,
              column: 2,
              horizontalAlign: 'javascript:alert(1)',
              verticalAlign: 'top',
              theme: 'dark',
              nested: { row: 1 },
            },
            B: {},
          },
        },
      };

      sanitizeDirective(args);

      expect(args).toEqual({
        grid: { placements: { A: { row: 1, column: 2, verticalAlign: 'top' }, B: {} } },
      });
    });

    it.each(['<img src=x onerror=alert(1)>', Number.NaN, Number.POSITIVE_INFINITY, 1.5])(
      'rejects the invalid coordinate %s instead of dropping it',
      (row) => {
        const args = { grid: { placements: { A: { row, column: 2 } } } };

        expect(() => sanitizeDirective(args)).toThrow(/GRID_INVALID_COORDINATE/);
      }
    );

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

    it('deletes invalid grid alignments but preserves valid placement properties', () => {
      const args = {
        grid: {
          placements: {
            mixed: {
              column: 2,
              horizontalAlign: 'middle',
              verticalAlign: 'bottom',
            },
          },
        },
      };
      sanitizeDirective(args);
      expect(args.grid.placements).toEqual({
        mixed: { column: 2, verticalAlign: 'bottom' },
      });
    });

    it('preserves occurrence-indexed grid placement arrays', () => {
      const args = {
        grid: {
          placements: {
            service: [
              { row: 1, column: 1 },
              { row: 1, column: 2, horizontalAlign: 'right', unknown: true },
            ],
          },
        },
      };

      sanitizeDirective(args);

      expect(args.grid.placements).toEqual({
        service: [
          { row: 1, column: 1 },
          { row: 1, column: 2, horizontalAlign: 'right' },
        ],
      });
    });

    it.each([{ service: [] }, { service: [null] }, { service: [{ row: 1 }, 'invalid'] }])(
      'drops invalid grid placement arrays %#',
      ({ service }) => {
        const args = {
          grid: {
            placements: { service },
          },
        };

        sanitizeDirective(args);

        expect(args.grid.placements).toEqual({});
      }
    );

    it('preserves zero and negative coordinates in placement objects and arrays', () => {
      const args = {
        grid: {
          placements: {
            A: { row: 0, column: -2 },
            service: [{ row: -3, column: 0 }],
          },
        },
      };

      sanitizeDirective(args);

      expect(args.grid.placements).toEqual({
        A: { row: 0, column: -2 },
        service: [{ row: -3, column: 0 }],
      });
    });

    it.each([
      ['row', 0.5],
      ['row', 'first'],
      ['column', 1.5],
      ['column', null],
    ])('rejects invalid grid placement %s values', (field, value) => {
      const args = {
        grid: {
          placements: {
            A: { [field]: value },
          },
        },
      };

      expect(() => sanitizeDirective(args)).toThrow(
        `GRID_INVALID_COORDINATE: Invalid ${field} for placement "A"`
      );
    });

    it('reports the array index for invalid occurrence coordinates', () => {
      const args = {
        grid: {
          placements: {
            service: [{ row: 1 }, { row: 0.5 }],
          },
        },
      };

      expect(() => sanitizeDirective(args)).toThrow(
        'GRID_INVALID_COORDINATE: Invalid row for placement "service[1]"'
      );
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
