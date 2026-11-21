import { describe, expect, it } from 'vitest';
import { buildTimeline, findOrigin, interpretAxis, interpretLane } from './marbleTimeline.js';
import type { RawMarbleLine } from './marbleTypes.js';

const lane = (cells: string) => interpretLane(cells, { line: 3 }, 10);
const raw = (name: string, body: string, column = 10, line = 2): RawMarbleLine => ({
  name,
  body,
  column,
  line,
});

describe('interpretLane', () => {
  it('reads events, time and completion', () => {
    const { items, segments } = lane('-a--b-|');
    expect(items).toEqual([
      { kind: 'event', symbol: 'a', col: 1 },
      { kind: 'event', symbol: 'b', col: 4 },
      { kind: 'complete', col: 6 },
    ]);
    expect(segments).toEqual([{ from: 0, to: 6 }]);
  });

  it('reads an error as the end of the lane', () => {
    expect(lane('--a-#').items.at(-1)).toEqual({ kind: 'error', col: 4 });
  });

  it('starts a lane later for each leading blank, and lets other whitespace take no time', () => {
    const { items, segments, columns } = lane('  -a - b -    c |');
    expect(items).toEqual([
      { kind: 'event', symbol: 'a', col: 3 },
      { kind: 'event', symbol: 'b', col: 5 },
      { kind: 'event', symbol: 'c', col: 7 },
      { kind: 'complete', col: 8 },
    ]);
    expect(segments).toEqual([{ from: 2, to: 8 }]);
    expect(columns).toBe(9);
  });

  it('stacks a sync group in the column of "(" and lets it take one column per character', () => {
    const { items, columns } = lane('-(abc)-d');
    expect(items).toEqual([
      { kind: 'event', symbol: 'a', col: 1, stack: { index: 0, size: 3 } },
      { kind: 'event', symbol: 'b', col: 1, stack: { index: 1, size: 3 } },
      { kind: 'event', symbol: 'c', col: 1, stack: { index: 2, size: 3 } },
      { kind: 'group', col: 1, to: 5, size: 3 },
      { kind: 'event', symbol: 'd', col: 7 },
    ]);
    expect(columns).toBe(8);
  });

  it("puts a completion or error inside a group in the group's frame", () => {
    expect(lane('--(a|)').items).toEqual([
      { kind: 'event', symbol: 'a', col: 2, stack: { index: 0, size: 1 } },
      { kind: 'complete', col: 2, grouped: true },
      { kind: 'group', col: 2, to: 5, size: 1 },
    ]);
    expect(lane('(#)').items).toEqual([
      { kind: 'error', col: 0, grouped: true },
      { kind: 'group', col: 0, to: 2, size: 0 },
    ]);
  });

  it('marks the subscription point with ^', () => {
    expect(lane('--a--^--b--|').items).toEqual([
      { kind: 'event', symbol: 'a', col: 2 },
      { kind: 'subscribe', col: 5 },
      { kind: 'event', symbol: 'b', col: 8 },
      { kind: 'complete', col: 11 },
    ]);
  });

  it('reads time progressions as one column each, keeping the duration', () => {
    const { items, columns } = lane('10.2ms a 1.2s b 1m c|');
    expect(items).toEqual([
      { kind: 'time', col: 0, text: '10.2ms' },
      { kind: 'event', symbol: 'a', col: 1 },
      { kind: 'time', col: 2, text: '1.2s' },
      { kind: 'event', symbol: 'b', col: 3 },
      { kind: 'time', col: 4, text: '1m' },
      { kind: 'event', symbol: 'c', col: 5 },
      { kind: 'complete', col: 6 },
    ]);
    expect(columns).toBe(7);
  });

  it('reads digits and units as values when they are not a whole time progression', () => {
    expect(
      lane('-1ms a1s').items.map((item) => (item.kind === 'event' ? item.symbol : item.kind))
    ).toEqual(['1', 'm', 's', 'a', '1', 's']);
  });

  it('draws a subscription-only lane as one span from ^ to !', () => {
    expect(lane('--^---!-').items).toEqual([
      { kind: 'span', symbol: '^', from: 2, to: 6, end: 'cancel', subscription: true },
      { kind: 'cancel', col: 6 },
    ]);
    expect(lane('--^---!-').segments).toEqual([]);
    expect(lane('^ 32ms !').items).toEqual([
      { kind: 'span', symbol: '^', from: 0, to: 2, end: 'cancel', subscription: true },
      { kind: 'time', col: 1, text: '32ms' },
      { kind: 'cancel', col: 2 },
    ]);
    expect(lane('---^').items).toEqual([
      { kind: 'span', symbol: '^', from: 3, to: 3, end: 'open', subscription: true },
    ]);
  });

  it('reads x as a plain value', () => {
    expect(lane('-x-').items).toEqual([{ kind: 'event', symbol: 'x', col: 1 }]);
  });

  it('reads span characters as values where no span can open or close', () => {
    expect(
      lane('-]->-=-[-').items.map((item) => (item.kind === 'event' ? item.symbol : item.kind))
    ).toEqual([']', '>', '=', '[']);
  });

  it('draws nothing after a completion or error, but counts the time', () => {
    const { items, segments, columns } = lane('--a--#--d--|');
    expect(items).toEqual([
      { kind: 'event', symbol: 'a', col: 2 },
      { kind: 'error', col: 5 },
    ]);
    expect(segments).toEqual([{ from: 0, to: 5 }]);
    expect(columns).toBe(12);
  });

  it('reads a bracketed span with its fill symbol', () => {
    expect(lane('-[~~~]-').items).toEqual([
      { kind: 'span', symbol: '~', from: 1, to: 5, end: 'close' },
    ]);
  });

  it('lets a span run through whitespace, which takes no time', () => {
    expect(lane('-[== =]-').items).toEqual([
      { kind: 'span', symbol: '=', from: 1, to: 5, end: 'close' },
    ]);
  });

  it('opens a span from an event followed by fill, and closes it at the next event', () => {
    expect(lane('-S~~E-').items).toEqual([
      { kind: 'event', symbol: 'S', col: 1 },
      { kind: 'span', symbol: '~', from: 1, to: 4, end: 'close' },
      { kind: 'event', symbol: 'E', col: 4 },
    ]);
  });

  it('cancels a span with ! and keeps the lane going', () => {
    const { items, segments } = lane('[===!--');
    expect(items).toEqual([
      { kind: 'span', symbol: '=', from: 0, to: 4, end: 'cancel' },
      { kind: 'cancel', col: 4 },
    ]);
    expect(segments).toEqual([{ from: 0, to: 6 }]);
  });

  it('leaves a span running with > and at the end of the string', () => {
    expect(lane('[==>').items).toEqual([
      { kind: 'span', symbol: '=', from: 0, to: 3, end: 'open' },
    ]);
    expect(lane('[===').items).toEqual([
      { kind: 'span', symbol: '=', from: 0, to: 3, end: 'open' },
    ]);
  });

  it('records time breaks', () => {
    expect(lane('-a-/-b').breaks).toEqual([3]);
  });

  it.each([
    ['-(ab', 'the group opened here is never closed with ")"', 11],
    ['-ab)', '")" closes a group, but no group is open', 13],
    ['(a(b))', 'groups cannot be nested; the group at column 10 is still open', 12],
    ['\t-a', 'tabs are not allowed before a marble string', 10],
  ])('rejects %j with a positioned error', (cells, message, column) => {
    expect(() => lane(cells)).toThrow(message);
    expect(() => lane(cells)).toThrow(`at line 3, column ${column}`);
  });
});

