import { placeInFirstFreeRow } from './ganttRenderer.js';

describe('gantt vert label packing', () => {
  it('keeps non-overlapping labels on the first row', () => {
    const rows = [];
    expect(placeInFirstFreeRow(rows, 0, 10)).toBe(0);
    expect(placeInFirstFreeRow(rows, 20, 30)).toBe(0);
    expect(rows).toHaveLength(1);
  });

  it('pushes an overlapping label to the next row', () => {
    const rows = [];
    placeInFirstFreeRow(rows, 0, 10);
    // This is the #8026 case: two verts close together in time.
    expect(placeInFirstFreeRow(rows, 5, 15)).toBe(1);
  });

  it('reuses an earlier row once the label clears it', () => {
    const rows = [];
    placeInFirstFreeRow(rows, 0, 10); // row 0
    placeInFirstFreeRow(rows, 5, 15); // row 1
    // Clears row 0's only occupant, so it belongs back on row 0.
    expect(placeInFirstFreeRow(rows, 40, 50)).toBe(0);
  });

  it('stacks a pile-up onto successive rows', () => {
    const rows = [];
    const placed = [0, 1, 2, 3].map((n) => placeInFirstFreeRow(rows, n, n + 10));
    expect(placed).toStrictEqual([0, 1, 2, 3]);
  });

  it('treats labels that merely touch as non-overlapping', () => {
    const rows = [];
    placeInFirstFreeRow(rows, 0, 10);
    expect(placeInFirstFreeRow(rows, 10, 20)).toBe(0);
  });
});
