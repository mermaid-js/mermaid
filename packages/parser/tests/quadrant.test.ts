import { describe, expect, it } from 'vitest';

import { createQuadrantTestServices } from './test-utils.js';

describe('quadrant', () => {
  const { parse } = createQuadrantTestServices();

  it('should handle a simple quadrant', () => {
    const context = `quadrant
    x-axis low reach --> high reach
    y-axis low engagement --> high engagement
    quadrant-1 we should expand
    quadrant-2 need to promote
    quadrant-3 re-evaluate
    quadrant-4 may be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    `;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.xAxis?.left).toBe('low reach');
    expect(value.xAxis?.right).toBe('high reach');
    expect(value.yAxis?.up).toBe('low engagement');
    expect(value.yAxis?.down).toBe('high engagement');

    expect(value.quadrant_1).toBe('we should expand');
    expect(value.quadrant_2).toBe('need to promote');
    expect(value.quadrant_3).toBe('re-evaluate');
    expect(value.quadrant_4).toBe('may be improved');

    expect(value.points[0].title).toBe('Campaign A');
    expect(value.points[0].x).toBe(0.3);
    expect(value.points[0].y).toBe(0.6);

    expect(value.points[1].title).toBe('Campaign B');
    expect(value.points[1].x).toBe(0.45);
    expect(value.points[1].y).toBe(0.23);
  });
});
