import { describe, it, beforeEach, expect } from 'vitest';
import { diagram } from './wardleyDiagram.js';
import type WardleyDb from './wardleyDb.js';

const parser = diagram.parser;
const db = diagram.db as typeof WardleyDb;

describe('wardley parser', () => {
  beforeEach(() => {
    db.clear();
  });

  it('parses components and links', async () => {
    const input = [
      'wardley-beta',
      'title Example',
      'component Alpha [0.2, 0.1]',
      'component Beta [0.4, 0.3]',
      'Alpha -> Beta',
    ].join('\n');

    await parser.parse(input);

    const data = db.getWardleyData();
    expect(data.nodes).toHaveLength(2);
    expect(data.links).toHaveLength(1);
    expect(data.title).toBe('Example');
  });

  it('parses custom evolution stages', async () => {
    await parser.parse(
      `wardley-beta
title Test
evolution Genesis -> Custom -> Product -> Commodity
component A [0.5, 0.5]`
    );

    const data = db.getWardleyData();
    expect(data.axes.stages).toEqual(['Genesis', 'Custom', 'Product', 'Commodity']);
  });

  it('parses dual-label evolution stages with slashes', async () => {
    await parser.parse(
      `wardley-beta
title Test
evolution Genesis / Concept -> Custom / Emerging -> Product / Converging -> Commodity / Accepted
component A [0.5, 0.5]`
    );

    const data = db.getWardleyData();
    expect(data.axes.stages).toEqual([
      'Genesis / Concept',
      'Custom / Emerging',
      'Product / Converging',
      'Commodity / Accepted',
    ]);
  });

  it('parses pipeline blocks with single-coordinate components', async () => {
    await parser.parse(
      `wardley-beta
title Test Pipeline
component Kettle [0.45, 0.57]
pipeline Kettle {
  component Campfire Kettle [0.35] label [-60, 35]
  component Electric Kettle [0.53]
}`
    );

    const data = db.getWardleyData();
    const kettleNode = data.nodes.find((n) => n.label === 'Kettle');
    const campfireNode = data.nodes.find((n) => n.label === 'Campfire Kettle');
    const electricNode = data.nodes.find((n) => n.label === 'Electric Kettle');

    expect(kettleNode).toBeDefined();
    expect(campfireNode).toBeDefined();
    expect(electricNode).toBeDefined();

    // Pipeline components should inherit Y coordinate from parent
    expect(campfireNode?.y).toBe(kettleNode?.y);
    expect(electricNode?.y).toBe(kettleNode?.y);

    // But have their own X coordinates (evolution values)
    expect(campfireNode?.x).toBeCloseTo(35);
    expect(electricNode?.x).toBeCloseTo(53);
  });

  it('parses custom stage widths with boundary notation', async () => {
    await parser.parse(
      `wardley-beta
title Test Custom Widths
evolution Genesis@0.3 -> Custom@0.6 -> Product@0.85 -> Commodity@1.0
component A [0.5, 0.5]`
    );

    const data = db.getWardleyData();
    expect(data.axes.stages).toEqual(['Genesis', 'Custom', 'Product', 'Commodity']);
    expect(data.axes.stageBoundaries).toEqual([0.3, 0.6, 0.85, 1.0]);
  });

  it('parses notes with quoted text', async () => {
    await parser.parse(
      `wardley-beta
title Test Notes
component API [0.6, 0.7]
note "Critical decision point" [0.65, 0.55]`
    );

    const data = db.getWardleyData();
    expect(data.notes).toHaveLength(1);
    expect(data.notes[0].text).toBe('Critical decision point');
  });

  it('parses annotations with quoted text', async () => {
    await parser.parse(
      `wardley-beta
title Test Annotations
component API [0.6, 0.7]
annotations [0.1, 0.9]
annotation 1,[0.6, 0.65] "Critical component"
annotation 2,[0.5, 0.5] "Performance layer"`
    );

    const data = db.getWardleyData();
    expect(data.annotations).toHaveLength(2);
    expect(data.annotations[0].text).toBe('Critical component');
    expect(data.annotations[1].text).toBe('Performance layer');
  });

  it('parses anchors', async () => {
    await parser.parse(
      `wardley-beta
title Test Anchors
anchor Business [0.95, 0.63]
anchor Public [0.95, 0.78]
component Tea [0.63, 0.81]`
    );

    const data = db.getWardleyData();
    const anchors = data.nodes.filter((n) => n.className === 'anchor');
    expect(anchors).toHaveLength(2);
    expect(anchors[0].label).toBe('Business');
  });

  it('parses evolve statements', async () => {
    await parser.parse(
      `wardley-beta
title Test Evolve
component Kettle [0.35, 0.43]
evolve Kettle 0.62`
    );

    const data = db.getWardleyData();
    expect(data.trends).toHaveLength(1);
    expect(data.trends[0].targetX).toBeCloseTo(62);
  });

  it('parses component decorators', async () => {
    await parser.parse(
      `wardley-beta
title Test Decorators
component API [0.6, 0.7] (build)
component Database [0.4, 0.5] (buy)
component Cache [0.5, 0.6] (outsource)`
    );

    const data = db.getWardleyData();
    const api = data.nodes.find((n) => n.label === 'API');
    const database = data.nodes.find((n) => n.label === 'Database');
    const cache = data.nodes.find((n) => n.label === 'Cache');

    expect(api?.sourceStrategy).toBe('build');
    expect(database?.sourceStrategy).toBe('buy');
    expect(cache?.sourceStrategy).toBe('outsource');
  });

  it('parses areas', async () => {
    await parser.parse(
      `wardley-beta
title Test Areas
area Frontend [0.75, 0.80]
area Backend [0.60, 0.55]`
    );

    const data = db.getWardleyData();
    expect(data.areas).toHaveLength(2);
    expect(data.areas[0].name).toBe('Frontend');
  });

  it('parses size directive', async () => {
    await parser.parse(
      `wardley-beta
title Test Size
size [1200, 900]
component A [0.5, 0.5]`
    );

    const data = db.getWardleyData();
    expect(data.size?.width).toBe(1200);
    expect(data.size?.height).toBe(900);
  });

  it('handles quoted identifiers, inline labels, and converts coordinates to percentages', async () => {
    await parser.parse(
      `wardley-beta
title Coordinate Handling
component "Mobile App" [0.2, 0.4] (build) (inertia)
component API [0.3, 0.5]
"Mobile App" +<> API; constraint
note "Check dependencies" [0.25, 0.45]
annotations [0.10, 0.90]
annotation 1,[0.60, 0.65] "Critical component"
accelerator "Cloud Native" [0.20, 0.85]
deaccelerator "Legacy Data" [0.40, 0.35]`
    );

    const data = db.getWardleyData();
    const mobile = data.nodes.find((n) => n.label === 'Mobile App');
    expect(mobile?.x).toBeCloseTo(40);
    expect(mobile?.y).toBeCloseTo(20);
    expect(mobile?.sourceStrategy).toBe('build');
    expect(mobile?.inertia).toBe(true);

    expect(data.links).toHaveLength(1);
    expect(data.links[0].flow).toBe('bidirectional');
    expect(data.links[0].label).toBe('constraint');

    expect(data.notes[0].x).toBeCloseTo(45);
    expect(data.notes[0].y).toBeCloseTo(25);

    expect(data.annotationsBox).toEqual({ x: 90, y: 10 });
    expect(data.annotations[0].text).toBe('Critical component');
    expect(data.annotations[0].coordinates[0]).toEqual({ x: 65, y: 60 });

    expect(data.accelerators[0]).toMatchObject({ name: 'Cloud Native', x: 85, y: 20 });
    expect(data.deaccelerators[0]).toMatchObject({ name: 'Legacy Data', x: 35, y: 40 });
  });
});
