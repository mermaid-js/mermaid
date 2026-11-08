// @ts-nocheck TODO: Fix TS
import { parser } from './parser/gantt.jison';
import ganttDb from './ganttDb.js';
import ganttRenderer from './ganttRenderer.js';
import { setConfig, reset as resetConfig } from '../../config.js';

const render = (text: string) => {
  parser.yy = ganttDb;
  ganttDb.clear();
  parser.parse(text);
  ganttRenderer.draw(text, 'gantt-svg', '1.0.0', { db: ganttDb });
  return document.querySelector('#gantt-svg');
};

const axisLabels = (svg: Element) =>
  [...svg.querySelectorAll('g.grid .tick text')].map((tick) => tick.textContent);

describe('when rendering a gantt diagram with a relative dateFormat (issue #2850)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div><svg id="gantt-svg"></svg></div>';
    // jsdom does not lay out text
    SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 });
    setConfig({ gantt: { useWidth: 1000 } });
  });

  afterEach(() => {
    resetConfig();
    delete SVGElement.prototype.getBBox;
  });

  it('should label the axis with the number of units since the start', () => {
    const svg = render(`gantt
      dateFormat relative month
      tickInterval 1month
      Kick-off : 0, 2
      Pilot    : 2, 5`);

    expect(axisLabels(svg)).toEqual(['0', '1', '2', '3', '4', '5']);
  });

  it('should support %R inside a custom axisFormat', () => {
    const svg = render(`gantt
      dateFormat relative month
      axisFormat M%R (%%)
      tickInterval 2month
      Kick-off : 0, 4`);

    expect(axisLabels(svg)).toEqual(['M0 (%)', 'M2 (%)', 'M4 (%)']);
  });

  it('should pick round tick numbers without a tickInterval', () => {
    const svg = render(`gantt
      dateFormat relative day
      Task : 0, 100`);

    expect(axisLabels(svg)).toEqual([
      '0',
      '10',
      '20',
      '30',
      '40',
      '50',
      '60',
      '70',
      '80',
      '90',
      '100',
    ]);
  });

  it('should place ticks in the tickInterval unit', () => {
    const svg = render(`gantt
      dateFormat relative day
      tickInterval 1week
      Task : 0, 21`);

    expect(axisLabels(svg)).toEqual(['0', '7', '14', '21']);
  });

  it('should not draw the today marker', () => {
    const svg = render(`gantt
      dateFormat relative week
      Task : 0, 3`);

    expect(svg.querySelector('line.today')).toBeNull();
  });
});
