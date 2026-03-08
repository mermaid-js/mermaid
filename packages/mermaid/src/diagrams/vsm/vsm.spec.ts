// cspell:ignore cycletime leadtime processtime
import { it, describe, expect, beforeEach } from 'vitest';
import { db } from './db.js';
import { parser } from './parser.js';
import { parseDurationToMinutes, computeSummaryValues } from './renderer.js';
import type { VsmStep, VsmQueue } from './types.js';

const {
  clear,
  getDiagramTitle,
  getAccTitle,
  getAccDescription,
  getFlow,
  getSteps,
  getQueues,
  getSummary,
} = db;

describe('vsm diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a simple vsm definition', async () => {
    const str = `vsm
    supplier "Steel Co" >> stamping >> customer "Customer"

    stamping "Stamping"
        cycletime 1s
        push
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should parse steps with metrics', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 5m
        changeover 30m
        push
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const steps = getSteps();
    expect(steps).toHaveLength(1);
    expect(steps[0].name).toBe('step1');
    expect(steps[0].label).toBe('Step One');
    expect(steps[0].cycletime).toEqual({ min: '5m', max: undefined });
    expect(steps[0].changeover).toEqual({ min: '30m', max: undefined });
    expect(steps[0].flowType).toBe('push');
  });

  it('should parse step with only cycletime', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 5m
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const steps = getSteps();
    expect(steps[0].cycletime).toEqual({ min: '5m', max: undefined });
    expect(steps[0].changeover).toBeUndefined();
    expect(steps[0].uptime).toBeUndefined();
    expect(steps[0].batch).toBeUndefined();
    expect(steps[0].flowType).toBeUndefined();
  });

  it('should parse duration ranges', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 1h-1d
        changeover 30m-2h
        pull
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const steps = getSteps();
    expect(steps[0].cycletime).toEqual({ min: '1h', max: '1d' });
    expect(steps[0].changeover).toEqual({ min: '30m', max: '2h' });
    expect(steps[0].flowType).toBe('pull');
  });

  it('should parse queues', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 1s

    queue 3d
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const queues = getQueues();
    expect(queues).toHaveLength(1);
    expect(queues[0].value).toEqual({ min: '3d', max: undefined });
  });

  it('should parse queue with range', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 1s

    queue 2w-3w
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const queues = getQueues();
    expect(queues[0].value).toEqual({ min: '2w', max: '3w' });
  });

  it('should parse summary with all', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 1s

    summary all
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const summary = getSummary();
    expect(summary).toBeDefined();
    expect(summary!.all).toBe(true);
  });

  it('should parse summary with specific items', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 1s

    summary
        leadtime
        waste
        efficiency
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const summary = getSummary();
    expect(summary).toBeDefined();
    expect(summary!.all).toBe(false);
    expect(summary!.items).toEqual(['leadtime', 'waste', 'efficiency']);
  });

  it('should parse title and accessibility', async () => {
    const str = `vsm
    title Widget Production
    accTitle: VSM of Widget Line
    accDescr: Value stream map showing the widget production flow

    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 1s
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getDiagramTitle()).toBe('Widget Production');
    expect(getAccTitle()).toBe('VSM of Widget Line');
    expect(getAccDescription()).toBe('Value stream map showing the widget production flow');
  });

  it('should handle a full vsm diagram', async () => {
    const str = `vsm
    supplier "Steel Co" >> stamping >> welding >> assembly >> customer "Customer"

    stamping "Stamping"
        cycletime 1s
        changeover 1h
        push

    queue 3d

    welding "Welding"
        cycletime 38s
        changeover 10m
        push

    queue 2d

    assembly "Assembly"
        cycletime 62s
        pull

    queue 1d

    summary all
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getSteps()).toHaveLength(3);
    expect(getQueues()).toHaveLength(3);
    expect(getSummary()!.all).toBe(true);
  });

  it('should preserve flow order', async () => {
    const str = `vsm
    supplier "Steel Co" >> stamping >> welding >> customer "Client"

    stamping "Stamping"
        cycletime 1s

    welding "Welding"
        cycletime 2s
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const flow = getFlow();
    expect(flow).toHaveLength(4);
    expect(flow[0]).toEqual({ kind: 'endpoint', data: { type: 'supplier', label: 'Steel Co' } });
    expect(flow[1]).toEqual({ kind: 'process', name: 'stamping' });
    expect(flow[2]).toEqual({ kind: 'process', name: 'welding' });
    expect(flow[3]).toEqual({ kind: 'endpoint', data: { type: 'customer', label: 'Client' } });
  });

  it('should handle from/to aliases', async () => {
    const str = `vsm
    from "Design" >> review >> to "Deploy"

    review "Code Review"
        cycletime 1h-1d
        pull
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const flow = getFlow();
    expect(flow.some((f) => f.kind === 'endpoint' && f.data.type === 'from')).toBe(true);
    expect(flow.some((f) => f.kind === 'endpoint' && f.data.type === 'to')).toBe(true);
  });

  it('should handle no summary', async () => {
    const str = `vsm
    from "Start" >> step1 >> to "End"

    step1 "Step One"
        cycletime 1s
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getSummary()).toBeUndefined();
  });

  it('should handle comments', async () => {
    const str = `vsm
    %% This is a comment
    from "Start" >> step1 >> to "End"
    %% Another comment
    step1 "Step One"
        cycletime 1s
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  describe('parseDurationToMinutes', () => {
    it('should parse seconds', () => {
      expect(parseDurationToMinutes('30s')).toBe(0.5);
    });

    it('should parse minutes', () => {
      expect(parseDurationToMinutes('5m')).toBe(5);
    });

    it('should parse hours', () => {
      expect(parseDurationToMinutes('2h')).toBe(120);
    });

    it('should parse days', () => {
      expect(parseDurationToMinutes('3d')).toBe(3 * 24 * 60);
    });

    it('should parse weeks', () => {
      expect(parseDurationToMinutes('1w')).toBe(7 * 24 * 60);
    });

    it('should return 0 for invalid input', () => {
      expect(parseDurationToMinutes('abc')).toBe(0);
    });
  });

  describe('computeSummaryValues', () => {
    it('should compute totals for single-value durations', () => {
      const steps: VsmStep[] = [
        { name: 'a', label: 'A', cycletime: { min: '5m' } },
        { name: 'b', label: 'B', cycletime: { min: '10m' } },
      ];
      const queues: VsmQueue[] = [{ value: { min: '3d' } }];

      const result = computeSummaryValues(steps, queues);
      expect(result.processtimeMin).toBe(15);
      expect(result.processtimeMax).toBe(15);
      expect(result.wasteMin).toBe(3 * 24 * 60);
      expect(result.wasteMax).toBe(3 * 24 * 60);
      expect(result.leadtimeMin).toBe(15 + 3 * 24 * 60);
      expect(result.leadtimeMax).toBe(15 + 3 * 24 * 60);
    });

    it('should compute ranges correctly', () => {
      const steps: VsmStep[] = [{ name: 'a', label: 'A', cycletime: { min: '1h', max: '2h' } }];
      const queues: VsmQueue[] = [{ value: { min: '1d', max: '3d' } }];

      const result = computeSummaryValues(steps, queues);
      expect(result.processtimeMin).toBe(60);
      expect(result.processtimeMax).toBe(120);
      expect(result.wasteMin).toBe(24 * 60);
      expect(result.wasteMax).toBe(3 * 24 * 60);
    });

    it('should return zero waste when no queues', () => {
      const steps: VsmStep[] = [{ name: 'a', label: 'A', cycletime: { min: '5m' } }];
      const queues: VsmQueue[] = [];

      const result = computeSummaryValues(steps, queues);
      expect(result.wasteMin).toBe(0);
      expect(result.wasteMax).toBe(0);
      expect(result.leadtimeMin).toBe(result.processtimeMin);
    });

    it('should handle steps without cycletime', () => {
      const steps: VsmStep[] = [{ name: 'a', label: 'A' }];
      const queues: VsmQueue[] = [{ value: { min: '1d' } }];

      const result = computeSummaryValues(steps, queues);
      expect(result.processtimeMin).toBe(0);
      expect(result.processtimeMax).toBe(0);
    });

    it('should produce 100% efficiency when no queues', () => {
      const steps: VsmStep[] = [{ name: 'a', label: 'A', cycletime: { min: '1h', max: '2h' } }];
      const queues: VsmQueue[] = [];

      const result = computeSummaryValues(steps, queues);
      // efficiency = processtime / (processtime + waste)
      // with no waste, efficiency is 100% for both best and worst case
      const effMin = result.processtimeMin / (result.processtimeMin + result.wasteMax);
      const effMax = result.processtimeMax / (result.processtimeMax + result.wasteMin);
      expect(effMin).toBe(1);
      expect(effMax).toBe(1);
    });
  });
});
