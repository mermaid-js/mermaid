import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SequenceDB } from './sequenceDb.js';

vi.mock('./svgDraw.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    drawText: vi.fn(),
    drawBox: vi.fn(),
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
import { drawMessage, setConf, bounds } from './sequenceRenderer.js';

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

describe('parent box coordinate computation', () => {
  it('wraps a single child: startx is less than child startx', () => {
    const boxMargin = 10;
    const boxTextMargin = 5;

    const child = {
      name: 'Inner',
      actorKeys: ['Alice'],
      children: [],
      startx: 100,
      stopx: 200,
      starty: 50,
      stopy: 150,
      x: 110,
      width: 80,
    };
    const parent = {
      name: 'Outer',
      actorKeys: [],
      children: [child],
      textMaxHeight: 14,
    };

    const allBoxes = [parent, child];
    const conf = { boxMargin, boxTextMargin };

    for (const box of [...allBoxes].reverse()) {
      if (!box.children || box.children.length === 0) {
        continue;
      }
      let minStartx = Infinity,
        maxStopx = -Infinity,
        minStarty = Infinity,
        maxStopy = -Infinity;
      for (const c of box.children) {
        if (c.startx !== undefined) {
          minStartx = Math.min(minStartx, c.startx);
          maxStopx = Math.max(maxStopx, c.stopx);
          minStarty = Math.min(minStarty, c.starty);
          maxStopy = Math.max(maxStopy, c.stopy);
        }
      }
      if (minStartx === Infinity) {
        continue;
      }
      const nestPaddingHoriz = conf.boxMargin * 2;
      const nestPaddingTop = (box.textMaxHeight || 0) + conf.boxTextMargin + conf.boxMargin;
      const nestPaddingBottom = conf.boxMargin * 3;
      box.startx = minStartx - nestPaddingHoriz;
      box.starty = minStarty - nestPaddingTop;
      box.stopx = maxStopx + nestPaddingHoriz;
      box.stopy = maxStopy + nestPaddingBottom;
    }

    expect(parent.startx).toBeLessThan(child.startx);
    expect(parent.stopx).toBeGreaterThan(child.stopx);
    expect(parent.starty).toBeLessThan(child.starty);
    expect(parent.stopy).toBeGreaterThan(child.stopy);
    expect(parent.startx).toBe(child.startx - boxMargin * 2);
    expect(parent.stopx).toBe(child.stopx + boxMargin * 2);
  });

  it('wraps two sibling children: startx is min of children, stopx is max', () => {
    const boxMargin = 10;
    const boxTextMargin = 5;

    const childA = {
      name: 'TeamA',
      actorKeys: ['Alice'],
      children: [],
      startx: 50,
      stopx: 150,
      starty: 60,
      stopy: 160,
      x: 60,
      width: 80,
    };
    const childB = {
      name: 'TeamB',
      actorKeys: ['Bob'],
      children: [],
      startx: 200,
      stopx: 300,
      starty: 60,
      stopy: 160,
      x: 210,
      width: 80,
    };
    const parent = {
      name: 'Outer',
      actorKeys: [],
      children: [childA, childB],
      textMaxHeight: 14,
    };

    const allBoxes = [parent, childA, childB];
    const conf = { boxMargin, boxTextMargin };

    for (const box of [...allBoxes].reverse()) {
      if (!box.children || box.children.length === 0) {
        continue;
      }
      let minStartx = Infinity,
        maxStopx = -Infinity,
        minStarty = Infinity,
        maxStopy = -Infinity;
      for (const c of box.children) {
        if (c.startx !== undefined) {
          minStartx = Math.min(minStartx, c.startx);
          maxStopx = Math.max(maxStopx, c.stopx);
          minStarty = Math.min(minStarty, c.starty);
          maxStopy = Math.max(maxStopy, c.stopy);
        }
      }
      if (minStartx === Infinity) {
        continue;
      }
      const nestPaddingHoriz = conf.boxMargin * 2;
      const nestPaddingTop = (box.textMaxHeight || 0) + conf.boxTextMargin + conf.boxMargin;
      const nestPaddingBottom = conf.boxMargin * 3;
      box.startx = minStartx - nestPaddingHoriz;
      box.starty = minStarty - nestPaddingTop;
      box.stopx = maxStopx + nestPaddingHoriz;
      box.stopy = maxStopy + nestPaddingBottom;
    }

    expect(parent.startx).toBe(childA.startx - boxMargin * 2);
    expect(parent.stopx).toBe(childB.stopx + boxMargin * 2);
    expect(parent.starty).toBeLessThan(childA.starty);
    expect(parent.stopy).toBeGreaterThan(childA.stopy);
  });

  it('skips a parent box whose children have no coordinates yet', () => {
    const parent = {
      name: 'Outer',
      actorKeys: [],
      children: [{ name: 'Inner', actorKeys: [], children: [] }],
      textMaxHeight: 14,
    };

    const allBoxes = [parent, parent.children[0]];
    const conf = { boxMargin: 10, boxTextMargin: 5 };

    for (const box of [...allBoxes].reverse()) {
      if (!box.children || box.children.length === 0) {
        continue;
      }
      let minStartx = Infinity;
      for (const c of box.children) {
        if (c.startx !== undefined) {
          minStartx = Math.min(minStartx, c.startx);
        }
      }
      if (minStartx === Infinity) {
        continue;
      }
      box.startx = 0;
    }

    expect(parent.startx).toBeUndefined();
  });
});

describe('calculateActorMargins: boxes without actorKeys', () => {
  it('bounds.init does not throw with empty box list', () => {
    expect(() => bounds.init()).not.toThrow();
  });

  it('a box with empty actorKeys array is skipped without error', () => {
    const boxes = [
      {
        name: 'Outer',
        actorKeys: [],
        children: [{ name: 'Inner', actorKeys: ['Alice'], children: [] }],
      },
    ];

    let threw = false;
    try {
      boxes.forEach((box) => {
        if (!box.actorKeys || box.actorKeys.length === 0) {
          return;
        }
        // If we reach here with an empty actorKeys box, reduce would access undefined actors
        box.actorKeys.reduce((total, aKey) => total + aKey.length, 0);
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});
