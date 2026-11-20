import type {
  MarbleItem,
  MarbleLane,
  MarbleSegment,
  MarbleSpanEnd,
  MarbleTick,
  MarbleTimeline,
  RawMarbleLine,
} from './marbleTypes.js';

/** Characters that fill a span. Each is also a symbol a `label` statement can name. */
export const SPAN_FILLS = new Set(['=', '~']);

/**
 * Characters kept back for RxJS marble syntax that this diagram does not draw yet:
 * `(` `)` group synchronous values, `^` marks subscription and `!` unsubscription.
 * Rejecting them now keeps that syntax available without breaking existing diagrams.
 */
export const RESERVED = new Set(['(', ')', '^', '!']);

/** Builds the error message every marble syntax error uses, with a source position. */
export const marbleError = (message: string, line: number, column: number): Error =>
  new Error(`Error parsing marble diagram: ${message} at line ${line}, column ${column}`);

/**
 * The column every lane is measured from: the leftmost non-blank marble across all lanes
 * and the axis, in source columns. A lane that starts with blanks starts later in time.
 */
export const findOrigin = (lines: RawMarbleLine[]): number => {
  let origin = Infinity;
  for (const { body, column } of lines) {
    const offset = body.search(/\S/);
    if (offset >= 0) {
      origin = Math.min(origin, column + offset);
    }
  }
  return Number.isFinite(origin) ? origin : 0;
};

/** The part of a marble string from the shared origin on, padded on the left with idle time. */
const cellsFrom = (raw: RawMarbleLine, origin: number): string => {
  const shift = raw.column - origin;
  return (shift >= 0 ? ' '.repeat(shift) + raw.body : raw.body.slice(-shift)).trimEnd();
};

/**
 * Interprets one lane's marble string.
 *
 * - `-` time passes, ` ` the lane is idle, `/` the axis breaks (time passes off-scale)
 * - `[` opens a span, `=` or `~` fills it, `]` closes it, `>` leaves it running
 * - `x` cancels: it closes an open span and the lane goes on
 * - `|` completes the lane and `#` errors it; nothing but blanks may follow either
 * - any other character is an event; it closes an open span, and opens one if a fill follows
 *
 * @param cells - The lane's characters, already aligned to the shared origin.
 * @param raw - The lane as parsed, for error positions.
 * @param origin - The shared origin, for error positions.
 */
export const interpretLane = (
  cells: string,
  raw: Pick<RawMarbleLine, 'line'>,
  origin: number
): Pick<MarbleLane, 'items' | 'segments'> & { breaks: number[] } => {
  const items: MarbleItem[] = [];
  const segments: MarbleSegment[] = [];
  const breaks: number[] = [];
  let span: { symbol: string; from: number } | undefined;
  let segment: MarbleSegment | undefined;
  let ended: string | undefined;
  const fail = (message: string, col: number): never => {
    throw marbleError(message, raw.line, origin + col);
  };
  const closeSpan = (col: number, end: MarbleSpanEnd) => {
    if (span) {
      items.push({ kind: 'span', symbol: span.symbol, from: span.from, to: col, end });
      span = undefined;
    }
  };
  const endSegment = () => {
    if (segment) {
      segments.push(segment);
      segment = undefined;
    }
  };

  for (let col = 0; col < cells.length; col++) {
    const char = cells[col];
    if (char === ' ') {
      if (span) {
        fail(`span opened at column ${origin + span.from} is interrupted by a blank`, col);
      }
      endSegment();
      continue;
    }
    if (char === '\t') {
      fail('tabs are not allowed in a marble string; use spaces so columns line up', col);
    }
    if (ended) {
      fail(`"${char}" follows the lane's ${ended}; nothing can happen after it`, col);
    }
    if (RESERVED.has(char)) {
      fail(`"${char}" is reserved for future marble syntax`, col);
    }
    segment ??= { from: col, to: col };
    segment.to = col;

    if (char === '-') {
      continue;
    }
    if (char === '/') {
      breaks.push(col);
      continue;
    }
    if (SPAN_FILLS.has(char)) {
      if (!span) {
        fail(`"${char}" fills a span, but no span is open; start one with "["`, col);
      }
      continue;
    }
    switch (char) {
      case '[': {
        if (span) {
          fail(`a span is already open since column ${origin + span.from}`, col);
        }
        const next = cells[col + 1];
        span = { symbol: next && SPAN_FILLS.has(next) ? next : '=', from: col };
        continue;
      }
      case ']':
      case '>': {
        if (!span) {
          fail(`"${char}" ends a span, but no span is open`, col);
        }
        closeSpan(col, char === ']' ? 'close' : 'open');
        continue;
      }
      case 'x': {
        closeSpan(col, 'cancel');
        items.push({ kind: 'cancel', col });
        continue;
      }
      case '|':
      case '#': {
        closeSpan(col, char === '|' ? 'close' : 'cancel');
        items.push({ kind: char === '|' ? 'complete' : 'error', col });
        ended = char === '|' ? 'completion "|"' : 'error "#"';
        endSegment();
        continue;
      }
    }
    closeSpan(col, 'close');
    items.push({ kind: 'event', symbol: char, col });
    const next = cells[col + 1];
    if (next && SPAN_FILLS.has(next)) {
      span = { symbol: next, from: col };
    }
  }
  closeSpan(cells.length - 1, 'open');
  endSegment();
  return { items, segments, breaks };
};

/** Splits the axis line into tick labels, each at the column of its first character. */
export const interpretAxis = (cells: string): MarbleTick[] =>
  [...cells.matchAll(/\S+/g)].map((match) => ({ col: match.index, text: match[0] }));

/**
 * Interprets every lane against one shared time origin.
 *
 * @param lanes - The lanes in source order.
 * @param axis - The optional `axis` line.
 */
export const buildTimeline = (lanes: RawMarbleLine[], axis?: RawMarbleLine): MarbleTimeline => {
  const origin = findOrigin(axis ? [...lanes, axis] : lanes);
  const breaks = new Set<number>();
  let columns = 0;

  const interpreted = lanes.map((raw): MarbleLane => {
    const cells = cellsFrom(raw, origin);
    columns = Math.max(columns, cells.length);
    const lane = interpretLane(cells, raw, origin);
    lane.breaks.forEach((col) => breaks.add(col));
    return { name: raw.name, items: lane.items, segments: lane.segments };
  });

  let ticks: MarbleTick[] = [];
  if (axis) {
    const cells = cellsFrom(axis, origin);
    if (cells.includes('\t')) {
      throw marbleError(
        'tabs are not allowed in the axis; use spaces so columns line up',
        axis.line,
        axis.column + axis.body.indexOf('\t')
      );
    }
    columns = Math.max(columns, cells.length);
    ticks = interpretAxis(cells).filter((tick) => {
      if (tick.text === '/') {
        breaks.add(tick.col);
        return false;
      }
      return true;
    });
  }

  return {
    ticks,
    lanes: interpreted,
    breaks: [...breaks].sort((a, b) => a - b),
    columns,
  };
};
