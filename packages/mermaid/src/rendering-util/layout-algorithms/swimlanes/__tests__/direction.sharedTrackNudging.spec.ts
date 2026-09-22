import { describe, expect, it } from 'vitest';
import { nudgeSharedInteriorSubpaths } from '../direction/sharedTrackNudging.js';

interface PointLite {
  x: number;
  y: number;
}

const edge = (id: string, points: PointLite[]): any => ({
  id,
  type: 'arrow',
  points,
});

const node = (id: string, x: number, y: number, width: number, height: number): any => ({
  id,
  x,
  y,
  width,
  height,
  isGroup: false,
});

const verticalSegmentX = (points: PointLite[], minOverlap = 80): number | undefined => {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (Math.abs(a.x - b.x) < 1e-3 && Math.abs(a.y - b.y) >= minOverlap) {
      return a.x;
    }
  }
  return undefined;
};

const verticalSegmentXOverlappingY = (
  points: PointLite[],
  y1: number,
  y2: number
): number | undefined => {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (Math.abs(a.x - b.x) >= 1e-3) {
      continue;
    }
    const overlap = Math.max(
      0,
      Math.min(Math.max(a.y, b.y), y2) - Math.max(Math.min(a.y, b.y), y1)
    );
    if (overlap > 0) {
      return a.x;
    }
  }
  return undefined;
};

describe('nudgeSharedInteriorSubpaths', () => {
  it('separates near-parallel interior rails with long projected overlap', () => {
    const edges = [
      edge('detoured', [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 80, y: 100 },
      ]),
      edge('nearby', [
        { x: 52, y: 0 },
        { x: 52, y: 100 },
      ]),
    ];

    nudgeSharedInteriorSubpaths(edges, new Map());

    const detouredX = verticalSegmentX(edges[0].points);
    expect(detouredX).toBeDefined();
    expect(Math.abs(detouredX! - 52)).toBeGreaterThanOrEqual(7);
  });

  it('separates the close B/I exit rails from fixture 12', () => {
    const edges = [
      {
        id: 'L_I_exit_0',
        start: 'I',
        end: 'exit',
        type: 'arrow',
        points: [
          { x: -113.64374732971191, y: 955 },
          { x: 220.83124923706055, y: 955 },
          { x: 220.83124923706055, y: 1083.5643920898438 },
          { x: 240.546875, y: 1083.5643920898438 },
        ],
      },
      edge('L_H_I_0', [
        { x: 243.83124923706055, y: 973.5 },
        { x: -113.64374732971191, y: 973.5 },
      ]),
      {
        id: 'L_B_exit_0',
        start: 'B',
        end: 'exit',
        type: 'arrow',
        points: [
          { x: -131.5906219482422, y: 192 },
          { x: -131.5906219482422, y: 928 },
          { x: 222.77187538146973, y: 928 },
          { x: 222.77187538146973, y: 1038.0643920898438 },
          { x: 258.328125, y: 1038.0643920898438 },
          { x: 258.328125, y: 1058.0643920898438 },
        ],
      },
    ];

    nudgeSharedInteriorSubpaths(
      edges as any,
      new Map([
        ['I', node('I', -131.5906219482422, 973.5, 35.89374923706055, 45)],
        ['B', node('B', -131.5906219482422, 146.5, 121.3125, 91)],
        ['exit', node('exit', 267.21875, 1083.5643920898438, 53.34375, 51)],
      ])
    );

    const iExitX = verticalSegmentXOverlappingY(edges[0].points, 1016, 1038.0643920898438);
    const bExitX = verticalSegmentXOverlappingY(edges[2].points, 1016, 1038.0643920898438);
    expect(iExitX).toBeDefined();
    expect(bExitX).toBeDefined();
    expect(Math.abs(iExitX! - bExitX!)).toBeGreaterThanOrEqual(7);
    expect(edges[0].points[0]).toEqual({ x: -131.5906219482422, y: 996 });
  });
});
