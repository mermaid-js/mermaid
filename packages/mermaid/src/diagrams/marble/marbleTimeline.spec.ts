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

  it('treats blanks as idle time and splits the lane line there', () => {
    const { segments } = lane('-a-   -b-');
    expect(segments).toEqual([
      { from: 0, to: 2 },
      { from: 6, to: 8 },
    ]);
  });

  it('reads a bracketed span with its fill symbol', () => {
    expect(lane('-[~~~]-').items).toEqual([
      { kind: 'span', symbol: '~', from: 1, to: 5, end: 'close' },
    ]);
  });

  it('defaults a bracketed span without fill to "="', () => {
    expect(lane('-[]-').items).toEqual([
      { kind: 'span', symbol: '=', from: 1, to: 2, end: 'close' },
    ]);
  });

  it('opens a span from an event followed by fill, and closes it at the next event', () => {
    expect(lane('-S~~E-').items).toEqual([
      { kind: 'event', symbol: 'S', col: 1 },
      { kind: 'span', symbol: '~', from: 1, to: 4, end: 'close' },
      { kind: 'event', symbol: 'E', col: 4 },
    ]);
  });

  it('cancels a span with x and keeps the lane going', () => {
    const { items, segments } = lane('[===x--');
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
    ['-a-|-b', '"-" follows the lane\'s completion "|"', 14],
    ['-#a', '"a" follows the lane\'s error "#"', 12],
    ['-]', '"]" ends a span, but no span is open', 11],
    ['->', '">" ends a span, but no span is open', 11],
    ['-==', '"=" fills a span, but no span is open', 11],
    ['[=[', 'a span is already open since column 10', 12],
    ['[== =]', 'span opened at column 10 is interrupted by a blank', 13],
    ['-(ab)-', '"(" is reserved for future marble syntax', 11],
    ['-^-', '"^" is reserved', 11],
    ['-\t-', 'tabs are not allowed', 11],
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
