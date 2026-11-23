import { describe, expect, it } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
// @ts-ignore: Jison doesn't support types.
import parser from './parser/xychart.jison';
import db from './xychartDb.js';
import renderer from './xychartRenderer.js';

const diagramId = 'xychart-renderer-labels';

const renderXyChart = (text: string) => {
  configApi.setConfig({ xyChart: { showDataLabel: true } });
  document.body.innerHTML = `<svg id="${diagramId}"></svg>`;
  db.clear();
  if (parser.parser) {
    parser.parser.yy = db;
  }
  parser.parse(text);
  renderer.draw(text, diagramId, 'test', { db } as unknown as Diagram);
};

const barLabels = (plotIndex: number): (string | null)[] =>
  [...document.querySelectorAll(`#${diagramId} .bar-plot-${plotIndex} text`)].map(
    (el) => el.textContent
  );

describe('xychart showDataLabel per-series', () => {
  it('gives each bar series its own labels', () => {
    renderXyChart(`xychart
  x-axis [Q1, Q2, Q3]
  y-axis "revenue" 0 --> 500
  bar "2023" [120, 200, 180]
  bar "2024" [300, 400, 350]`);
    expect(barLabels(0)).toEqual(['120', '200', '180']);
    expect(barLabels(1)).toEqual(['300', '400', '350']);
  });

  it('leaves single-series labels untouched', () => {
    renderXyChart(`xychart
  x-axis [Jan, Feb, Mar]
  y-axis "count" 0 --> 100
  bar "total" [10, 40, 70]`);
    expect(barLabels(0)).toEqual(['10', '40', '70']);
  });

  it('assigns correct labels when a line series precedes two bar series', () => {
    renderXyChart(`xychart
  x-axis [A, B, C]
  y-axis "v" 0 --> 1000
  line "trend" [500, 600, 700]
  bar "low" [100, 200, 300]
  bar "high" [800, 900, 950]`);
    expect(barLabels(1)).toEqual(['100', '200', '300']);
    expect(barLabels(2)).toEqual(['800', '900', '950']);
  });

  it('gives each horizontal bar series its own labels', () => {
    renderXyChart(`xychart horizontal
  x-axis [X, Y, Z]
  y-axis "score" 0 --> 50
  bar "group1" [10, 20, 30]
  bar "group2" [40, 45, 50]`);
    expect(barLabels(0)).toEqual(['10', '20', '30']);
    expect(barLabels(1)).toEqual(['40', '45', '50']);
  });
});