describe('interpretAxis', () => {
  it('places each tick at the column of its first character', () => {
    expect(interpretAxis('0    5m   10m')).toEqual([
      { col: 0, text: '0' },
      { col: 5, text: '5m' },
      { col: 10, text: '10m' },
    ]);
  });
});

describe('findOrigin', () => {
  it('is the leftmost non-blank character across lines', () => {
    expect(findOrigin([raw('a', '  -a', 10), raw('b', ' --', 12)])).toBe(12);
  });

  it('is 0 when every line is blank', () => {
    expect(findOrigin([raw('a', '   ')])).toBe(0);
  });
});

describe('buildTimeline', () => {
  it('aligns lanes to a shared origin so source alignment is time alignment', () => {
    const timeline = buildTimeline([raw('source', ' -a~b---', 9), raw('inner', '    [===c', 9)]);
    expect(timeline.lanes[0].items[0]).toEqual({ kind: 'event', symbol: 'a', col: 1 });
    expect(timeline.lanes[1].items[0]).toEqual({
      kind: 'span',
      symbol: '=',
      from: 3,
      to: 7,
      end: 'close',
    });
    expect(timeline.columns).toBe(8);
  });

  it('uses the axis to set origin and length, and collects breaks from all lines', () => {
    const timeline = buildTimeline(
      [raw('a', ' -a-/-b', 6), raw('b', ' ---/--c-|', 6)],
      raw('axis', ' 0  /   20', 6)
    );
    expect(timeline.ticks).toEqual([
      { col: 0, text: '0' },
      { col: 7, text: '20' },
    ]);
    expect(timeline.breaks).toEqual([3]);
    expect(timeline.columns).toBe(9);
  });

  it('accepts a diagram with no lanes', () => {
    expect(buildTimeline([])).toEqual({ ticks: [], lanes: [], breaks: [], columns: 0 });
  });
});
