import { describe, expect, it } from 'vitest';

import { createTimelineTestServices } from './test-utils.js';

describe('timeline', () => {
  const { parse } = createTimelineTestServices();

  it('should handle a simple section definition abc-123', () => {
    const context = `timeline
    section abc-123`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    expect(result.value.sections[0].title).toBe('abc-123');
  });

  it('should handle a simple section and only two tasks', () => {
    const context = `timeline
    section abc-123
    task1
    task2`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    expect(result.value.sections[0].title).toBe('abc-123');
    expect(result.value.sections[0].periods[0].title).toBe('task1');
    expect(result.value.sections[0].periods[1].title).toBe('task2');
  });

  it('should handle a two section and two coressponding tasks', () => {
    const context = `timeline
    section abc-123
    task1
    task2
    section abc-456
    task3
    task4`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    expect(result.value.sections[0].title).toBe('abc-123');
    expect(result.value.sections[0].periods[0].title).toBe('task1');
    expect(result.value.sections[0].periods[1].title).toBe('task2');

    expect(result.value.sections[1].title).toBe('abc-456');
    expect(result.value.sections[1].periods[0].title).toBe('task3');
    expect(result.value.sections[1].periods[1].title).toBe('task4');
  });

  it('should handle a section, and task and its events', () => {
    const context = `timeline
    section abc-123
    task1: event1
    task2: event2: event3`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    expect(result.value.sections[0].title).toBe('abc-123');
    expect(result.value.sections[0].periods[0].title).toBe('task1');
    expect(result.value.sections[0].periods[0].events[0]).toBe('event1');
    expect(result.value.sections[0].periods[1].title).toBe('task2');
    expect(result.value.sections[0].periods[1].events[0]).toBe('event2');
    expect(result.value.sections[0].periods[1].events[1]).toBe('event3');
  });

  it('should handle a section, and task and its multi line events', () => {
    const context = `timeline
    section abc-123
    task1: event1
    task2: event2: event3
          : event4: event5
    `;

    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    expect(result.value.sections[0].title).toBe('abc-123');
    expect(result.value.sections[0].periods[0].title).toBe('task1');
    expect(result.value.sections[0].periods[0].events[0]).toBe('event1');
    expect(result.value.sections[0].periods[1].title).toBe('task2');
    expect(result.value.sections[0].periods[1].events[0]).toBe('event2');
    expect(result.value.sections[0].periods[1].events[1]).toBe('event3');
    expect(result.value.sections[0].periods[1].events[2]).toBe('event4');
    expect(result.value.sections[0].periods[1].events[3]).toBe('event5');
  });
});
