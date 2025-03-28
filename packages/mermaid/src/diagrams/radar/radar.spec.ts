import { it, describe, expect } from 'vitest';
import { db } from './db.js';
import { parser } from './parser.js';
import { renderer, relativeRadius, closedRoundCurve } from './renderer.js';
import { Diagram } from '../../Diagram.js';
import mermaidAPI from '../../mermaidAPI.js';
import { a } from 'vitest/dist/chunks/suite.qtkXWc6R.js';
import { buildRadarStyleOptions } from './styles.js';

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
    });
  });
});
