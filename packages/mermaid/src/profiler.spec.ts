import { beforeEach, describe, expect, it } from 'vitest';
import { profiler } from './profiler.js';

describe('profiler', () => {
  beforeEach(() => {
    profiler.clear();
    profiler.disable();
    profiler.autoPrint = false;
    profiler.runLabel = undefined;
  });

  it('is a no-op when disabled', async () => {
    const result = await profiler.span('x', () => 42);
    expect(result).toBe(42);
    expect(profiler.records).toHaveLength(0);
    expect(profiler.report()).toBeUndefined();
  });

  it('records a labeled, nested phase tree when enabled', async () => {
    profiler.enable();
    profiler.runLabel = 'dagre';
    profiler.start('render');
    await profiler.span('parse', () => undefined);
    await profiler.span('draw', async () => {
      await profiler.span('layout', () => undefined);
    });
    const root = profiler.stop();

    expect(root?.name).toBe('render');
    expect(profiler.records).toHaveLength(1);
    const rec = profiler.records[0];
    expect(rec.label).toBe('dagre');
    expect(rec.tree.children.map((c) => c.name)).toEqual(['parse', 'draw']);
    const draw = rec.tree.children.find((c) => c.name === 'draw');
    expect(draw?.children.map((c) => c.name)).toEqual(['layout']);
    expect(rec.tree.duration).toBeGreaterThanOrEqual(0);
  });

  it('rethrows from a span but still closes it', async () => {
    profiler.enable();
    profiler.start('render');
    await expect(
      profiler.span('boom', () => {
        throw new Error('nope');
      })
    ).rejects.toThrow('nope');
    const root = profiler.stop();
    expect(root?.children[0]?.name).toBe('boom');
  });

  it('consumes runLabel after a single render, then falls back to the root name', () => {
    profiler.enable();
    profiler.runLabel = 'elk';
    profiler.start('render');
    profiler.stop();
    expect(profiler.records[0].label).toBe('elk');

    profiler.start('render');
    profiler.stop();
    expect(profiler.records[1].label).toBe('render');
  });

  it('clear() empties collected records', () => {
    profiler.enable();
    profiler.start('render');
    profiler.stop();
    expect(profiler.records).toHaveLength(1);
    profiler.clear();
    expect(profiler.records).toHaveLength(0);
  });

  it('tickSync returns the result and accumulates wall-clock into a named bucket', () => {
    profiler.enable();
    profiler.start('render');
    const result = profiler.tickSync('getBBox', () => 42);
    profiler.stop();

    expect(result).toBe(42);
    expect(profiler.records[0].buckets.getBBox).toBeGreaterThanOrEqual(0);
  });

  it('tickSync sums repeated calls into a single bucket', () => {
    profiler.enable();
    profiler.start('render');
    profiler.tickSync('getBBox', () => undefined);
    profiler.tickSync('getBBox', () => undefined);
    profiler.tickSync('getBoundingClientRect', () => undefined);
    profiler.stop();

    expect(Object.keys(profiler.records[0].buckets).sort()).toEqual([
      'getBBox',
      'getBoundingClientRect',
    ]);
  });

  it('tickSync still rethrows but records the elapsed time', () => {
    profiler.enable();
    profiler.start('render');
    expect(() =>
      profiler.tickSync('getBBox', () => {
        throw new Error('nope');
      })
    ).toThrow('nope');
    profiler.stop();

    expect(profiler.records[0].buckets.getBBox).toBeGreaterThanOrEqual(0);
  });

  it('tick (async) returns the result and accumulates into a named bucket', async () => {
    profiler.enable();
    profiler.start('render');
    const result = await profiler.tick('measure', () => Promise.resolve(7));
    profiler.stop();

    expect(result).toBe(7);
    expect(profiler.records[0].buckets.measure).toBeGreaterThanOrEqual(0);
  });

  it('buckets reset between renders', () => {
    profiler.enable();
    profiler.start('render');
    profiler.tickSync('getBBox', () => undefined);
    profiler.stop();

    profiler.start('render');
    profiler.stop();

    expect(profiler.records[0].buckets.getBBox).toBeGreaterThanOrEqual(0);
    expect(profiler.records[1].buckets.getBBox).toBeUndefined();
    expect(profiler.records[1].buckets).toEqual({});
  });

  it('tickSync and tick are no-op passthroughs when disabled', async () => {
    // disabled by the beforeEach reset
    expect(profiler.tickSync('getBBox', () => 99)).toBe(99);
    expect(await profiler.tick('measure', () => Promise.resolve(3))).toBe(3);
    expect(profiler.records).toHaveLength(0);
  });
});
