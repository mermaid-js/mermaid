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
  arrow_point: 4,
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
    x: function (
      this: void,
      d: Point | [number, number],
      i: number,
      data: (Point | [number, number])[]
    ) {
      let offset = 0;
      const DIRECTION =
        pointTransformer(data[0]).x < pointTransformer(data[data.length - 1]).x ? 'left' : 'right';
      if (i === 0 && Object.hasOwn(markerOffsets, edge.arrowTypeStart)) {
        const { angle, deltaX } = calculateDeltaAndAngle(data[0], data[1]);
        offset =
          markerOffsets[edge.arrowTypeStart as keyof typeof markerOffsets] *
          Math.cos(angle) *
          (deltaX >= 0 ? 1 : -1);
      } else if (i === data.length - 1 && Object.hasOwn(markerOffsets, edge.arrowTypeEnd)) {
        const { angle, deltaX } = calculateDeltaAndAngle(
          data[data.length - 1],
          data[data.length - 2]
        );
        offset =
          markerOffsets[edge.arrowTypeEnd as keyof typeof markerOffsets] *
          Math.cos(angle) *
          (deltaX >= 0 ? 1 : -1);
      }

      const differenceToEnd = Math.abs(
        pointTransformer(d).x - pointTransformer(data[data.length - 1]).x
      );
      const differenceInYEnd = Math.abs(
        pointTransformer(d).y - pointTransformer(data[data.length - 1]).y
      );
      const differenceToStart = Math.abs(pointTransformer(d).x - pointTransformer(data[0]).x);
      const differenceInYStart = Math.abs(pointTransformer(d).y - pointTransformer(data[0]).y);
      const startMarkerHeight = markerOffsets[edge.arrowTypeStart as keyof typeof markerOffsets];
      const endMarkerHeight = markerOffsets[edge.arrowTypeEnd as keyof typeof markerOffsets];
      const extraRoom = 1;

      // Adjust the offset if the difference is smaller than the marker height
      if (
        differenceToEnd < endMarkerHeight &&
        differenceToEnd > 0 &&
        differenceInYEnd < endMarkerHeight
      ) {
        let adjustment = endMarkerHeight + extraRoom - differenceToEnd;
        adjustment *= DIRECTION === 'right' ? -1 : 1;
        // Adjust the offset by the amount needed to fit the marker
        offset -= adjustment;
      }

      if (
        differenceToStart < startMarkerHeight &&
        differenceToStart > 0 &&
        differenceInYStart < startMarkerHeight
      ) {
        let adjustment = startMarkerHeight + extraRoom - differenceToStart;
        adjustment *= DIRECTION === 'right' ? -1 : 1;
        offset += adjustment;
      }

      return pointTransformer(d).x + offset;
    },
    y: function (
      this: void,
      d: Point | [number, number],
      i: number,
      data: (Point | [number, number])[]
    ) {
      let offset = 0;
      const DIRECTION =
        pointTransformer(data[0]).y < pointTransformer(data[data.length - 1]).y ? 'down' : 'up';
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

      const differenceToEnd = Math.abs(
        pointTransformer(d).y - pointTransformer(data[data.length - 1]).y
      );
      const differenceInXEnd = Math.abs(
        pointTransformer(d).x - pointTransformer(data[data.length - 1]).x
      );
      const differenceToStart = Math.abs(pointTransformer(d).y - pointTransformer(data[0]).y);
      const differenceInXStart = Math.abs(pointTransformer(d).x - pointTransformer(data[0]).x);
      const startMarkerHeight = markerOffsets[edge.arrowTypeStart as keyof typeof markerOffsets];
      const endMarkerHeight = markerOffsets[edge.arrowTypeEnd as keyof typeof markerOffsets];
      const extraRoom = 1;

      // Adjust the offset if the difference is smaller than the marker height
      if (
        differenceToEnd < endMarkerHeight &&
        differenceToEnd > 0 &&
        differenceInXEnd < endMarkerHeight
      ) {
        let adjustment = endMarkerHeight + extraRoom - differenceToEnd;
        adjustment *= DIRECTION === 'up' ? -1 : 1;
        // Adjust the offset by the amount needed to fit the marker
        offset -= adjustment;
      }

      if (
        differenceToStart < startMarkerHeight &&
        differenceToStart > 0 &&
        differenceInXStart < startMarkerHeight
      ) {
        let adjustment = startMarkerHeight + extraRoom - differenceToStart;
        adjustment *= DIRECTION === 'up' ? -1 : 1;
        offset += adjustment;
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
