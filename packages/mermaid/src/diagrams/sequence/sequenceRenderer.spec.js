import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SequenceDB } from './sequenceDb.js';

vi.mock('./svgDraw.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    drawText: vi.fn(),
  };
});

vi.mock('../../utils.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      calculateTextDimensions: vi.fn(() => ({ width: 40, height: 14 })),
    },
  };
});

import * as svgDraw from './svgDraw.js';
import { drawMessage, setConf } from './sequenceRenderer.js';

function mockDiagram(name = 'svg') {
  const children = [];
  const elem = {
    get __children() {
      return children;
    },
    __name: name,
    append(n) {
      const child = mockDiagram(n);
      children.push(child);
      return child;
    },
    lower: vi.fn(() => elem),
    attr: vi.fn(() => elem),
    style: vi.fn(() => elem),
    text: vi.fn(() => elem),
  };
  return elem;
}

describe('drawMessage (#3594)', () => {
  beforeEach(() => {
    setConf({
      messageFontFamily: 'sans-serif',
      messageFontSize: 14,
      messageFontWeight: '400',
      messageAlign: 'left',
      wrapPadding: 10,
      arrowMarkerAbsolute: false,
      showSequenceNumbers: false,
    });
    vi.mocked(svgDraw.drawText).mockClear();
  });

  it('passes min(startx, stopx) and abs(stopx - startx) to drawText when startx > stopx', async () => {
    const diagram = mockDiagram();
    const startx = 320;
    const stopx = 80;
    const sequenceDb = new SequenceDB();
    const diagObj = { db: sequenceDb };

    const msgModel = {
      startx,
      stopx,
      starty: 40,
      stopy: 90,
      message: 'RTL label',
      type: sequenceDb.LINETYPE.SOLID,
      sequenceIndex: 1,
      sequenceVisible: false,
      id: '0',
      from: 'Bob',
      to: 'Alice',
      fromBounds: startx - 20,
      toBounds: stopx + 20,
    };

    const msg = { type: sequenceDb.LINETYPE.SOLID, centralConnection: 0 };

    await drawMessage(diagram, msgModel, 100, diagObj, msg, 'test-id');

    expect(svgDraw.drawText).toHaveBeenCalled();
    const messageTextCalls = vi
      .mocked(svgDraw.drawText)
      .mock.calls.filter((call) => call[1]?.class === 'messageText');
    expect(messageTextCalls).toHaveLength(1);
    const textObj = messageTextCalls[0][1];
    expect(textObj.x).toBe(Math.min(startx, stopx));
    expect(textObj.width).toBe(Math.abs(stopx - startx));
  });
});

