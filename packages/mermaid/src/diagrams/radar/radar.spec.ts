import { it, describe, expect } from 'vitest';
import { db } from './db.js';
import { parser } from './parser.js';

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

    // TODO: ✨ Fix this test
    // expect(getConfig().marginTop).toBe(80);
    // expect(getConfig().axisLabelFactor).toBe(1.25);
  });

  it('should parse radar diagram with theme override', async () => {
    const str = `
    %%{init: { "theme": "base", "themeVariables": {'fontSize': 80, 'cScale0': '#123456' }}}%%
    radar-beta:
    axis A,B,C
    curve mycurve{1,2,3}
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();

    // TODO: ✨ Add tests for theme override
  });

  it('should handle radar diagram with radar style override', async () => {
    const str = `
    %%{init: { "theme": "base", "themeVariables": {'fontSize': 10, 'radar': { 'axisColor': '#FF0000' }}}}%%
    radar-beta
    axis A,B,C
    curve mycurve{1,2,3}
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();

    // TODO: ✨ Add tests for style override
  });
});
