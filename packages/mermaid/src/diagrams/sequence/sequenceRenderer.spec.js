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
