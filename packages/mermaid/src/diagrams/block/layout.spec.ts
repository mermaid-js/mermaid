// @ts-ignore: jison doesn't export types
import { calculateBlockPosition } from './layout.js';

describe('Layout', function () {
  it('It shoud calulatepositions correctly', () => {
    expect(calculateBlockPosition(2, 0)).toEqual({ px: 0, py: 0 });
    expect(calculateBlockPosition(2, 1)).toEqual({ px: 1, py: 0 });
    expect(calculateBlockPosition(2, 2)).toEqual({ px: 0, py: 1 });
    expect(calculateBlockPosition(2, 3)).toEqual({ px: 1, py: 1 });
    expect(calculateBlockPosition(2, 4)).toEqual({ px: 0, py: 2 });
    expect(calculateBlockPosition(1, 3)).toEqual({ px: 0, py: 3 });
  });
});
