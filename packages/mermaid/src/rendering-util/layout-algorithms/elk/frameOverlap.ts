import type { Point } from '../../rendering-elements/lineJump.js';
import type { TitleBox } from './titleProtection.js';

export interface FrameOverlap {
  segment: number;
  frame: TitleBox;
  axis: 'x' | 'y';
  boundary: number;
  length: number;
}

/** A perpendicular boundary crossing is legal; a sustained parallel run is not. */
export function findFrameOverlaps(points: Point[], frames: TitleBox[]): FrameOverlap[] {
  const out: FrameOverlap[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dx = b.x - a.x,
      dy = b.y - a.y;
    for (const frame of frames) {
      for (const axis of ['x', 'y'] as const) {
        const vertical = axis === 'x',
          minor = vertical ? dx : dy,
          major = vertical ? dy : dx;
        if (Math.abs(major) < 1e-8 || Math.abs(minor) > Math.abs(major) * 0.12) {
          continue;
        }
        for (const boundary of vertical ? [frame.left, frame.right] : [frame.top, frame.bottom]) {
          let lo = 0,
            hi = 1;
          for (const [origin, delta, min, max] of vertical
            ? [
                [a.x, dx, boundary - 3, boundary + 3],
                [a.y, dy, frame.top, frame.bottom],
              ]
            : [
                [a.y, dy, boundary - 3, boundary + 3],
                [a.x, dx, frame.left, frame.right],
              ]) {
            if (Math.abs(delta) < 1e-8) {
              if (origin <= min || origin >= max) {
                hi = -1;
                break;
              }
            } else {
              const t1 = (min - origin) / delta,
                t2 = (max - origin) / delta;
              lo = Math.max(lo, Math.min(t1, t2));
              hi = Math.min(hi, Math.max(t1, t2));
            }
          }
          const length = Math.max(0, hi - lo) * Math.abs(major);
          if (length > 8) {
            out.push({ segment: i - 1, frame, axis, boundary, length });
          }
        }
      }
    }
  }
  return out;
}
