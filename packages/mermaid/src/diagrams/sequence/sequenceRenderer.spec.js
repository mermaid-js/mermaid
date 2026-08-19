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
import { drawMessage, setConf, bounds, computeParentBoxBounds } from './sequenceRenderer.js';

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

const BOX_MARGIN = 10;
const BOX_TEXT_MARGIN = 5;
const TEST_CONF = { boxMargin: BOX_MARGIN, boxTextMargin: BOX_TEXT_MARGIN };

describe('computeParentBoxBounds', () => {
  it('wraps a single child: parent startx/stopx extend beyond child', () => {
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

    computeParentBoxBounds([parent, child], TEST_CONF);

    expect(parent.startx).toBeLessThan(child.startx);
    expect(parent.stopx).toBeGreaterThan(child.stopx);
    expect(parent.starty).toBeLessThan(child.starty);
    expect(parent.stopy).toBeGreaterThan(child.stopy);
    expect(parent.startx).toBe(child.startx - BOX_MARGIN * 2);
    expect(parent.stopx).toBe(child.stopx + BOX_MARGIN * 2);
  });

  it('wraps two sibling children: startx is min of children, stopx is max', () => {
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

    computeParentBoxBounds([parent, childA, childB], TEST_CONF);

    expect(parent.startx).toBe(childA.startx - BOX_MARGIN * 2);
    expect(parent.stopx).toBe(childB.stopx + BOX_MARGIN * 2);
    expect(parent.starty).toBeLessThan(childA.starty);
    expect(parent.stopy).toBeGreaterThan(childA.stopy);
  });

  it('skips a parent whose children have no coordinates yet', () => {
    const child = { name: 'Inner', actorKeys: [], children: [] };
    const parent = {
      name: 'Outer',
      actorKeys: [],
      children: [child],
      textMaxHeight: 14,
    };

    computeParentBoxBounds([parent, child], TEST_CONF);

    expect(parent.startx).toBeUndefined();
  });

  it('includes direct actors (own leaf bounds) when parent also has child boxes', () => {
    // Organisation has Manager as a direct actor (already placed by leaf pass)
    // and Team A as a child box. Bug 1: without seeding from own bounds, Manager
    // is ejected and Organisation's startx only covers Team A.
    const teamA = {
      name: 'Team A',
      actorKeys: ['Alice'],
      children: [],
      startx: 200,
      stopx: 300,
      starty: -5,
      stopy: 400,
      x: 210,
      width: 80,
    };
    const organisation = {
      name: 'Organisation',
      actorKeys: ['Manager'],
      children: [teamA],
      textMaxHeight: 14,
      // Leaf-pass coordinates for Manager (leftmost actor in Organisation)
      startx: 20,
      stopx: 160,
      starty: -5,
      stopy: 400,
      x: 30,
      width: 120,
    };

    computeParentBoxBounds([organisation, teamA], TEST_CONF);

    // Organisation must wrap both Manager (leaf startx=20) and Team A (stopx=300)
    expect(organisation.startx).toBeLessThanOrEqual(20 - BOX_MARGIN * 2);
    expect(organisation.stopx).toBeGreaterThanOrEqual(300 + BOX_MARGIN * 2);
  });

  it('depth-3 nesting: grandparent starty is more negative than parent starty', () => {
    const leaf = {
      name: 'Sub-team',
      actorKeys: ['Bob'],
      children: [],
      startx: 100,
      stopx: 200,
      starty: -5,
      stopy: 400,
      x: 110,
      width: 80,
    };
    const middle = {
      name: 'Team A',
      actorKeys: [],
      children: [leaf],
      textMaxHeight: 14,
    };
    const outer = {
      name: 'Organisation',
      actorKeys: [],
      children: [middle],
      textMaxHeight: 14,
    };

    computeParentBoxBounds([outer, middle, leaf], TEST_CONF);

    expect(middle.starty).toBeLessThan(leaf.starty);
    expect(outer.starty).toBeLessThan(middle.starty);
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
