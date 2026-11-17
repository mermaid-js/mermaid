import { describe, it, expect } from 'vitest';
import { routeContacts, segmentContacts, selfContacts } from '../routeContacts.js';

const p = (x: number, y: number) => ({ x, y });

describe('segmentContacts', () => {
  it('finds the point where two segments cross', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(5, -5), p(5, 5))).toEqual([p(5, 0)]);
  });

  it('finds the point where two diagonal segments cross', () => {
    expect(segmentContacts(p(0, 0), p(10, 10), p(0, 10), p(10, 0))).toEqual([p(5, 5)]);
  });

  it('finds only the end of a slanted segment that ends on the other', () => {
    expect(segmentContacts(p(5, 5), p(5, -5), p(0, 3), p(5, 0))).toEqual([p(5, 0)]);
  });

  it('finds a slanted segment that starts on the other', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(5, 0), p(8, 5))).toEqual([p(5, 0)]);
  });

  it.each([
    [p(0, 0), p(5, 0)],
    [p(10, 0), p(5, 0)],
  ])('finds a segment from %o that ends on the other', (b1, b2) => {
    expect(segmentContacts(p(5, 5), p(5, -5), b1, b2)).toEqual([p(5, 0)]);
  });

  it.each([
    [p(5, 5), p(5, 0)],
    [p(5, -5), p(5, 0)],
  ])('finds the other segment from %o ending on it', (a1, a2) => {
    expect(segmentContacts(a1, a2, p(0, 0), p(10, 0))).toEqual([p(5, 0)]);
  });

  it('finds a segment that ends on the other', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(5, 0), p(5, 5))).toEqual([p(5, 0)]);
    expect(segmentContacts(p(5, 0), p(5, 5), p(0, 0), p(10, 0))).toEqual([p(5, 0)]);
  });

  it('finds nothing for segments that miss each other', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(5, 1), p(5, 5))).toEqual([]);
    expect(segmentContacts(p(0, 0), p(10, 0), p(11, -5), p(11, 5))).toEqual([]);
    expect(segmentContacts(p(0, 0), p(10, 0), p(0, 1), p(10, 1))).toEqual([]);
  });

  it('finds both ends of the stretch two segments share along one line', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(15, 0), p(4, 0))).toEqual([p(4, 0), p(10, 0)]);
    expect(segmentContacts(p(0, 0), p(0, 10), p(0, 2), p(0, 6))).toEqual([p(0, 2), p(0, 6)]);
  });

  it('finds the shared stretch of two segments away from the origin', () => {
    expect(segmentContacts(p(10, 0), p(20, 0), p(15, 0), p(30, 0))).toEqual([p(15, 0), p(20, 0)]);
    expect(segmentContacts(p(0, 10), p(0, 20), p(0, 15), p(0, 30))).toEqual([p(0, 15), p(0, 20)]);
  });

  it('finds the one point two segments on one line share at their ends', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(10, 0), p(20, 0))).toEqual([p(10, 0)]);
  });

  it('finds nothing for segments on one line that leave a gap', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(11, 0), p(20, 0))).toEqual([]);
  });

  it('finds nothing for a segment of no length off the other', () => {
    expect(segmentContacts(p(3, 3), p(3, 3), p(0, 0), p(10, 0))).toEqual([]);
    expect(segmentContacts(p(0, 0), p(10, 0), p(3, 3), p(3, 3))).toEqual([]);
  });

  it('finds a point of no length that lies on the other segment', () => {
    expect(segmentContacts(p(0, 0), p(10, 0), p(3, 0), p(3, 0))).toEqual([p(3, 0)]);
  });
});

describe('routeContacts', () => {
  it('counts a crossing at a bend of one route once', () => {
    const run = [p(166, 169), p(166, 273), p(166, 330)];
    expect(routeContacts(run, [p(146, 273), p(186, 273)])).toEqual([p(166, 273)]);
  });

  it('leaves out the point where both routes end, at the node they share', () => {
    const into = [p(0, 0), p(0, 10)];
    expect(routeContacts(into, [p(10, 0), p(10, 5), p(0, 5), p(0, 10)])).toEqual([p(0, 5)]);
    expect(routeContacts(into, [p(-10, 10), p(0, 10)])).toEqual([]);
  });

  it.each([[p(0.01, 10)], [p(0, 10.01)]])(
    'takes an end within a hundredth of a pixel, at %o, for the same end',
    (end) => {
      expect(routeContacts([p(0, 0), p(0, 10)], [p(-10, 10), end])).toEqual([]);
    }
  );

  it('keeps a point where only one of the routes ends', () => {
    expect(routeContacts([p(0, 0), p(0, 10)], [p(-5, 10), p(5, 10)])).toEqual([p(0, 10)]);
  });
});

describe('selfContacts', () => {
  it('finds none on a route that turns without meeting itself', () => {
    expect(selfContacts([p(0, 0), p(0, 10), p(10, 10), p(10, 20)])).toBe(0);
    expect(selfContacts([p(0, 0), p(0, 10), p(0, 20)])).toBe(0);
  });

  it('counts a turn that doubles back along the segment before it', () => {
    expect(selfContacts([p(250, 200), p(250, 330), p(250, 240)])).toBe(1);
  });

  it('counts a turn back along a horizontal segment', () => {
    expect(selfContacts([p(300, 0), p(100, 0), p(200, 0)])).toBe(1);
  });

  it.each([[[p(-300, 0), p(-200, 0), p(-100, 0)]], [[p(0, -300), p(0, -200), p(0, -100)]]])(
    'finds none on a straight route through %o',
    (route) => {
      expect(selfContacts(route)).toBe(0);
    }
  );

  it('finds none at a sharp turn that does not run back along the same line', () => {
    expect(selfContacts([p(0, 0), p(10, 0), p(0, 5)])).toBe(0);
  });

  it('finds none at a repeated point', () => {
    expect(selfContacts([p(0, 0), p(0, 10), p(0, 10)])).toBe(0);
  });

  it('counts each point where the route crosses itself', () => {
    expect(selfContacts([p(0, 0), p(0, 20), p(10, 20), p(10, 10), p(-10, 10)])).toBe(1);
  });
});
