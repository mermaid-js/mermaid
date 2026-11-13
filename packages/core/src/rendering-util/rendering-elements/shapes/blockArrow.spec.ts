import { describe, expect, it } from 'vitest';
import type { Direction } from '../../../diagrams/block/blockTypes.js';
import type { Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { getArrowPoints } from './blockArrow.js';

const bbox = { width: 100, height: 20 };
const node = { padding: 10 } satisfies Pick<Node, 'padding'>;
const width = 140;
const height = 40;
const midpoint = 20;
const padding = 5;

const p = (x: number, y: number): Point => ({ x, y });

const allDirectionsPoints = [
  p(0, 0),
  p(midpoint, 0),
  p(width / 2, 2 * padding),
  p(width - midpoint, 0),
  p(width, 0),
  p(width, -height / 3),
  p(width + 2 * padding, -height / 2),
  p(width, (-2 * height) / 3),
  p(width, -height),
  p(width - midpoint, -height),
  p(width / 2, -height - 2 * padding),
  p(midpoint, -height),
  p(0, -height),
  p(0, (-2 * height) / 3),
  p(-2 * padding, -height / 2),
  p(0, -height / 3),
];

const cases: { name: string; directions: Direction[]; points: Point[] }[] = [
  {
    name: 'four-way arrow',
    directions: ['right', 'left', 'up', 'down'],
    points: allDirectionsPoints,
  },
  {
    name: 'right-left-up arrow',
    directions: ['right', 'left', 'up'],
    points: [
      p(midpoint, 0),
      p(width - midpoint, 0),
      p(width, -height / 2),
      p(width - midpoint, -height),
      p(midpoint, -height),
      p(0, -height / 2),
    ],
  },
  {
    name: 'right-left-down arrow',
    directions: ['right', 'left', 'down'],
    points: [p(0, 0), p(midpoint, -height), p(width - midpoint, -height), p(width, 0)],
  },
  {
    name: 'right-up-down arrow',
    directions: ['right', 'up', 'down'],
    points: [p(0, 0), p(width, -midpoint), p(width, -height + midpoint), p(0, -height)],
  },
  {
    name: 'left-up-down arrow',
    directions: ['left', 'up', 'down'],
    points: [p(width, 0), p(0, -midpoint), p(0, -height + midpoint), p(width, -height)],
  },
  {
    name: 'horizontal arrow',
    directions: ['right', 'left'],
    points: [
      p(midpoint, 0),
      p(midpoint, -padding),
      p(width - midpoint, -padding),
      p(width - midpoint, 0),
      p(width, -height / 2),
      p(width - midpoint, -height),
      p(width - midpoint, -height + padding),
      p(midpoint, -height + padding),
      p(midpoint, -height),
      p(0, -height / 2),
    ],
  },
  {
    name: 'vertical arrow',
    directions: ['up', 'down'],
    points: [
      p(width / 2, 0),
      p(0, -padding),
      p(midpoint, -padding),
      p(midpoint, -height + padding),
      p(0, -height + padding),
      p(width / 2, -height),
      p(width, -height + padding),
      p(width - midpoint, -height + padding),
      p(width - midpoint, -padding),
      p(width, -padding),
    ],
  },
  {
    name: 'right-up angle',
    directions: ['right', 'up'],
    points: [p(0, 0), p(width, -midpoint), p(0, -height)],
  },
  {
    name: 'right-down angle',
    directions: ['right', 'down'],
    points: [p(0, 0), p(width, 0), p(0, -height)],
  },
  {
    name: 'left-up angle',
    directions: ['left', 'up'],
    points: [p(width, 0), p(0, -midpoint), p(width, -height)],
  },
  {
    name: 'left-down angle',
    directions: ['left', 'down'],
    points: [p(width, 0), p(0, 0), p(width, -height)],
  },
  {
    name: 'right arrow',
    directions: ['right'],
    points: [
      p(midpoint, -padding),
      p(midpoint, -padding),
      p(width - midpoint, -padding),
      p(width - midpoint, 0),
      p(width, -height / 2),
      p(width - midpoint, -height),
      p(width - midpoint, -height + padding),
      p(midpoint, -height + padding),
      p(midpoint, -height + padding),
    ],
  },
  {
    name: 'left arrow',
    directions: ['left'],
    points: [
      p(midpoint, 0),
      p(midpoint, -padding),
      p(width - midpoint, -padding),
      p(width - midpoint, -height + padding),
      p(midpoint, -height + padding),
      p(midpoint, -height),
      p(0, -height / 2),
    ],
  },
  {
    name: 'up arrow',
    directions: ['up'],
    points: [
      p(midpoint, -padding),
      p(midpoint, -height + padding),
      p(0, -height + padding),
      p(width / 2, -height),
      p(width, -height + padding),
      p(width - midpoint, -height + padding),
      p(width - midpoint, -padding),
    ],
  },
  {
    name: 'down arrow',
    directions: ['down'],
    points: [
      p(width / 2, 0),
      p(0, -padding),
      p(midpoint, -padding),
      p(midpoint, -height + padding),
      p(width - midpoint, -height + padding),
      p(width - midpoint, -padding),
      p(width, -padding),
    ],
  },
  {
    name: 'point fallback',
    directions: [],
    points: [p(0, 0)],
  },
];

describe('block arrow points', () => {
  for (const { name, directions, points } of cases) {
    it(`returns ${name} geometry`, () => {
      expect(getArrowPoints(directions, bbox, node, width)).toEqual(points);
    });
  }

  it('expands axis shorthands and deduplicates directions', () => {
    expect(getArrowPoints(['x', 'right', 'y', 'up'], bbox, node, width)).toEqual(
      allDirectionsPoints
    );
  });

  it('uses the natural width when total width is omitted', () => {
    expect(getArrowPoints(['right', 'down'], bbox, node)).toEqual([p(0, 0), p(150, 0), p(0, -40)]);
  });
});
