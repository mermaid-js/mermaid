import { describe, expect, it } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
// @ts-ignore: Jison doesn't support types.
import parser from './parser/xychart.jison';
import db from './xychartDb.js';
import renderer from './xychartRenderer.js';

const diagramId = 'xychart-renderer-spec';

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
    (element) => element.textContent
  );

describe('xychart renderer data labels', () => {
  it('labels each bar series with its own values', () => {
    renderXyChart(`xychart
  x-axis [orders, search, profile]
  y-axis "p95 (ms)" 0 --> 450
  bar "before" [380, 210, 140]
  bar "after" [95, 60, 130]`);
    expect(barLabels(0)).toEqual(['380', '210', '140']);
    expect(barLabels(1)).toEqual(['95', '60', '130']);
  });

  it('keeps single-series labels unchanged', () => {
    renderXyChart(`xychart
  x-axis [orders, search]
  y-axis "p95 (ms)" 0 --> 450
  bar "before" [380, 210]`);
    expect(barLabels(0)).toEqual(['380', '210']);
  });

  it('labels each bar series with its own values in horizontal orientation', () => {
    renderXyChart(`xychart horizontal
  x-axis [orders, search, profile]
  y-axis "p95 (ms)" 0 --> 450
  bar "before" [380, 210, 140]
  bar "after" [95, 60, 130]`);
    expect(barLabels(0)).toEqual(['380', '210', '140']);
    expect(barLabels(1)).toEqual(['95', '60', '130']);
  });
});
