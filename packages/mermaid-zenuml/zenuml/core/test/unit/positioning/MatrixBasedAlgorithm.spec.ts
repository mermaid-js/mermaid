import { distance, final_pos } from '../../../src/positioning/MatrixBasedAlgorithm';

describe('go', () => {
  it('go', () => {
    let m = [
      [0, 100, 100, 800],
      [0, 0, 100, 0],
      [0, 0, 0, 100],
      [0, 0, 0, 0],
    ];
    expect(distance(0, 0, m)).toBe(0);
    expect(distance(0, 1, m)).toBe(100);
    expect(distance(0, 2, m)).toBe(200);
    expect(distance(0, 3, m)).toBe(800);
    expect(distance(1, 2, m)).toBe(100);
    expect(distance(1, 3, m)).toBe(700);
    expect(distance(2, 3, m)).toBe(600);
    expect(final_pos(1, m)).toBe(100);
    expect(final_pos(2, m)).toBe(200);
    expect(final_pos(3, m)).toBe(800);
  });

  it('go2', () => {
    let m = [
      [0, 100, 0, 100],
      [0, 0, 300, 800],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(distance(0, 0, m)).toBe(0);
    expect(distance(0, 1, m)).toBe(100);
    expect(distance(0, 2, m)).toBe(400);
    expect(distance(0, 3, m)).toBe(900);
    expect(distance(1, 2, m)).toBe(300);
    expect(distance(1, 3, m)).toBe(800);
    expect(distance(2, 3, m)).toBe(500);
  });

  it('go3', () => {
    let m = [
      [0, 300, 200, 700, 0],
      [0, 0, 100, 0, 500],
      [0, 0, 0, 300, 900],
      [0, 0, 0, 0, 200],
      [0, 0, 0, 0, 0],
    ];
    expect(distance(0, 0, m)).toBe(0);
    expect(distance(0, 1, m)).toBe(300);
    expect(distance(0, 2, m)).toBe(400);
    expect(distance(0, 3, m)).toBe(700);
    expect(distance(0, 4, m)).toBe(1300);
    expect(distance(1, 2, m)).toBe(100);
    expect(distance(1, 3, m)).toBe(400);
    expect(distance(1, 4, m)).toBe(1000);
    expect(distance(2, 3, m)).toBe(300);
    expect(distance(2, 4, m)).toBe(900);
    expect(distance(3, 4, m)).toBe(600);
  });
});
