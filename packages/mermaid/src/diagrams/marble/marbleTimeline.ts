import type {
  MarbleEventItem,
  MarbleItem,
  MarbleLane,
  MarbleSegment,
  MarbleSpanEnd,
  MarbleSpanItem,
  MarbleTerminalItem,
  MarbleTick,
  MarbleTimeline,
  RawMarbleLine,
} from './marbleTypes.js';

/** Characters that fill a span. Each is also a symbol a `label` statement can name. */
export const SPAN_FILLS = new Set(['=', '~']);

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
 * RxJS time progression: a number and a unit (`ms`, `s` or `m`), at the start of the string or
 * after whitespace, and followed by whitespace or the end, as in `a 9ms b` or `1.4s`.
 */
const DURATION = /^\d+(?:\.\d+)?(?:ms|s|m)(?=\s|$)/;

const isBlank = (char: string | undefined) => char !== undefined && /\s/.test(char);

/** The RxJS time progression starting at `index`, if there is one. */
export const readDuration = (cells: string, index: number): string | undefined => {
  if (index > 0 && !isBlank(cells[index - 1])) {
    return undefined;
  }
  return DURATION.exec(cells.slice(index))?.[0];
};

/** Characters a subscription marble string may hold besides time progressions, as in RxJS. */
const SUBSCRIPTION_CHARS = new Set(['-', '^', '!', '(', ')']);

/**
 * A lane written in RxJS subscription marble syntax, such as `--^---!` or `^ 32ms !`: only `-`,
 * `^`, `!` and time progressions. It is drawn as one span from `^` to `!`.
 */
const asSubscriptionLane = (
  cells: string,
  items: MarbleItem[],
  segments: MarbleSegment[],
  end: number
): MarbleItem[] | undefined => {
  if (!items.some(({ kind }) => kind === 'subscribe' || kind === 'cancel')) {
    return undefined;
  }
  const chars = cells.replace(/(^|\s)\d+(?:\.\d+)?(?:ms|s|m)(?=\s|$)/g, '$1').replace(/\s/g, '');
  if (![...chars].every((char) => SUBSCRIPTION_CHARS.has(char))) {
    return undefined;
  }
  const subscribe = items.find((item) => item.kind === 'subscribe');
  const cancel = items.find((item): item is MarbleTerminalItem => item.kind === 'cancel');
  const from = subscribe?.col ?? segments[0]?.from ?? 0;
  const to = cancel?.col ?? Math.max(from, end - 1);
  const span: MarbleSpanItem = {
    kind: 'span',
    symbol: '^',
    from,
    to,
    end: cancel ? 'cancel' : 'open',
    subscription: true,
  };
  return [span, ...items.filter(({ kind }) => kind === 'cancel' || kind === 'time')];
};

/**
 * Interprets one lane's marble string. Every RxJS marble string is accepted, read with the
 * semantics of `TestScheduler.run()`; spans and `/` breaks are this diagram's own additions.
 *
 * - leading blanks start the lane later (one column each); other whitespace takes no time
 * - `-` time passes, `/` the axis breaks, `9ms`/`1.4s`/`2m` time progresses (a labelled break)
 * - `(abc)` groups values into one frame; the group still takes one column per character
 * - `^` marks the subscription point, `!` unsubscribes (cancels): it closes an open span
 * - `[` followed by `=` or `~` opens a span, `]` closes it, `>` leaves it running
 * - `|` completes the lane and `#` errors it; what follows takes time but is not drawn
 * - any other character is an event; it closes an open span, and opens one if a fill follows
 * - a lane of only `-`, `^`, `!` and time progressions is a subscription, drawn as a span
 *
 * @param cells - The lane's characters, already aligned to the shared origin.
 * @param raw - The lane as parsed, for error positions.
 * @param origin - The shared origin, for error positions.
 */
