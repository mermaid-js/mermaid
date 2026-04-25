import { describe, it, expect } from 'vitest';
import { LinePlot } from './linePlot.js';
import type { TextDimensionCalculator } from '../../textDimensionCalculator.js';
import type { Dimension, LinePlotData, XYChartConfig } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

function makeCalc(width: number, height: number): TextDimensionCalculator {
  return { getMaxDimension: (): Dimension => ({ width, height }) };
}

function makeAxis(scaleValues: number[], range: [number, number] = [0, 100]): Axis {
  let idx = 0;
  return {
    getScaleValue: () => scaleValues[idx++],
    getRange: () => range,
  } as unknown as Axis;
}

function makeChartConfig(orientation: 'vertical' | 'horizontal' = 'vertical'): XYChartConfig {
  return {
    width: 500,
    height: 400,
    titleFontSize: 14,
    titlePadding: 5,
    showTitle: true,
    showDataLabel: false,
    showDataLabelOutsideBar: false,
    chartOrientation: orientation,
    plotReservedSpacePercent: 50,
    xAxis: {
      labelFontSize: 14,
      labelPadding: 5,
      showLabel: true,
      showTitle: true,
      titleFontSize: 14,
      titlePadding: 5,
    },
    yAxis: {
      labelFontSize: 14,
      labelPadding: 5,
      showLabel: true,
      showTitle: true,
      titleFontSize: 14,
      titlePadding: 5,
    },
  } as unknown as XYChartConfig;
}

function makePlot(
  pixelPoints: [number, number][],
  labels: string[],
  calc: TextDimensionCalculator,
  orientation: 'vertical' | 'horizontal' = 'vertical',
  axisRange: [number, number] = [0, 100]
): LinePlot {
  const plotData: LinePlotData = {
    type: 'line',
    strokeFill: '#000',
    strokeWidth: 2,
    data: pixelPoints.map(([x], i) => [String(i), x] as [string, number]),
    pointLabels: labels,
  };

  const xScaleValues = pixelPoints.map(([x]) => x);
  const yScaleValues = pixelPoints.map(([, y]) => y);

  const xAxis = makeAxis(xScaleValues, axisRange);
  const yAxis = makeAxis(yScaleValues, axisRange);

  return new LinePlot(plotData, xAxis, yAxis, makeChartConfig(orientation), 0, calc);
}

describe('LinePlot label placement — vertical orientation', () => {
  it('places label above when there are no adjacent segments', () => {
    const plot = makePlot([[50, 50]], ['A'], makeCalc(20, 14));
    const elems = plot.getDrawableElement();
    const labels = elems.find((e) => e.type === 'text');
    expect(labels).toBeDefined();
    const textElem = (labels!.data as { y: number }[])[0];
    expect(textElem.y).toBeLessThan(50);
  });

  it('narrow label stays above on steep diagonal line', () => {
    // Line: [10,90] → [50,50] → [90,10] in pixel space (rising in SVG, y decreases = going up)
    // Narrow label at index 1 — small bounding box doesn't overlap the steep segment
    const plot = makePlot(
      [
        [10, 90],
        [50, 50],
        [90, 10],
      ],
      ['', 'i', ''],
      makeCalc(10, 14)
    );
    const elems = plot.getDrawableElement();
    const labels = elems.find((e) => e.type === 'text');
    expect(labels).toBeDefined();
    const textElem = (labels!.data as { y: number; text: string }[])[0];
    expect(textElem.text).toBe('i');
    expect(textElem.y).toBeLessThan(50);
  });

  it('wide label flips below on steep diagonal line', () => {
    // Shallow inverted-V peaking at (50,50). A wide bounding box samples the line
    // further from the apex, where y drops into the above-label region and forces
    // a flip below. A narrow box at the same apex stays clear.
    const plot = makePlot(
      [
        [0, 10],
        [50, 50],
        [100, 10],
      ],
      ['', 'MMMM', ''],
      makeCalc(40, 14)
    );
    const elems = plot.getDrawableElement();
    const labels = elems.find((e) => e.type === 'text');
    expect(labels).toBeDefined();
    const textElem = (labels!.data as { y: number; text: string }[])[0];
    expect(textElem.text).toBe('MMMM');
    expect(textElem.y).toBeGreaterThan(50);
  });

  it('same label string, different measured widths produce different flip decisions', () => {
    const points: [number, number][] = [
      [0, 10],
      [50, 50],
      [100, 10],
    ];
    const narrowPlot = makePlot([...points], ['', 'X', ''], makeCalc(4, 14));
    const widePlot = makePlot([...points], ['', 'X', ''], makeCalc(40, 14));

    const narrowLabels = narrowPlot.getDrawableElement().find((e) => e.type === 'text');
    const wideLabels = widePlot.getDrawableElement().find((e) => e.type === 'text');

    const narrowY = (narrowLabels!.data as { y: number }[])[0].y;
    const wideY = (wideLabels!.data as { y: number }[])[0].y;

    expect(narrowY).toBeLessThan(50);
    expect(wideY).toBeGreaterThan(50);
  });

  it('label clipped above stays within plot bounds by flipping below', () => {
    // Point near the top of the plot — label above would clip outside bounds [0,100]
    const plot = makePlot([[50, 5]], ['A'], makeCalc(20, 14), 'vertical', [0, 100]);
    const elems = plot.getDrawableElement();
    const labels = elems.find((e) => e.type === 'text');
    expect(labels).toBeDefined();
    const textElem = (labels!.data as { y: number }[])[0];
    expect(textElem.y).toBeGreaterThan(5);
  });

  it('skips entries with empty label strings', () => {
    const plot = makePlot(
      [
        [10, 90],
        [50, 50],
        [90, 10],
      ],
      ['A', '', 'B'],
      makeCalc(20, 14)
    );
    const elems = plot.getDrawableElement();
    const labels = elems.find((e) => e.type === 'text');
    expect((labels!.data as unknown[]).length).toBe(2);
  });

  it('returns no label group when all labels are empty', () => {
    const plot = makePlot(
      [
        [10, 90],
        [50, 50],
      ],
      ['', ''],
      makeCalc(20, 14)
    );
    const elems = plot.getDrawableElement();
    expect(elems.find((e) => e.type === 'text')).toBeUndefined();
  });

  it('returns no label group when pointLabels is absent', () => {
    const plotData: LinePlotData = {
      type: 'line',
      strokeFill: '#000',
      strokeWidth: 2,
      data: [['0', 50] as [string, number]],
    };
    const xAxis = makeAxis([50]);
    const yAxis = makeAxis([50]);
    const plot = new LinePlot(plotData, xAxis, yAxis, makeChartConfig(), 0, makeCalc(20, 14));
    const elems = plot.getDrawableElement();
    expect(elems.find((e) => e.type === 'text')).toBeUndefined();
  });
});

