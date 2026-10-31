import { describe, expect, it } from 'vitest';

import type { DrawableElem, LinePlotData, TextElem } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';
import { LinePlot } from './linePlot.js';

const axis = (scale: (value: string | number) => number) =>
  ({ getScaleValue: scale }) as unknown as Axis;

const plotData = (strokeFill: string): LinePlotData => ({
  type: 'line',
  title: '',
  strokeFill,
  strokeWidth: 2,
  data: [
    ['Q1', 25],
    ['Q2', 45],
    ['Q3', 90],
  ],
  pointLabels: ['Launch', '', 'Target Hit'],
});

const textsOf = (elements: DrawableElem[]): TextElem[] =>
  elements.flatMap((element) => (element.type === 'text' ? element.data : []));

const labelColors = (
  strokeFill: string,
  backgroundColor: string,
  titleColor: string,
  orientation: 'vertical' | 'horizontal'
): string[] =>
  textsOf(
    new LinePlot(
      plotData(strokeFill),
      axis((value) => ['Q1', 'Q2', 'Q3'].indexOf(value as string) * 100),
      axis((value) => value as number),
      orientation,
      0,
      { backgroundColor, titleColor }
    ).getDrawableElement()
  ).map((label) => label.fill);

describe.each(['vertical', 'horizontal'] as const)('LinePlot point labels (%s)', (orientation) => {
  it('should keep the color of the line when it is readable on the background', () => {
    expect(labelColors('#0b5394', '#ffffff', '#333333', orientation)).toEqual([
      '#0b5394',
      '#0b5394',
    ]);
    expect(labelColors('#fff4dd', '#333333', '#eeeeee', orientation)).toEqual([
      '#fff4dd',
      '#fff4dd',
    ]);
  });

  it('should use the color of the title when the line is too pale for the background', () => {
    expect(labelColors('#ECECFF', '#ffffff', '#333333', orientation)).toEqual([
      '#333333',
      '#333333',
    ]);
  });
});
