/** Minimal dense linear algebra used by the QPSC solver (§2). */

export type Matrix = number[][];

export function dot(a: readonly number[], b: readonly number[]): number {
  let total = 0;
  for (const [i, value] of a.entries()) {
    total += value * b[i];
  }
  return total;
}

/** `A * v` for a dense symmetric matrix. */
export function multiply(A: Matrix, v: readonly number[]): number[] {
  const out = new Array<number>(v.length).fill(0);
  for (const [i, row] of A.entries()) {
    let total = 0;
    for (const [j, value] of v.entries()) {
      total += row[j] * value;
    }
    out[i] = total;
  }
  return out;
}

/** Euclidean distance between two coordinate vectors. */
export function distance(a: readonly number[], b: readonly number[]): number {
  let total = 0;
  for (const [i, value] of a.entries()) {
    const delta = value - b[i];
    total += delta * delta;
  }
  return Math.sqrt(total);
}
