import { describe, expect, it } from 'vitest';
import { calculateTimelineEnd, niceTicks, positionSegments } from './timingUtils.js';
import type { TimingSignal } from './types.js';

const signal = (overrides: Partial<TimingSignal>): TimingSignal => ({
  id: 'S',
  label: 'S',
  type: 'state',
  sequence: [],
  events: [],
  ...overrides,
});

describe('timing diagram timeline utilities', () => {
  it('uses sequence duration and gives the last event a visible hold interval', () => {
    const signals = [
      signal({ sequence: [{ value: 'A', duration: 8 }] }),
      signal({
        events: [
          { time: 0, value: 'Idle' },
          { time: 16, value: 'Active' },
        ],
      }),
    ];
    expect(calculateTimelineEnd(signals)).toBe(32);
  });

  it('renders a clock-only diagram for four periods', () => {
    expect(
      calculateTimelineEnd([
        signal({
          type: 'clock',
          clock: { period: 5, duty: 50, offset: 2 },
        }),
      ])
    ).toBe(22);
  });

  it('positions sequence and event segments', () => {
    expect(
      positionSegments(
        signal({
          sequence: [
            { value: 'A', duration: 2 },
            { value: 'B', duration: 3 },
          ],
        }),
        10
      )
    ).toEqual([
      { value: 'A', duration: 2, start: 0, end: 2 },
      { value: 'B', duration: 3, start: 2, end: 5 },
    ]);

    expect(
      positionSegments(
        signal({
          events: [
            { time: 2, value: 'A' },
            { time: 5, value: 'B' },
          ],
        }),
        9
      )
    ).toEqual([
      { value: 'A', duration: 3, start: 2, end: 5 },
      { value: 'B', duration: 4, start: 5, end: 9 },
    ]);
  });

  it('creates readable ticks for small and large ranges', () => {
    expect(niceTicks(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(niceTicks(300)).toEqual([0, 50, 100, 150, 200, 250, 300]);
  });

  it('rejects timelines whose arithmetic overflows', () => {
    expect(() =>
      calculateTimelineEnd([
        signal({
          events: [
            { time: 0, value: 'A' },
            { time: Number.MAX_VALUE, value: 'B' },
          ],
        }),
      ])
    ).toThrow(/finite end time/);
  });
});
