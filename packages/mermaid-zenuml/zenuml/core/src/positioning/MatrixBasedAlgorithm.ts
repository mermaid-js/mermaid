import memoize from 'lodash/memoize';

function resolver() {
  return (...args: any[]) => args.join('-');
}

let range = memoize((to: number, from = 0) => {
  return Array(to - from)
    .fill(0)
    .map((_, idx) => idx + from);
}, resolver);

function neighbourGap(right: number, minDistanceMatrix: Array<Array<number>>) {
  return Math.max(
    ...range(right, 0).map((l, _) => {
      return minDistanceMatrix[l][right] - distance(l, right - 1, minDistanceMatrix);
    })
  );
}

function totalGap(right: number, left: number, minDistanceMatrix: Array<Array<number>>) {
  return range(right, left).reduce((acc, l) => {
    return acc + distance(l, l + 1, minDistanceMatrix);
  }, 0);
}

let final_distance = (
  left: number,
  right: number,
  minDistanceMatrix: Array<Array<number>>
): number => {
  if (right - left === 1) {
    return neighbourGap(right, minDistanceMatrix);
  } else {
    return totalGap(right, left, minDistanceMatrix);
  }
};

export let distance = memoize(final_distance, resolver());

export let final_pos = (i: number, minDistanceMatrix: Array<number>[]): number => {
  return distance(0, i, minDistanceMatrix);
};
