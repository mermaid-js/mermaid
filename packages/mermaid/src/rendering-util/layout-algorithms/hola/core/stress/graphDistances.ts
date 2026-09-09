/**
 * All-pairs shortest path distances on the *undirected* projection of the
 * topology (guide §3.1). Unit edge weights, breadth-first from every source.
 */

export interface GraphDistances {
  ids: string[];
  /** `get(a, b)` is the hop count, or `Infinity` when disconnected. */
  get(a: string, b: string): number;
}

export function computeGraphDistances(
  ids: string[],
  adjacency: Map<string, Set<string>>
): GraphDistances {
  const index = new Map<string, number>();
  ids.forEach((id, i) => index.set(id, i));

  const n = ids.length;
  const matrix = new Float64Array(n * n).fill(Infinity);

  const queue: number[] = new Array(n);
  for (let s = 0; s < n; s++) {
    let head = 0;
    let tail = 0;
    matrix[s * n + s] = 0;
    queue[tail++] = s;
    while (head < tail) {
      const current = queue[head++];
      const currentDistance = matrix[s * n + current];
      for (const neighbour of adjacency.get(ids[current]) ?? []) {
        const j = index.get(neighbour);
        if (j === undefined) {
          continue;
        }
        if (matrix[s * n + j] === Infinity) {
          matrix[s * n + j] = currentDistance + 1;
          queue[tail++] = j;
        }
      }
    }
  }

  return {
    ids,
    get(a: string, b: string): number {
      const i = index.get(a);
      const j = index.get(b);
      if (i === undefined || j === undefined) {
        return Infinity;
      }
      return matrix[i * n + j];
    },
  };
}