export const interpretLane = (
  cells: string,
  raw: Pick<RawMarbleLine, 'line'>,
  origin: number
): Pick<MarbleLane, 'items' | 'segments'> & { breaks: number[]; columns: number } => {
  const items: MarbleItem[] = [];
  const segments: MarbleSegment[] = [];
  const breaks: number[] = [];
  let span: { symbol: string; from: number } | undefined;
  let segment: MarbleSegment | undefined;
  let group:
    | { col: number; index: number; events: MarbleEventItem[]; terminal: boolean }
    | undefined;
  let ended = false;
  let started = false;
  let col = 0;
  const fail = (message: string, index: number): Error =>
    marbleError(message, raw.line, origin + index);
  const closeSpan = (at: number, end: MarbleSpanEnd) => {
    if (span) {
      items.push({ kind: 'span', symbol: span.symbol, from: span.from, to: at, end });
      span = undefined;
    }
  };
  const extend = (at: number) => {
    segment ??= { from: at, to: at };
    segment.to = at;
  };
  const endSegment = () => {
    if (segment) {
      segments.push(segment);
      segment = undefined;
    }
  };

  for (let index = 0; index < cells.length; index++) {
    const char = cells[index];
    if (isBlank(char)) {
      if (!started) {
        if (char !== ' ') {
          throw fail(
            'tabs are not allowed before a marble string; use spaces so columns line up',
            index
          );
        }
        col++;
      }
      continue;
    }
    started = true;

    const duration = readDuration(cells, index);
    if (duration) {
      if (!ended) {
        extend(col);
        items.push({ kind: 'time', col, text: duration });
      }
      col++;
      index += duration.length - 1;
      continue;
    }

    if (char === '(') {
      if (group) {
        throw fail(
          `groups cannot be nested; the group at column ${origin + group.index} is still open`,
          index
        );
      }
      group = { col, index, events: [], terminal: false };
      if (!ended) {
        extend(col);
      }
      col++;
      continue;
    }
    if (char === ')') {
      if (!group) {
        throw fail('")" closes a group, but no group is open', index);
      }
      const { events } = group;
      events.forEach((event, i) => (event.stack = { index: i, size: events.length }));
      if (events.length > 0 || group.terminal) {
        items.push({ kind: 'group', col: group.col, to: col, size: events.length });
      }
      if (!ended) {
        extend(col);
      }
      group = undefined;
      col++;
      continue;
    }
    if (ended) {
      col++;
      continue;
    }

    const at = group ? group.col : col;
    extend(col);
    const next = cells[index + 1];
    col++;
    switch (char) {
      case '-':
        continue;
      case '/':
        breaks.push(at);
        continue;
      case '^':
        items.push({ kind: 'subscribe', col: at });
        continue;
      case '!':
        closeSpan(at, 'cancel');
        items.push({ kind: 'cancel', col: at });
        continue;
      case '|':
      case '#':
        closeSpan(at, char === '|' ? 'close' : 'cancel');
        items.push({
          kind: char === '|' ? 'complete' : 'error',
          col: at,
          ...(group ? { grouped: true } : {}),
        });
        if (group) {
          group.terminal = true;
        }
        ended = true;
        if (segment) {
          segment.to = at;
        }
        endSegment();
        continue;
      case '[':
        if (!group && next !== undefined && SPAN_FILLS.has(next)) {
          closeSpan(at, 'close');
          span = { symbol: next, from: at };
          continue;
        }
        break;
      case ']':
      case '>':
        if (span) {
          closeSpan(at, char === ']' ? 'close' : 'open');
          continue;
        }
        break;
      default:
        if (span && SPAN_FILLS.has(char)) {
          continue;
        }
    }
    closeSpan(at, 'close');
    const event: MarbleEventItem = { kind: 'event', symbol: char, col: at };
    items.push(event);
    if (group) {
      group.events.push(event);
    } else if (next !== undefined && SPAN_FILLS.has(next)) {
      span = { symbol: next, from: at };
    }
  }
  if (group) {
    throw fail('the group opened here is never closed with ")"', group.index);
  }
  closeSpan(Math.max(0, col - 1), 'open');
  endSegment();
  const subscription = asSubscriptionLane(cells, items, segments, col);
  return subscription
    ? { items: subscription, segments: [], breaks, columns: col }
    : { items, segments, breaks, columns: col };
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
    const lane = interpretLane(cells, raw, origin);
    columns = Math.max(columns, lane.columns);
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
