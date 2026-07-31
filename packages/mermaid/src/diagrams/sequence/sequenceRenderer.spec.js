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

vi.mock('../common/common.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    calculateMathMLDimensions: vi.fn(() => Promise.resolve({ width: 200, height: 30 })),
  };
});

import * as svgDraw from './svgDraw.js';
import { calculateMathMLDimensions } from '../common/common.js';
import utils from '../../utils.js';
import { buildNoteModel, drawMessage, setConf } from './sequenceRenderer.js';

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

describe('buildNoteModel (#6993)', () => {
  const diagObj = { db: { PLACEMENT: { LEFTOF: 0, RIGHTOF: 1, OVER: 2 } } };

  beforeEach(() => {
    setConf({
      width: 80,
      noteMargin: 10,
      wrapPadding: 10,
      noteFontFamily: 'sans-serif',
      noteFontSize: 14,
      noteFontWeight: '400',
    });
    vi.mocked(calculateMathMLDimensions).mockClear();
    vi.mocked(utils.calculateTextDimensions).mockClear();
  });

  it('sizes a KaTeX note over a single actor from its MathML dimensions', async () => {
    const actors = new Map([['B', { x: 100, width: 150 }]]);
    const msg = {
      from: 'B',
      to: 'B',
      message: '$$(sk_B, pk_B)\\leftarrow KeyGen(1^\\lambda)$$',
      wrap: false,
      placement: diagObj.db.PLACEMENT.OVER,
    };

    const noteModel = await buildNoteModel(msg, actors, diagObj);

    // max(actor width, conf.width, MathML width (200) + 2 * noteMargin)
    expect(noteModel.width).toBe(220);
    expect(noteModel.startx).toBe(100 + (150 - 220) / 2);
    expect(calculateMathMLDimensions).toHaveBeenCalledTimes(1);
    // The raw `$$...$$` source must not be measured as plain text: doing so is
    // what inflated the note's padding.
    expect(utils.calculateTextDimensions).not.toHaveBeenCalled();
  });

  it('still sizes a plain-text note over a single actor from its text dimensions', async () => {
    const actors = new Map([['B', { x: 100, width: 150 }]]);
    const msg = {
      from: 'B',
      to: 'B',
      message: 'a plain note',
      wrap: false,
      placement: diagObj.db.PLACEMENT.OVER,
    };

    const noteModel = await buildNoteModel(msg, actors, diagObj);

    // max(actor width, conf.width, text width (40) + 2 * noteMargin)
    expect(noteModel.width).toBe(150);
    expect(calculateMathMLDimensions).not.toHaveBeenCalled();
    expect(utils.calculateTextDimensions).toHaveBeenCalledWith('a plain note', {
      fontFamily: 'sans-serif',
      fontSize: 14,
      fontWeight: '400',
    });
  });
});