describe('LinePlot label placement — horizontal orientation', () => {
  it('places label to the right when there are no adjacent segments', () => {
    const plot = makePlot([[50, 50]], ['A'], makeCalc(20, 14), 'horizontal');
    const elems = plot.getDrawableElement();
    const labels = elems.find((e) => e.type === 'text');
    const textElem = (labels!.data as { horizontalPos: string }[])[0];
    expect(textElem.horizontalPos).toBe('left');
  });

  it('label clipped right stays within plot bounds by flipping left', () => {
    // Point near the right edge — label to the right would exceed bounds
    const plot = makePlot([[50, 95]], ['A'], makeCalc(20, 14), 'horizontal', [0, 100]);
    const elems = plot.getDrawableElement();
    const labels = elems.find((e) => e.type === 'text');
    expect(labels).toBeDefined();
    const textElem = (labels!.data as { horizontalPos: string }[])[0];
    expect(textElem.horizontalPos).toBe('right');
  });
});

describe('LinePlot — calculator integration', () => {
  it('calls calculator once per non-empty label', () => {
    let callCount = 0;
    const trackingCalc: TextDimensionCalculator = {
      getMaxDimension: (): Dimension => {
        callCount++;
        return { width: 20, height: 14 };
      },
    };
    const plot = makePlot(
      [
        [10, 90],
        [50, 50],
        [90, 10],
      ],
      ['A', '', 'B'],
      trackingCalc
    );
    plot.getDrawableElement();
    expect(callCount).toBe(2);
  });

  it('passes label text and font size to calculator', () => {
    const calls: { texts: string[]; fontSize: number }[] = [];
    const trackingCalc: TextDimensionCalculator = {
      getMaxDimension: (texts, fontSize): Dimension => {
        calls.push({ texts, fontSize });
        return { width: 20, height: 14 };
      },
    };
    const plot = makePlot([[50, 50]], ['Hello'], trackingCalc);
    plot.getDrawableElement();
    expect(calls.length).toBe(1);
    expect(calls[0].texts).toEqual(['Hello']);
    expect(calls[0].fontSize).toBe(14);
  });

  it('respects calculator-reported width for bounding box (zero width)', () => {
    const plot = makePlot(
      [
        [10, 90],
        [50, 50],
      ],
      ['A', 'B'],
      makeCalc(0, 14)
    );
    const elems = plot.getDrawableElement();
    expect(elems.find((e) => e.type === 'text')).toBeDefined();
  });
});
