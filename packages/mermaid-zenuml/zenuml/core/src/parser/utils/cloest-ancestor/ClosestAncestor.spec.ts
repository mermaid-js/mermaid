import { describe, expect, it } from 'vitest';
import { Fixture } from '../../../../test/unit/parser/fixture/Fixture';

describe('get closest ancestors', () => {
  it.each([
    ['A.m', Fixture.firstStatement, 0, 2],
    ['A.m {B.m}', Fixture.firstStatement, 0, 8],
    ['A.m {B.m}', Fixture.firstChild, 5, 7],
    ['A.m {B.m {C.m}}', Fixture.firstGrandChild, 10, 12],
  ])('should return the closest ancestor for code %s', (code, fn, start, stop) => {
    const context = fn(code);
    expect(context.ClosestAncestorStat().start.start).toBe(start);
    expect(context.ClosestAncestorStat().stop.stop).toBe(stop);
  });
});
