import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db.js';
import { parser } from './timing.chevrotain.js';

describe('timing diagram parser', () => {
  beforeEach(() => db.clear());

  it('parses declarations, signal-major values, and time-major transitions', async () => {
    await parser.parse(`timingDiagram-beta
      title Synchronous bus read
      accTitle: Bus read timing
      accDescr {A clocked read transaction.}
      timeUnit ns
      %% declarations
      clock CLK as "Clock" : period 8, duty 25%, offset 1
      binary RST as "Reset"
      state S as "Controller" : Idle, Waiting, Processing
      bus DATA as "Data bus"
      analog V as "Voltage" : min 0, max 5.5, interpolation step

      RST : high x2, low x6
      DATA : Z x2, "D0", "D1"

      at 0
        S is Idle
        V is 0
      at 16
        S is Processing
        V is 3.3
    `);

    expect(db.getDiagramTitle()).toBe('Synchronous bus read');
    expect(db.getAccTitle()).toBe('Bus read timing');
    expect(db.getAccDescription()).toBe('A clocked read transaction.');
    expect(db.getTimeUnit()).toBe('ns');
    expect(db.getSignals()).toEqual([
      {
        id: 'CLK',
        label: 'Clock',
        type: 'clock',
        clock: { period: 8, duty: 25, offset: 1 },
        sequence: [],
        events: [],
      },
      {
        id: 'RST',
        label: 'Reset',
        type: 'binary',
        sequence: [
          { value: 1, duration: 2 },
          { value: 0, duration: 6 },
        ],
        events: [],
      },
      {
        id: 'S',
        label: 'Controller',
        type: 'state',
        states: ['Idle', 'Waiting', 'Processing'],
        sequence: [],
        events: [
          { time: 0, value: 'Idle' },
          { time: 16, value: 'Processing' },
        ],
      },
      {
        id: 'DATA',
        label: 'Data bus',
        type: 'bus',
        sequence: [
          { value: 'Z', duration: 2 },
          { value: 'D0', duration: 1 },
          { value: 'D1', duration: 1 },
        ],
        events: [],
      },
      {
        id: 'V',
        label: 'Voltage',
        type: 'analog',
        analog: { min: 0, max: 5.5, interpolation: 'step' },
        sequence: [],
        events: [
          { time: 0, value: 0 },
          { time: 16, value: 3.3 },
        ],
      },
    ]);
  });

  it('accepts quoted values and binary aliases', async () => {
    await parser.parse(`timingDiagram-beta
      binary B
      state S
      B : true, false, X, Z
      S : "Waiting for data" x2, Done
    `);

    expect(db.getSignal('B')?.sequence.map((segment) => segment.value)).toEqual([1, 0, 'x', 'z']);
    expect(db.getSignal('S')?.sequence).toEqual([
      { value: 'Waiting for data', duration: 2 },
      { value: 'Done', duration: 1 },
    ]);
  });

  it('allows states not listed in the declaration', async () => {
    await parser.parse(`timingDiagram-beta
      state S : Idle
      at 0
        S is A_state_added_later
    `);
    expect(db.getSignal('S')?.events[0].value).toBe('A_state_added_later');
  });

  it.each([
    ['duplicate signal IDs', `timingDiagram-beta\nbinary A\nbus A`, /already declared/],
    ['unknown signal references', `timingDiagram-beta\nbinary A\nB : 1`, /Unknown timing signal/],
    ['invalid clock periods', `timingDiagram-beta\nclock CLK : period 0`, /period greater than 0/],
    [
      'invalid clock duty cycles',
      `timingDiagram-beta\nclock CLK : period 2, duty 101%`,
      /duty must be between/,
    ],
    [
      'invalid run lengths',
      `timingDiagram-beta\nbinary A\nA : 1 x0`,
      /run lengths must be positive integers/,
    ],
    [
      'mixed sequence and transition input',
      `timingDiagram-beta\nbinary A\nA : 0, 1\nat 4\n A is 0`,
      /cannot mix/,
    ],
    ['empty at blocks', `timingDiagram-beta\nbinary A\nat 4`, /must contain at least one/],
    [
      'non-numeric analog values',
      `timingDiagram-beta\nanalog A\nA : high`,
      /values must be numbers/,
    ],
  ])('rejects %s', async (_name, source, expected) => {
    await expect(parser.parse(source)).rejects.toThrow(expected);
  });
});
