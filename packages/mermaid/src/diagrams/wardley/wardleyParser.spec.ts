import { describe, it, beforeEach, expect } from 'vitest';
import { diagram } from './wardleyDiagram.js';
import type WardleyDb from './wardleyDb.js';

const parser = diagram.parser;
const db = diagram.db as typeof WardleyDb;

describe('wardley parser', () => {
  beforeEach(() => {
    // @ts-expect-error - since type is set to undefined we will have error
    parser.parser.yy = db;
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
    expect(db.getDiagramTitle()).toBe('Example');
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

  it('accepts hyphens in unquoted component names', async () => {
    await parser.parse(
      `wardley-beta
component real-time processing [0.5, 0.5]
component end-user [0.8, 0.9]`
    );

    const data = db.getWardleyData();
    const realtime = data.nodes.find((n) => n.label === 'real-time processing');
    const enduser = data.nodes.find((n) => n.label === 'end-user');
    expect(realtime?.x).toBeCloseTo(50);
    expect(realtime?.y).toBeCloseTo(50);
    expect(enduser?.x).toBeCloseTo(90);
    expect(enduser?.y).toBeCloseTo(80);
  });

  it('accepts hyphens in link endpoints', async () => {
    await parser.parse(
      `wardley-beta
component real-time processing [0.5, 0.5]
component end-user [0.8, 0.9]
real-time processing -> end-user`
    );

    const data = db.getWardleyData();
    expect(data.links).toHaveLength(1);
    expect(data.links[0].source).toBe('real-time processing');
    expect(data.links[0].target).toBe('end-user');
  });

  it('accepts hyphens in anchor names', async () => {
    await parser.parse(
      `wardley-beta
anchor on-call engineer [0.9, 0.95]`
    );

    const data = db.getWardleyData();
    const anchor = data.nodes.find((n) => n.label === 'on-call engineer');
    expect(anchor?.className).toBe('anchor');
    expect(anchor?.x).toBeCloseTo(95);
    expect(anchor?.y).toBeCloseTo(90);
  });

  it('still tokenises A->B as an arrow (no-space regression)', async () => {
    await parser.parse(
      `wardley-beta
component A [0.1, 0.1]
component B [0.2, 0.2]
A->B`
    );

    const data = db.getWardleyData();
    expect(data.links).toHaveLength(1);
    expect(data.links[0].source).toBe('A');
    expect(data.links[0].target).toBe('B');
  });

  it('parses foo-bar->baz as link from foo-bar to baz', async () => {
    await parser.parse(
      `wardley-beta
component foo-bar [0.3, 0.3]
component baz [0.6, 0.6]
foo-bar->baz`
    );

    const data = db.getWardleyData();
    expect(data.links).toHaveLength(1);
    expect(data.links[0].source).toBe('foo-bar');
    expect(data.links[0].target).toBe('baz');
  });

  it('accepts hyphens in pipeline component names with label overrides', async () => {
    await parser.parse(
      `wardley-beta
component Data Store [0.5, 0.5]
pipeline Data Store {
  component real-time queue [0.3] label [-40, 20]
  component batch-loader [0.7]
}`
    );

    const data = db.getWardleyData();
    const realtime = data.nodes.find((n) => n.label === 'real-time queue');
    const batch = data.nodes.find((n) => n.label === 'batch-loader');
    expect(realtime?.className).toBe('pipeline-component');
    expect(realtime?.labelOffsetX).toBe(-40);
    expect(realtime?.labelOffsetY).toBe(20);
    expect(realtime?.x).toBeCloseTo(30);
    expect(batch?.className).toBe('pipeline-component');
    expect(batch?.x).toBeCloseTo(70);
  });

  it('accepts consecutive hyphens inside a name', async () => {
    await parser.parse(
      `wardley-beta
component foo--bar [0.3, 0.4]`
    );

    const data = db.getWardleyData();
    const node = data.nodes.find((n) => n.label === 'foo--bar');
    expect(node).toBeDefined();
    expect(node?.x).toBeCloseTo(40);
    expect(node?.y).toBeCloseTo(30);
  });

  it('accepts a trailing hyphen in a name', async () => {
    await parser.parse(
      `wardley-beta
component foo- [0.2, 0.3]`
    );

    const data = db.getWardleyData();
    const node = data.nodes.find((n) => n.label === 'foo-');
    expect(node).toBeDefined();
    expect(node?.x).toBeCloseTo(30);
    expect(node?.y).toBeCloseTo(20);
  });
});
