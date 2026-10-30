import { describe, expect, it } from 'vitest';

import type { DrawableElem, LinePlotData, TextElem } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';
import { LinePlot } from './linePlot.js';

const axis = (scale: (value: string | number) => number) =>
  ({ getScaleValue: scale }) as unknown as Axis;

const plotData: LinePlotData = {
  type: 'line',
  title: '',
  strokeFill: '#ECECFF',
  strokeWidth: 2,
  data: [
    ['Q1', 25],
    ['Q2', 45],
    ['Q3', 90],
  ],
  pointLabels: ['Launch', '', 'Target Hit'],
};

const textsOf = (elements: DrawableElem[]): TextElem[] =>
  elements.flatMap((element) => (element.type === 'text' ? element.data : []));

const labels = (orientation: 'vertical' | 'horizontal'): TextElem[] => {
  return textsOf(
    new LinePlot(
      plotData,
      axis((value) => ['Q1', 'Q2', 'Q3'].indexOf(value as string) * 100),
      axis((value) => value as number),
      orientation,
      0,
      '#333'
    ).getDrawableElement()
  );
};

describe('LinePlot point labels', () => {
  it('should use the data label color of the theme, not the color of the line', () => {
    expect(labels('vertical').map((label) => label.fill)).toEqual(['#333', '#333']);
    expect(labels('horizontal').map((label) => label.fill)).toEqual(['#333', '#333']);
  });
});
