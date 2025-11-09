import { describe, it, beforeEach, expect } from 'vitest';
import { diagram } from './wardleyDiagram.js';
import type WardleyDb from './wardleyDb.js';
import type { WardleyNode } from './wardleyBuilder.js';

const parser = diagram.parser;
const db = diagram.db as typeof WardleyDb;

describe('wardley parser', () => {
  beforeEach(() => {
    db.clear();
  });

  it('parses nodes, links, and trends', async () => {
    await parser.parse(
      `wardley\n  title Example\n  x-axis Left -> Right\n  y-axis Bottom -> Top\n  Alpha(10, 20)\n  Beta(30, 40)\n  Alpha --> Beta\n  Beta -.- (60, 70)`
    );

    const data = db.getWardleyData();
    expect(data.nodes).toHaveLength(2);
    expect(data.links).toHaveLength(1);
    expect(data.trends).toHaveLength(1);
    expect(data.axes.xLabel).toBe('Left -> Right');
    expect(data.axes.yLabel).toBe('Bottom -> Top');
  });

  it('rejects coordinates outside allowed range', async () => {
    await expect(parser.parse(`wardley\n  Alpha(101, 10)`)).rejects.toThrow();
  });

  it('parses custom evolution stages', async () => {
    await parser.parse(
      `wardley\ntitle Test\nevolution Genesis -> Custom -> Product -> Commodity\ncomponent A [0.5, 0.5]`
    );

    const data = db.getWardleyData();
    expect(data.axes.stages).toEqual(['Genesis', 'Custom', 'Product', 'Commodity']);
    expect(data.axes.xLabel).toBe('Evolution');
  });

  it('parses dual-label evolution stages with slashes', async () => {
    await parser.parse(
      `wardley\ntitle Test\nevolution Genesis / Concept -> Custom / Emerging -> Product / Converging -> Commodity / Accepted\ncomponent A [0.5, 0.5]`
    );

    const data = db.getWardleyData();
    expect(data.axes.stages).toEqual([
      'Genesis / Concept',
      'Custom / Emerging',
      'Product / Converging',
      'Commodity / Accepted',
    ]);
    expect(data.axes.xLabel).toBe('Evolution');
  });

  it('parses pipeline blocks with single-coordinate components', async () => {
    await parser.parse(
      `wardley
title Test Pipeline
component Kettle [0.57, 0.45]
pipeline Kettle {
  component Campfire Kettle [0.35] label [-60, 35]
  component Electric Kettle [0.53]
}
Campfire Kettle -> Kettle`
    );

    const data = db.getWardleyData();
    const kettleNode = data.nodes.find((n: WardleyNode) => n.label === 'Kettle');
    const campfireNode = data.nodes.find((n: WardleyNode) => n.label === 'Campfire Kettle');
    const electricNode = data.nodes.find((n: WardleyNode) => n.label === 'Electric Kettle');

    expect(kettleNode).toBeDefined();
    expect(campfireNode).toBeDefined();
    expect(electricNode).toBeDefined();

    // Pipeline components should inherit Y coordinate from parent
    expect(campfireNode?.y).toBe(kettleNode?.y);
    expect(electricNode?.y).toBe(kettleNode?.y);

    // But have their own X coordinates
    expect(campfireNode?.x).toBe(35);
    expect(electricNode?.x).toBe(53);
  });

  it('parses custom stage widths with boundary notation', async () => {
    await parser.parse(
      `wardley
title Test Custom Widths
evolution Genesis@0.3 -> Custom@0.6 -> Product@0.85 -> Commodity@1.0
component A [0.5, 0.5]`
    );

    const data = db.getWardleyData();
    expect(data.axes.stages).toEqual(['Genesis', 'Custom', 'Product', 'Commodity']);
    expect(data.axes.stageBoundaries).toEqual([0.3, 0.6, 0.85, 1.0]);
    expect(data.axes.xLabel).toBe('Evolution');
  });

  it('rejects invalid stage boundaries', async () => {
    // Boundary > 1.0
    await expect(parser.parse(`wardley\nevolution Genesis@1.5 -> Custom@2.0`)).rejects.toThrow(
      'between 0 and 1'
    );

    // Boundaries not in ascending order
    await expect(
      parser.parse(`wardley\nevolution Genesis@0.5 -> Custom@0.3 -> Product@1.0`)
    ).rejects.toThrow('ascending order');

    // Last boundary not 1.0
    await expect(
      parser.parse(`wardley\nevolution Genesis@0.3 -> Custom@0.6 -> Product@0.9`)
    ).rejects.toThrow('must be 1.0');

    // Mixed format (some with boundaries, some without)
    await expect(
      parser.parse(`wardley\nevolution Genesis@0.3 -> Custom -> Product@1.0`)
    ).rejects.toThrow('Either all stages must have boundaries or none');
  });
});
