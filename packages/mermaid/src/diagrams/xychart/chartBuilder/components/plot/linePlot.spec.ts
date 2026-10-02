import { describe, expect, it } from 'vitest';
import type { Axis } from '../axis/index.js';
import type { LinePlotData } from '../../interfaces.js';
import { LinePlot } from './linePlot.js';

function createAxis(scale: (value: string | number) => number): Axis {
  return { getScaleValue: scale } as Axis;
}

function linePlotData(data: LinePlotData['data'], strokeFill = '#f00'): LinePlotData {
  return {
    type: 'line',
    title: 'series',
    strokeFill,
    strokeWidth: 2,
    data,
  };
}

describe('LinePlot', () => {
  it('emits a point marker for a single-datum series', () => {
    const xAxis = createAxis((value) => (value === 'Total' ? 100 : Number(value)));
    const yAxis = createAxis((value) => Number(value) * 2);
    const plot = new LinePlot(
      linePlotData([['Total', 42]], '#ECECFF'),
      xAxis,
      yAxis,
      'vertical',
      0
    );

    const drawables = plot.getDrawableElement();

    expect(drawables).toHaveLength(2);
    expect(drawables[0]).toMatchObject({
      groupTexts: ['plot', 'line-plot-0'],
      type: 'path',
      data: [{ strokeFill: '#ECECFF', strokeWidth: 2 }],
    });
    expect(drawables[1]).toEqual({
      groupTexts: ['plot', 'line-plot-0'],
      type: 'circle',
      data: [
        {
          x: 100,
          y: 84,
          radius: 3,
          fill: '#ECECFF',
        },
      ],
    });
  });

  it('swaps coordinates for a single-datum horizontal series', () => {
    const xAxis = createAxis((value) => (value === 'Total' ? 100 : Number(value)));
    const yAxis = createAxis((value) => Number(value) * 2);
    const plot = new LinePlot(linePlotData([['Total', 42]]), xAxis, yAxis, 'horizontal', 0);

    const drawables = plot.getDrawableElement();
    const marker = drawables.find((drawable) => drawable.type === 'circle');

    expect(marker).toEqual({
      groupTexts: ['plot', 'line-plot-0'],
      type: 'circle',
      data: [
        {
          x: 84,
          y: 100,
          radius: 3,
          fill: '#f00',
        },
      ],
    });
  });

  it('does not emit a point marker for a multi-datum series', () => {
    const xAxis = createAxis((value) => (value === 'A' ? 0 : 1));
    const yAxis = createAxis((value) => Number(value));
    const plot = new LinePlot(
      linePlotData([
        ['A', 10],
        ['B', 20],
      ]),
      xAxis,
      yAxis,
      'vertical',
      0
    );

    const drawables = plot.getDrawableElement();

    expect(drawables).toHaveLength(1);
    expect(drawables[0].type).toBe('path');
    expect(drawables.some((drawable) => drawable.type === 'circle')).toBe(false);
  });
});
