import type { EdgeData, Point } from '../types.js';

// We need to draw the lines a bit shorter to avoid drawing
// under any transparent markers.
// The offsets are calculated from the markers' dimensions.
const markerOffsets = {
  aggregation: 18,
  extension: 18,
  composition: 18,
  dependency: 6,
  lollipop: 13.5,
  arrow_point: 5.3,
} as const;

/**
 * Calculate the deltas and angle between two points
 * @param point1 - First point
 * @param point2 - Second point
 * @returns The angle, deltaX and deltaY
 */
function calculateDeltaAndAngle(
  point1?: Point | [number, number],
  point2?: Point | [number, number]
): { angle: number; deltaX: number; deltaY: number } {
  if (point1 === undefined || point2 === undefined) {
    return { angle: 0, deltaX: 0, deltaY: 0 };
  }
  point1 = pointTransformer(point1);
  point2 = pointTransformer(point2);
  const [x1, y1] = [point1.x, point1.y];
  const [x2, y2] = [point2.x, point2.y];
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return { angle: Math.atan(deltaY / deltaX), deltaX, deltaY };
}

const pointTransformer = (data: Point | [number, number]) => {
  if (Array.isArray(data)) {
    return { x: data[0], y: data[1] };
  }
  return data;
};

export const getLineFunctionsWithOffset = (
  edge: Pick<EdgeData, 'arrowTypeStart' | 'arrowTypeEnd'>
) => {
  return {
    x: function (d: Point | [number, number], i: number, data: (Point | [number, number])[]) {
      let offset = 0;
      if (i === 0 && Object.hasOwn(markerOffsets, edge.arrowTypeStart)) {
        // Handle first point
        // Calculate the angle and delta between the first two points
        const { angle, deltaX } = calculateDeltaAndAngle(data[0], data[1]);
        // Calculate the offset based on the angle and the marker's dimensions
        offset =
          markerOffsets[edge.arrowTypeStart as keyof typeof markerOffsets] *
          Math.cos(angle) *
          (deltaX >= 0 ? 1 : -1);
      } else if (i === data.length - 1 && Object.hasOwn(markerOffsets, edge.arrowTypeEnd)) {
        // Handle last point
        // Calculate the angle and delta between the last two points
        const { angle, deltaX } = calculateDeltaAndAngle(
          data[data.length - 1],
          data[data.length - 2]
        );
        offset =
          markerOffsets[edge.arrowTypeEnd as keyof typeof markerOffsets] *
          Math.cos(angle) *
          (deltaX >= 0 ? 1 : -1);
      }
      return pointTransformer(d).x + offset;
    },
    y: function (d: Point | [number, number], i: number, data: (Point | [number, number])[]) {
      // Same handling as X above
      let offset = 0;
      if (i === 0 && Object.hasOwn(markerOffsets, edge.arrowTypeStart)) {
        const { angle, deltaY } = calculateDeltaAndAngle(data[0], data[1]);
        offset =
          markerOffsets[edge.arrowTypeStart as keyof typeof markerOffsets] *
          Math.abs(Math.sin(angle)) *
          (deltaY >= 0 ? 1 : -1);
      } else if (i === data.length - 1 && Object.hasOwn(markerOffsets, edge.arrowTypeEnd)) {
        const { angle, deltaY } = calculateDeltaAndAngle(
          data[data.length - 1],
          data[data.length - 2]
        );
        offset =
          markerOffsets[edge.arrowTypeEnd as keyof typeof markerOffsets] *
          Math.abs(Math.sin(angle)) *
          (deltaY >= 0 ? 1 : -1);
      }
      return pointTransformer(d).y + offset;
    },
  };
};

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;
  describe('calculateDeltaAndAngle', () => {
    it('should calculate the angle and deltas between two points', () => {
      expect(calculateDeltaAndAngle([0, 0], [0, 1])).toStrictEqual({
        angle: 1.5707963267948966,
        deltaX: 0,
        deltaY: 1,
      });
      expect(calculateDeltaAndAngle([1, 0], [0, -1])).toStrictEqual({
        angle: 0.7853981633974483,
        deltaX: -1,
        deltaY: -1,
      });
      expect(calculateDeltaAndAngle({ x: 1, y: 0 }, [0, -1])).toStrictEqual({
        angle: 0.7853981633974483,
        deltaX: -1,
        deltaY: -1,
      });
      expect(calculateDeltaAndAngle({ x: 1, y: 0 }, { x: 1, y: 0 })).toStrictEqual({
        angle: NaN,
        deltaX: 0,
        deltaY: 0,
      });
    });

    it('should calculate the angle and deltas if one point in undefined', () => {
      expect(calculateDeltaAndAngle(undefined, [0, 1])).toStrictEqual({
        angle: 0,
        deltaX: 0,
        deltaY: 0,
      });
      expect(calculateDeltaAndAngle([0, 1], undefined)).toStrictEqual({
        angle: 0,
        deltaX: 0,
        deltaY: 0,
      });
    });
  });
}