describe('drawMessage with autonumber both (#6988)', () => {
  // Alice's lifeline is at x = 75 and Bob's at x = 275, the number is drawn with a radius of 12
  const ALICE = 75;
  const BOB = 275;

  const sequenceDb = new SequenceDB();
  const { LINETYPE } = sequenceDb;
  const diagObj = { db: sequenceDb };
  vi.spyOn(sequenceDb, 'getActors').mockReturnValue(
    new Map([
      ['Alice', { x: 0, width: 150 }],
      ['Bob', { x: 200, width: 150 }],
    ])
  );

  const attrsOf = (elem) => Object.fromEntries(elem.attr.mock.calls);

  /** Draws a message between Alice and Bob and returns the parts of it that the tests look at */
  const draw = async ({ msg = {}, ...model }) => {
    const diagram = mockDiagram();
    const isLeftToRight = (model.from ?? 'Alice') === 'Alice';
    const fromTo = isLeftToRight ? {} : { from: 'Bob', to: 'Alice' };
    await drawMessage(
      diagram,
      {
        from: 'Alice',
        to: 'Bob',
        startx: isLeftToRight ? ALICE + 1 : BOB - 1,
        stopx: isLeftToRight ? BOB - 1 : ALICE + 1,
        starty: 40,
        stopy: 90,
        message: 'hello',
        type: LINETYPE.SOLID_OPEN,
        sequenceIndex: 1,
        receiverSequenceIndex: 2,
        sequenceVisible: true,
        id: '0',
        fromBounds: ALICE - 1,
        toBounds: BOB + 1,
        ...model,
      },
      100,
      diagObj,
      { type: model.type ?? LINETYPE.SOLID_OPEN, from: 'Alice', to: 'Bob', ...msg, ...fromTo },
      'test-id'
    );

    const line = diagram.__children.find(
      (child) => child.__name === 'line' && attrsOf(child)['data-et'] === 'message'
    );
    const numbers = diagram.__children
      .filter((child) => child.__name === 'text')
      .map((text) => ({
        x: attrsOf(text).x,
        index: text.text.mock.calls[0][0],
        fontSize: attrsOf(text)['font-size'],
      }));
    const circles = diagram.__children
      .filter((child) => child.__name === 'g')
      .flatMap((group) => group.__children)
      .map((circle) => attrsOf(circle).cx);

    return { line: attrsOf(line), numbers, circles };
  };

  beforeEach(() => {
    setConf({
      messageFontFamily: 'sans-serif',
      messageFontSize: 14,
      messageFontWeight: '400',
      messageAlign: 'left',
      wrapPadding: 10,
      arrowMarkerAbsolute: false,
      showSequenceNumbers: false,
    });
  });

  it('puts the numbers on the lifelines of the sender and the receiver', async () => {
    const { numbers } = await draw({});

    expect(numbers).toMatchObject([
      { x: ALICE, index: 1 },
      { x: BOB, index: 2 },
    ]);
  });

  it('puts the lower number on the sender when the arrow goes right to left', async () => {
    const { numbers } = await draw({ from: 'Bob', to: 'Alice' });

    expect(numbers).toMatchObject([
      { x: BOB, index: 1 },
      { x: ALICE, index: 2 },
    ]);
  });

  it('stops the arrowhead at the receiver number', async () => {
    const { line } = await draw({ type: LINETYPE.SOLID, stopx: BOB - 4 });

    expect(line.x1).toBe(ALICE + 1);
    expect(line.x2).toBe(BOB - 14);
  });

  it('stops the arrowhead at the receiver number when the arrow goes right to left', async () => {
    const { line } = await draw({
      type: LINETYPE.SOLID,
      from: 'Bob',
      to: 'Alice',
      stopx: ALICE + 4,
    });

    expect(line.x1).toBe(BOB - 1);
    expect(line.x2).toBe(ALICE + 14);
  });

  it.each(['SOLID_CROSS', 'DOTTED_CROSS', 'SOLID_POINT', 'DOTTED_POINT'])(
    'keeps the longer %s arrowhead clear of the number',
    async (type) => {
      const { line } = await draw({ type: LINETYPE[type], stopx: BOB - 4 });

      expect(line.x2).toBe(BOB - 17);
    }
  );

  it.each(['SOLID_OPEN', 'DOTTED_OPEN'])(
    'leaves the %s line alone because it has no arrowhead',
    async (type) => {
      const { line } = await draw({ type: LINETYPE[type] });

      expect(line.x1).toBe(ALICE + 1);
      expect(line.x2).toBe(BOB - 1);
    }
  );

  it.each([
    'SOLID_ARROW_TOP_REVERSE',
    'SOLID_ARROW_TOP_REVERSE_DOTTED',
    'SOLID_ARROW_BOTTOM_REVERSE',
    'SOLID_ARROW_BOTTOM_REVERSE_DOTTED',
    'STICK_ARROW_TOP_REVERSE',
    'STICK_ARROW_TOP_REVERSE_DOTTED',
    'STICK_ARROW_BOTTOM_REVERSE',
    'STICK_ARROW_BOTTOM_REVERSE_DOTTED',
  ])('treats the head of a %s arrow as the receiver', async (type) => {
    const { line, numbers } = await draw({ type: LINETYPE[type], startx: ALICE + 4 });

    expect(numbers).toMatchObject([
      { x: BOB, index: 1 },
      { x: ALICE, index: 2 },
    ]);
    expect(line.x1).toBe(ALICE + 14);
    expect(line.x2).toBe(BOB - 1);
  });

  it.each(['BIDIRECTIONAL_SOLID', 'BIDIRECTIONAL_DOTTED'])(
    'gives the participant written first the lower number on a %s arrow',
    async (type) => {
      const { line, numbers } = await draw({
        type: LINETYPE[type],
        from: 'Bob',
        to: 'Alice',
        startx: BOB - 4,
        stopx: ALICE + 4,
      });

      expect(numbers).toMatchObject([
        { x: BOB, index: 1 },
        { x: ALICE, index: 2 },
      ]);
      expect(line.x1).toBe(BOB - 14);
      expect(line.x2).toBe(ALICE + 14);
    }
  );

  it('uses the outer edge of an activation box like a single number does', async () => {
    const { line, numbers } = await draw({
      type: LINETYPE.SOLID,
      fromBounds: ALICE - 5,
      toBounds: BOB + 5,
      startx: ALICE + 5,
      stopx: BOB - 8,
    });

    expect(numbers).toMatchObject([{ x: ALICE - 4 }, { x: BOB + 4 }]);
    expect(line.x1).toBe(ALICE + 5);
    expect(line.x2).toBe(BOB - 10);
  });

  it('moves the numbers next to the box of a created or destroyed participant', async () => {
    const { line, numbers } = await draw({
      type: LINETYPE.SOLID,
      fromNumberInset: 90,
      toNumberInset: 90,
      startx: ALICE + 76,
      stopx: BOB - 82,
    });

    expect(numbers).toMatchObject([{ x: ALICE + 90 }, { x: BOB - 90 }]);
    expect(line.x1).toBe(ALICE + 76);
    expect(line.x2).toBe(BOB - 104);
  });

  it('moves the numbers next to the box when the arrow goes right to left', async () => {
    const { numbers } = await draw({
      from: 'Bob',
      to: 'Alice',
      fromNumberInset: 90,
      toNumberInset: 90,
      startx: BOB - 76,
      stopx: ALICE + 82,
    });

    expect(numbers).toMatchObject([{ x: BOB - 90 }, { x: ALICE + 90 }]);
  });

  describe('with central connections', () => {
    it('puts the circle between the arrowhead and the receiver number', async () => {
      const { line, circles } = await draw({
        type: LINETYPE.SOLID,
        msg: { centralConnection: LINETYPE.CENTRAL_CONNECTION },
      });

      expect(circles).toEqual([BOB - 16.5]);
      expect(line.x2).toBe(BOB - 23.5);
    });

    it('puts the circle next to the sender number', async () => {
      const { line, circles } = await draw({
        type: LINETYPE.SOLID,
        stopx: BOB - 4,
        msg: { centralConnection: LINETYPE.CENTRAL_CONNECTION_REVERSE },
      });

      expect(circles).toEqual([ALICE + 16.5]);
      expect(line.x1).toBe(ALICE + 1);
      expect(line.x2).toBe(BOB - 14);
    });

    it('puts a circle next to both numbers', async () => {
      const { line, circles } = await draw({
        type: LINETYPE.BIDIRECTIONAL_SOLID,
        msg: { centralConnection: LINETYPE.CENTRAL_CONNECTION_DUAL },
      });

      expect(circles).toEqual([ALICE + 16.5, BOB - 16.5]);
      expect(line.x1).toBe(ALICE + 23.5);
      expect(line.x2).toBe(BOB - 23.5);
    });

    it('mirrors the circles when the arrow goes right to left', async () => {
      const { line, circles } = await draw({
        type: LINETYPE.SOLID,
        from: 'Bob',
        to: 'Alice',
        msg: { centralConnection: LINETYPE.CENTRAL_CONNECTION_DUAL },
      });

      expect(circles).toEqual([BOB - 16.5, ALICE + 16.5]);
      expect(line.x2).toBe(ALICE + 23.5);
    });

    it('keeps the circle clear of a reverse arrow head at the receiver number', async () => {
      const { line, circles } = await draw({
        type: LINETYPE.SOLID_ARROW_TOP_REVERSE,
        msg: { centralConnection: LINETYPE.CENTRAL_CONNECTION_REVERSE },
      });

      expect(circles).toEqual([ALICE + 16.5]);
      expect(line.x1).toBe(ALICE + 23.5);
    });
  });

  it('picks the font size for each number on its own', async () => {
    const { numbers } = await draw({ sequenceIndex: 999, receiverSequenceIndex: 1000 });

    expect(numbers).toMatchObject([
      { index: 999, fontSize: '12px' },
      { index: 1000, fontSize: '9px' },
    ]);
  });

  it('uses the smallest font for a number of more than five digits', async () => {
    const { numbers } = await draw({ sequenceIndex: 99999, receiverSequenceIndex: 100000 });

    expect(numbers).toMatchObject([
      { index: 99999, fontSize: '9px' },
      { index: 100000, fontSize: '7px' },
    ]);
  });

  describe('with a single number and central connections', () => {
    it.each([
      ['CENTRAL_CONNECTION', 'SOLID', [BOB]],
      ['CENTRAL_CONNECTION', 'SOLID_ARROW_TOP_REVERSE', [BOB - 16.5]],
      ['CENTRAL_CONNECTION_REVERSE', 'SOLID', [ALICE + 16.5]],
      ['CENTRAL_CONNECTION_REVERSE', 'SOLID_ARROW_TOP_REVERSE', [ALICE]],
      ['CENTRAL_CONNECTION_DUAL', 'SOLID', [ALICE + 16.5, BOB]],
      ['CENTRAL_CONNECTION_DUAL', 'SOLID_ARROW_TOP_REVERSE', [ALICE, BOB - 16.5]],
    ])('only moves the circle that shares its end with the number: %s %s', async (...args) => {
      const [centralConnection, type, expected] = args;
      const { circles } = await draw({
        type: LINETYPE[type],
        receiverSequenceIndex: undefined,
        msg: { centralConnection: LINETYPE[centralConnection] },
      });

      expect(circles).toEqual(expected);
    });

    it('leaves the circles on the lifelines without numbers', async () => {
      const { circles } = await draw({
        type: LINETYPE.SOLID,
        receiverSequenceIndex: undefined,
        sequenceVisible: false,
        msg: { centralConnection: LINETYPE.CENTRAL_CONNECTION_DUAL },
      });

      expect(circles).toEqual([ALICE, BOB]);
    });
  });

  it('keeps a single number on the lifeline', async () => {
    const { line, numbers } = await draw({
      type: LINETYPE.SOLID,
      receiverSequenceIndex: undefined,
      toNumberInset: 90,
      stopx: BOB - 4,
    });

    expect(numbers).toMatchObject([{ x: ALICE, index: 1 }]);
    expect(line.x2).toBe(BOB - 4);
  });
});
