import { it, describe, expect } from 'vitest';
import { db } from './db.js';
import { parser } from './parser.js';
import { closedRoundCurve, relativeRadius } from './renderer.js';
import { Diagram } from '../../Diagram.js';
import mermaidAPI from '../../mermaidAPI.js';

const {
  clear,
  getDiagramTitle,
  getAccTitle,
  getAccDescription,
  getAxes,
  getCurves,
  getOptions,
  getConfig,
} = db;

describe('radar diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a simple radar definition', async () => {
    const str = `radar-beta
    axis A,B,C
    curve mycurve{1,2,3}`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle diagram with data and title', async () => {
    const str = `radar-beta
    title Radar diagram
    accTitle: Radar accTitle
    accDescr: Radar accDescription
    axis A["Axis A"], B["Axis B"] ,C["Axis C"]
    curve mycurve["My Curve"]{1,2,3}
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getDiagramTitle()).toMatchInlineSnapshot('"Radar diagram"');
    expect(getAccTitle()).toMatchInlineSnapshot('"Radar accTitle"');
    expect(getAccDescription()).toMatchInlineSnapshot('"Radar accDescription"');
    expect(getAxes()).toMatchInlineSnapshot(`
      [
        {
          "label": "Axis A",
          "name": "A",
        },
        {
          "label": "Axis B",
          "name": "B",
        },
        {
          "label": "Axis C",
          "name": "C",
        },
      ]
    `);
    expect(getCurves()).toMatchInlineSnapshot(`
      [
        {
          "entries": [
            1,
            2,
            3,
          ],
          "label": "My Curve",
          "name": "mycurve",
        },
      ]
    `);
    expect(getOptions()).toMatchInlineSnapshot(`
      {
        "graticule": "circle",
        "max": null,
        "min": 0,
        "showLegend": true,
        "ticks": 5,
      }
    `);
  });

  it('should handle a radar diagram with options', async () => {
    const str = `radar-beta
    ticks 10
    showLegend false
    graticule polygon
    min 1
    max 10
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getOptions()).toMatchInlineSnapshot(`
      {
        "graticule": "polygon",
        "max": 10,
        "min": 1,
        "showLegend": false,
        "ticks": 10,
      }
    `);
  });

  it('should handle curve with detailed data in any order', async () => {
    const str = `radar-beta
    axis A,B,C
    curve mycurve{ C: 3, A: 1, B: 2 }`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getCurves()).toMatchInlineSnapshot(`
      [
        {
          "entries": [
            1,
            2,
            3,
          ],
          "label": "mycurve",
          "name": "mycurve",
        },
      ]
    `);
  });

  it('should handle positional and detailed curve ranges', async () => {
    const str = `radar-beta
    axis A,B,C
    curve positional{[1..2],3,[2..4]}
    curve detailed{C:[3..5],A:[1..3],B:4}`;
    await parser.parse(str);
    expect(getCurves()).toEqual([
      {
        name: 'positional',
        label: 'positional',
        entries: [2, 3, 4],
        startEntries: [1, null, 2],
      },
      {
        name: 'detailed',
        label: 'detailed',
        entries: [3, 4, 5],
        startEntries: [1, null, 3],
      },
    ]);
  });

  it('should reject a curve range whose start exceeds its end', async () => {
    const str = `radar-beta
    axis A
    curve invalid{[3..2]}`;
    await expect(parser.parse(str)).rejects.toThrow(
      'Curve range start (3) must not exceed end (2)'
    );
  });

  it('should preserve zero-width and decimal range bounds', async () => {
    await parser.parse(`radar-beta
    axis A,B,C
    curve c1{[0..0],[4..4],[1.25..2.5]}`);

    expect(getCurves()).toEqual([
      { name: 'c1', label: 'c1', entries: [0, 4, 2.5], startEntries: [0, 4, 1.25] },
    ]);
  });

  it.each([false, true])(
    'should keep literal curves independent of range curves (range first: %s)',
    async (rangeFirst) => {
      const curves = ['curve c1{6,10,4}', 'curve c2{C:[2..6],A:[4..8],B:[6..8]}'];
      const expected = [
        { name: 'c1', label: 'c1', entries: [6, 10, 4] },
        { name: 'c2', label: 'c2', entries: [8, 8, 6], startEntries: [4, 6, 2] },
      ];
      if (rangeFirst) {
        curves.reverse();
        expected.reverse();
      }
      await parser.parse(['radar-beta', 'axis A,B,C', ...curves, 'min 2'].join('\n'));

      expect(getCurves()).toEqual(expected);
      expect(getCurves().find(({ name }) => name === 'c1')).not.toHaveProperty('startEntries');
      expect(getOptions().min).toBe(2);
    }
  );

  it.each(['6,[0..4],2,[2..6]', 'D:[2..6],C:2,A:6,B:[0..4]'])(
    'should preserve literal lower bounds and reorder mixed entries: %s',
    async (entries) => {
      await parser.parse(`radar-beta
      axis A,B,C,D
      curve c1{${entries}}
      min 2`);

      expect(getCurves()).toEqual([
        {
          name: 'c1',
          label: 'c1',
          entries: [6, 4, 2, 6],
          startEntries: [null, 0, null, 2],
        },
      ]);
      expect(getOptions().min).toBe(2);
    }
  );

  it('should handle radar diagram with comments', async () => {
    const str = `radar-beta
    %% This is a comment
    axis A,B,C
    %% This is another comment
    curve mycurve{1,2,3}
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle radar diagram with config override', async () => {
    const str = `
    %%{init: {'radar': {'marginTop': 80, 'axisLabelFactor': 1.25}}}%%
    radar-beta
    axis A,B,C
    curve mycurve{1,2,3}
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should parse radar diagram with theme override', async () => {
    const str = `
    %%{init: { "theme": "base", "themeVariables": {'fontSize': 80, 'cScale0': '#123456' }}}%%
    radar-beta:
    axis A,B,C
    curve mycurve{1,2,3}
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle radar diagram with radar style override', async () => {
    const str = `
    %%{init: { "theme": "base", "themeVariables": {'fontSize': 10, 'radar': { 'axisColor': '#FF0000' }}}}%%
    radar-beta
    axis A,B,C
    curve mycurve{1,2,3}
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should limit the number of ticks to MAX_TICKS', async () => {
    // Otherwise, user can set millions of ticks, which causes DoS
    for (const { ticks, expected } of [
      { ticks: 12, expected: 12 }, // under limit
      { ticks: 32, expected: 32 }, // at limit
      { ticks: 33, expected: 32 }, // over limit
    ]) {
      const str = `radar-beta
      ticks ${ticks}
      `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(getOptions().ticks).toBe(expected);
    }
  });

  describe('renderer', () => {
    describe('relativeRadius', () => {
      it('should calculate relative radius', () => {
        expect(relativeRadius(5, 0, 10, 100)).toBe(50);
      });

      it('should handle min value', () => {
        expect(relativeRadius(0, 0, 10, 100)).toBe(0);
      });

      it('should handle max value', () => {
        expect(relativeRadius(10, 0, 10, 100)).toBe(100);
      });

      it('should clip values below min', () => {
        expect(relativeRadius(-5, 0, 10, 100)).toBe(0);
      });

      it('should clip values above max', () => {
        expect(relativeRadius(15, 0, 10, 100)).toBe(100);
      });

      it('should handle negative min', () => {
        expect(relativeRadius(5, -10, 10, 100)).toBe(75);
      });
    });

    describe('closedRoundCurve', () => {
      it('should construct a polygon if tension is 0', () => {
        const points = [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ];
        const tension = 0;
        const path = closedRoundCurve(points, tension);
        expect(path).toMatchInlineSnapshot(
          `"M0,0 C0,0 100,0 100,0 C100,0 100,100 100,100 C100,100 0,100 0,100 C0,100 0,0 0,0 Z"`
        );
      });

      it('should construct a simple round curve', () => {
        const points = [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ];
        const tension = 0.5;
        const path = closedRoundCurve(points, tension);
        expect(path).toMatchInlineSnapshot(`"M0,0 C0,0 100,100 100,100 C100,100 0,0 0,0 Z"`);
      });

      it('should construct a closed round curve', () => {
        const points = [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ];
        const tension = 0.5;
        const path = closedRoundCurve(points, tension);
        expect(path).toMatchInlineSnapshot(
          `"M0,0 C50,-50 50,-50 100,0 C150,50 150,50 100,100 C50,150 50,150 0,100 C-50,50 -50,50 0,0 Z"`
        );
      });
    });

    describe('draw', () => {
      const expectCurveVertices = (curve: Element | null, boundaries: [number, number][][]) => {
        expect(curve).not.toBeNull();
        if (curve?.tagName === 'polygon') {
          expect(boundaries).toHaveLength(1);
          const vertices = curve.getAttribute('points')?.split(' ');
          expect(vertices).toHaveLength(boundaries[0].length);
          vertices?.forEach((vertex, index) => {
            const [x, y] = vertex.split(',').map(Number);
            expect(x).toBeCloseTo(boundaries[0][index][0]);
            expect(y).toBeCloseTo(boundaries[0][index][1]);
          });
          return;
        }

        const paths = curve?.getAttribute('d')?.match(/M[^M]+/g);
        expect(paths).toHaveLength(boundaries.length);
        paths?.forEach((path, index) => {
          expect(path.trim()).toMatch(/Z$/);
          const expected = path.includes('C')
            ? [...boundaries[index], boundaries[index][0]]
            : boundaries[index];
          const commands = [...path.matchAll(/[CLM]([^CLMZ]+)/g)];
          expect(commands).toHaveLength(expected.length);
          commands.forEach((command, vertexIndex) => {
            const [x, y] = command[1]
              .trim()
              .split(/[\s,]+/)
              .map(Number)
              .slice(-2);
            expect(x).toBeCloseTo(expected[vertexIndex][0]);
            expect(y).toBeCloseTo(expected[vertexIndex][1]);
          });
        });
      };

      it('should draw a simple radar diagram', async () => {
        const str = `radar-beta
        axis A,B,C
        curve mycurve{1,2,3}`;
        await mermaidAPI.parse(str);
        const diagram = await Diagram.fromText(str);
        await diagram.renderer.draw(str, 'tst', '1.2.3', diagram);
      });

      it('should draw a complex radar diagram', async () => {
        const str = `radar-beta
        title Radar diagram
        accTitle: Radar accTitle
        accDescr: Radar accDescription
        axis A["Axis A"], B["Axis B"] ,C["Axis C"]
        curve mycurve["My Curve"]{1,2,3}
        curve mycurve2["My Curve 2"]{ C: 1, A: 2, B: 3 }
        graticule polygon
        `;
        await mermaidAPI.parse(str);
        const diagram = await Diagram.fromText(str);
        await diagram.renderer.draw(str, 'tst', '1.2.3', diagram);
      });

      it.each([
        ['circle', 'C'],
        ['polygon', 'L'],
      ] as const)(
        'should draw a range-valued curve with a %s boundary',
        async (graticule, pathCommand) => {
          const str = [
            'radar-beta',
            `graticule ${graticule}`,
            'axis A,B,C',
            'curve band{[1..2],[2..3],[1..4]}',
          ].join('\n');
          const { svg } = await mermaidAPI.render(`curve-${graticule}-range`, str);
          const rendered = new DOMParser().parseFromString(svg, 'image/svg+xml');

          const curve = rendered.querySelector('path.radarCurve-0');
          expect(curve?.getAttribute('d')?.match(/M/g)).toHaveLength(2);
          expect(curve?.getAttribute('d')).toContain(pathCommand);
          expect(curve?.getAttribute('fill-rule')).toBe('nonzero');
          expect(curve?.getAttribute('mask')).toBe(`url(#curve-${graticule}-range-radar-mask-0)`);
          const boundaries = curve?.getAttribute('d')?.match(/M[^M]+/g);
          const maskPaths = rendered.querySelectorAll('mask path');
          expect(maskPaths).toHaveLength(2);
          expect(maskPaths[0].getAttribute('d')).toBe(boundaries?.[0].trim());
          expect(maskPaths[1].getAttribute('d')).toBe(boundaries?.[1].trim());
          expect(maskPaths[0].getAttribute('style')).toContain('fill: white');
          expect(maskPaths[1].getAttribute('style')).toContain('fill: black');
          const outlines = rendered.querySelectorAll('path.radarCurveOutline-0');
          expect(outlines).toHaveLength(2);
          expect(outlines[0].getAttribute('mask')).toBeNull();
          expect(outlines[1].getAttribute('clip-path')).toBe(
            `url(#curve-${graticule}-range-radar-clip-0)`
          );
        }
      );

      it('should keep scalar polygon curves as polygon elements', async () => {
        const str = `radar-beta
        graticule polygon
        axis A,B,C
        curve scalar{1,2,3}`;
        const { svg } = await mermaidAPI.render('scalar-curve', str);
        const rendered = new DOMParser().parseFromString(svg, 'image/svg+xml');

        expect(rendered.querySelector('polygon.radarCurve-0')).not.toBeNull();
        expect(rendered.querySelector('path.radarCurve-0')).toBeNull();
      });

      it.each(['circle', 'polygon'])(
        'should coincide both boundaries for a zero-width %s band',
        async (graticule) => {
          const str = `radar-beta
          axis A,B,C
          curve c1{[0..0],[4..4],[2..2]}
          max 6
          graticule ${graticule}`;
          const { svg } = await mermaidAPI.render(`collapsed-${graticule}`, str);
          const rendered = new DOMParser().parseFromString(svg, 'image/svg+xml');
          const curve = rendered.querySelector('path.radarCurve-0');
          const boundaries = curve?.getAttribute('d')?.match(/M[^M]+/g);

          expect(boundaries).toHaveLength(2);
          expect(boundaries?.[0].trim()).toBe(boundaries?.[1].trim());
          expect(curve?.getAttribute('d')).not.toMatch(/NaN|Infinity/);
          expect(curve?.getAttribute('fill-rule')).toBe('nonzero');
        }
      );

      describe.each(['circle', 'polygon'])('mixed curves with a %s grid', (graticule) => {
        it.each([
          { maxCurve: 'literal', rangeFirst: false },
          { maxCurve: 'literal', rangeFirst: true },
          { maxCurve: 'range', rangeFirst: false },
          { maxCurve: 'range', rangeFirst: true },
        ])(
          'should share the maximum from the $maxCurve curve (range first: $rangeFirst)',
          async ({ maxCurve, rangeFirst }) => {
            const curves = [
              `curve c1{6,${maxCurve === 'literal' ? 10 : 8},4,8}`,
              `curve c2{[4..8],[6..${maxCurve === 'range' ? 10 : 8}],[2..6],[3..4]}`,
            ];
            if (rangeFirst) {
              curves.reverse();
            }
            const str = [
              '---',
              'config:',
              '  radar:',
              '    width: 200',
              '    height: 200',
              '---',
              'radar-beta',
              'axis A,B,C,D',
              ...curves,
              'min 2',
              `graticule ${graticule}`,
            ].join('\n');
            const { svg } = await mermaidAPI.render(
              `shared-${graticule}-${maxCurve}-${rangeFirst}`,
              str
            );
            const rendered = new DOMParser().parseFromString(svg, 'image/svg+xml');
            const literal = rendered.querySelector(`.radarCurve-${rangeFirst ? 1 : 0}`);
            const range = rendered.querySelector(`.radarCurve-${rangeFirst ? 0 : 1}`);

            expect(literal?.tagName).toBe(graticule === 'circle' ? 'path' : 'polygon');
            expect(literal?.getAttribute('fill-rule')).toBeNull();
            expect(range?.tagName).toBe('path');
            expect(range?.getAttribute('fill-rule')).toBe('nonzero');
            expectCurveVertices(literal, [
              [
                [0, -50],
                [maxCurve === 'literal' ? 100 : 75, 0],
                [0, 25],
                [-75, 0],
              ],
            ]);
            expectCurveVertices(range, [
              [
                [0, -75],
                [maxCurve === 'range' ? 100 : 75, 0],
                [0, 50],
                [-25, 0],
              ],
              [
                [0, -25],
                [50, 0],
                [0, 0],
                [-12.5, 0],
              ],
            ]);
          }
        );

        it.each([
          ['positional', '6,[3..5],4,[4..6]'],
          ['named', 'D:[4..6],C:4,A:6,B:[3..5]'],
        ])(
          'should start literals at the diagram minimum in a mixed %s curve',
          async (syntax, entries) => {
            const str = `---
config:
  radar:
    width: 200
    height: 200
---
radar-beta
  axis A,B,C,D
  curve c1{${entries}}
  min 2
  max 6
  graticule ${graticule}`;
            const { svg } = await mermaidAPI.render(`mixed-${graticule}-${syntax}`, str);
            const rendered = new DOMParser().parseFromString(svg, 'image/svg+xml');
            const curve = rendered.querySelector('path.radarCurve-0');

            expect(curve?.getAttribute('fill-rule')).toBe('nonzero');
            expectCurveVertices(curve, [
              [
                [0, -100],
                [75, 0],
                [0, 50],
                [-100, 0],
              ],
              [
                [0, 0],
                [25, 0],
                [0, 0],
                [-50, 0],
              ],
            ]);
          }
        );
      });
    });
  });
});
