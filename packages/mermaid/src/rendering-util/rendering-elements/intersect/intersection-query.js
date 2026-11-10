const LINE_INTERSECTION_ORIGIN = Symbol('lineIntersectionOrigin');

export const withLineIntersectionOrigin = (point, origin) => ({
  ...point,
  [LINE_INTERSECTION_ORIGIN]: origin,
});

export const getLineIntersectionOrigin = (point, fallback) =>
  point?.[LINE_INTERSECTION_ORIGIN] ?? fallback;
