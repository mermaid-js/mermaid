import { describe, expect, it } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import { draw } from './renderer.js';
import type { TimingSignal } from './types.js';

const config = {
  width: 600,
  rowHeight: 48,
  labelWidth: 120,
  padding: 16,
  axisHeight: 36,
  useMaxWidth: true,
};

const createDiagram = (
  signals: TimingSignal[],
  title = '',
  configOverrides: Partial<typeof config> = {}
) =>
  ({
    db: {
      getSignals: () => signals,
      getConfig: () => ({ ...config, ...configOverrides }),
      getDiagramTitle: () => title,
      getTimeUnit: () => 'ns',
    },
  }) as unknown as Diagram;

describe('timing diagram renderer', () => {
  it('renders every v1 signal lane and the time axis', async () => {
    document.body.innerHTML = '<svg id="timing"></svg>';
    const signals: TimingSignal[] = [
      {
        id: 'CLK',
        label: 'Clock',
        type: 'clock',
        clock: { period: 2, duty: 50, offset: 0 },
        sequence: [],
        events: [],
      },
      {
        id: 'EN',
        label: 'Enable',
        type: 'binary',
        sequence: [
          { value: 0, duration: 2 },
          { value: 1, duration: 2 },
        ],
        events: [],
      },
      {
        id: 'DATA',
        label: 'Data',
        type: 'bus',
        sequence: [
          { value: 'Z', duration: 1 },
          { value: 'D0', duration: 3 },
        ],
        events: [],
      },
      {
        id: 'S',
        label: 'State',
        type: 'state',
        states: ['Idle', 'Run'],
        sequence: [],
        events: [
          { time: 0, value: 'Idle' },
          { time: 2, value: 'Run' },
        ],
      },
      {
        id: 'V',
        label: 'Voltage',
        type: 'analog',
        analog: { min: 0, max: 5, interpolation: 'linear' },
        sequence: [
          { value: 0, duration: 2 },
          { value: 5, duration: 2 },
        ],
        events: [],
      },
    ];

    await draw('', 'timing', '1.0', createDiagram(signals, 'Read cycle'));

    expect(document.querySelector('.timing-title')?.textContent).toBe('Read cycle');
    expect(document.querySelector('.timing-axis-label')?.textContent).toBe('Time (ns)');
    expect(document.querySelectorAll('.timing-lane')).toHaveLength(5);
    expect(document.querySelector('.timing-clock')).not.toBeNull();
    expect(document.querySelectorAll('.timing-binary')).toHaveLength(2);
    expect(document.querySelectorAll('.timing-bus-segment')).toHaveLength(2);
    expect(document.querySelectorAll('.timing-state-segment')).toHaveLength(2);
    expect(document.querySelector('.timing-analog')).not.toBeNull();
    expect(document.querySelectorAll('.timing-grid-line').length).toBeGreaterThan(1);
    expect(document.querySelector('#timing')?.getAttribute('viewBox')).toMatch(/^0 0 /);
  });

  it('renders an empty diagram without throwing', () => {
    document.body.innerHTML = '<svg id="empty-timing"></svg>';
    expect(() => draw('', 'empty-timing', '1.0', createDiagram([]))).not.toThrow();
    expect(document.querySelector('.timing-axis-label')).not.toBeNull();
  });

  it('rejects clocks that would generate an excessive number of SVG path segments', () => {
    document.body.innerHTML = '<svg id="oversized-clock"></svg>';
    const signals: TimingSignal[] = [
      {
        id: 'CLK',
        label: 'Clock',
        type: 'clock',
        clock: { period: 0.00001, duty: 50, offset: 0 },
        sequence: [],
        events: [],
      },
      {
        id: 'EN',
        label: 'Enable',
        type: 'binary',
        sequence: [{ value: 1, duration: 1 }],
        events: [],
      },
    ];

    expect(() => draw('', 'oversized-clock', '1.0', createDiagram(signals))).toThrow(
      /more than 10{4} cycles/
    );
  });

  it('keeps constant high-magnitude analog values finite', () => {
    document.body.innerHTML = '<svg id="large-analog"></svg>';
    const signals: TimingSignal[] = [
      {
        id: 'V',
        label: 'Voltage',
        type: 'analog',
        analog: { interpolation: 'linear' },
        sequence: [
          { value: 1e20, duration: 1 },
          { value: 1e20, duration: 1 },
        ],
        events: [],
      },
    ];

    expect(() => draw('', 'large-analog', '1.0', createDiagram(signals))).not.toThrow();
    expect(document.querySelector('.timing-analog')?.getAttribute('d')).not.toMatch(/NaN|Infinity/);
    for (const point of document.querySelectorAll('.timing-analog-point')) {
      expect(point.getAttribute('cy')).not.toMatch(/NaN|Infinity/);
    }
  });

  it('rejects configuration whose aggregate layout geometry overflows', () => {
    document.body.innerHTML = '<svg id="overflow-layout"></svg>';

    expect(() =>
      draw('', 'overflow-layout', '1.0', createDiagram([], '', { width: 1e308, padding: 1e308 }))
    ).toThrow(/finite, positive geometry/);
    expect(document.querySelector('#overflow-layout')?.getAttribute('viewBox')).toBeNull();
  });
});
