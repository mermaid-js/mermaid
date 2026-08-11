export interface Point {
  x: number;
  y: number;
}

function key(p: Point): string {
  return `${Math.round(p.x)},${Math.round(p.y)}`;
}

function isOrthogonal(points: Point[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a.x !== b.x && a.y !== b.y) {
      return false;
    }
  }
  return true;
}

function compressCollinear(points: Point[]): Point[] {
  if (points.length <= 2) {
    return points;
  }
  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = points[i];
    const next = points[i + 1];
    const prevHoriz = prev.y === cur.y;
    const curHoriz = cur.y === next.y;
    const prevVert = prev.x === cur.x;
    const curVert = cur.x === next.x;
    if ((prevHoriz && curHoriz) || (prevVert && curVert)) {
      continue;
    }
    out.push(cur);
  }
  out.push(points[points.length - 1]);
  return out;
}

type Axis = 'h' | 'v' | null;

function axisThrough(points: Point[], idx: number): Axis {
  if (idx <= 0 || idx >= points.length - 1) {
    return null;
  }
  const prev = points[idx - 1];
  const cur = points[idx];
  const next = points[idx + 1];
  // Only consider “straight-through” (no turn) as a crossing candidate.
  if (prev.y === cur.y && cur.y === next.y) {
    return 'h';
  }
  if (prev.x === cur.x && cur.x === next.x) {
    return 'v';
  }
  return null;
}

export function countSharedCrossingVertices(a: Point[], b: Point[]): number {
  const aIndex = new Map<string, number[]>();
  for (const [i, element] of a.entries()) {
    const k = key(element);
    const arr = aIndex.get(k) ?? [];
    arr.push(i);
    aIndex.set(k, arr);
  }

  let count = 0;
  for (let j = 0; j < b.length; j++) {
    const k = key(b[j]);
    const aIdxs = aIndex.get(k);
    if (!aIdxs) {
      continue;
    }
    const ax = axisThrough(a, aIdxs[0]);
    const bx = axisThrough(b, j);
    if (ax && bx && ax !== bx) {
      count += 1;
    }
  }
  return count;
}

function extractSubpath(points: Point[], fromIdx: number, toIdx: number): Point[] {
  if (fromIdx === toIdx) {
    return [points[fromIdx]];
  }
  if (fromIdx < toIdx) {
    return points.slice(fromIdx, toIdx + 1);
  }
  // reverse segment so it runs from fromIdx → toIdx directionally
  return points.slice(toIdx, fromIdx + 1).reverse();
}

function stitch(prefix: Point[], middle: Point[], suffix: Point[]): Point[] {
  const out: Point[] = [];
  // prefix includes start .. p
  out.push(...prefix);
  // middle includes p .. q
  for (let i = 1; i < middle.length; i++) {
    out.push(middle[i]);
  }
  // suffix includes q .. end
  for (let i = 1; i < suffix.length; i++) {
    out.push(suffix[i]);
  }
  return compressCollinear(out);
}

export function cleanupMultipleCrossingsBetweenTwoPaths(
  a: Point[],
  b: Point[]
): { a: Point[]; b: Point[]; changed: boolean } {
  if (a.length < 3 || b.length < 3) {
    return { a, b, changed: false };
  }
  if (!isOrthogonal(a) || !isOrthogonal(b)) {
    return { a, b, changed: false };
  }

  // Find shared vertices where BOTH pass straight-through with different axes (a crossing).
  const aByKey = new Map<string, number[]>();
  for (const [i, element] of a.entries()) {
    const k = key(element);
    const arr = aByKey.get(k) ?? [];
    arr.push(i);
    aByKey.set(k, arr);
  }

  const crossings: { k: string; ai: number; bi: number }[] = [];
  for (let bi = 1; bi < b.length - 1; bi++) {
    const k = key(b[bi]);
    const aIdxs = aByKey.get(k);
    if (!aIdxs) {
      continue;
    }
    // Use the earliest occurrence for ordering.
    const ai = aIdxs[0];
    if (ai <= 0 || ai >= a.length - 1) {
      continue;
    }

    const ax = axisThrough(a, ai);
    const bx = axisThrough(b, bi);
    if (ax && bx && ax !== bx) {
      crossings.push({ k, ai, bi });
    }
  }

  if (crossings.length < 2) {
    return { a, b, changed: false };
  }

  // Deterministically pick first/last by a-index.
  crossings.sort((p, q) => p.ai - q.ai || p.bi - q.bi || p.k.localeCompare(q.k));
  const first = crossings[0];
  const last = crossings[crossings.length - 1];
  if (first.k === last.k) {
    return { a, b, changed: false };
  }

  // Build new paths by swapping the middle subpaths between the two crossing vertices.
  const aP = first.ai;
  const aQ = last.ai;
  const bP = first.bi;
  const bQ = last.bi;

  const aPrefix = a.slice(0, Math.min(aP, aQ) + 1);
  const aSuffix = a.slice(Math.max(aP, aQ));
  const bPrefix = b.slice(0, Math.min(bP, bQ) + 1);
  const bSuffix = b.slice(Math.max(bP, bQ));

  const aMid = extractSubpath(a, aP, aQ);
  const bMid = extractSubpath(b, bP, bQ);

  const newA = stitch(aPrefix, bMid, aSuffix);
  const newB = stitch(bPrefix, aMid, bSuffix);

  const before = countSharedCrossingVertices(a, b);
  const after = countSharedCrossingVertices(newA, newB);
  if (after >= before) {
    return { a, b, changed: false };
  }
  return { a: newA, b: newB, changed: true };
}
