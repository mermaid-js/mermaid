import { describe, expect, it } from 'vitest';
import { createJourneyTestServices } from './test-utils.js';
import { Journey } from '../src/language/index.js';

describe('journey', () => {
  const { parse } = createJourneyTestServices();

  it.each([
    `journey`,
    `  journey  `,
    `\tjourney\t`,
    `

    \tjourney

    `,
  ])('should handle empty journey', (context: string) => {
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Journey);
  });

  it('should handle a section definition', function () {
    const context = `journey
    section order from website`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.sections[0].title).toBe('order from website');
    expect(value.$type).toBe(Journey);
  });

  it('should handle a section with task definition', () => {
    const context = `journey
    section order from website
    task a: 5: cat`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.sections[0].title).toBe('order from website');
    expect(value.sections[0].tasks[0].actors).toStrictEqual(['cat']);
    expect(value.sections[0].tasks[0].score).toBe(5);
    expect(value.sections[0].tasks[0].title).toBe('task a');
    expect(value.$type).toBe(Journey);
  });

  it('should handle a task definition', () => {
    const context = `journey
    section documentation
    A task: 5: alice, bob, charlie
    B task: 3: bob, charlie
    C task: 5
    section another section
    P task: 5
    Q task: 5
    R task: 5
    `;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const { sections } = result.value;

    expect(sections[0].title).toBe('documentation');
    const { tasks: sectionOneTasks } = sections[0];
    expect(sectionOneTasks[0].actors).toStrictEqual(['alice', 'bob', 'charlie']);
    expect(sectionOneTasks[0].score).toBe(5);
    expect(sectionOneTasks[0].title).toBe('A task');

    expect(sectionOneTasks[1].actors).toStrictEqual(['bob', 'charlie']);
    expect(sectionOneTasks[1].score).toBe(3);
    expect(sectionOneTasks[1].title).toBe('B task');

    expect(sectionOneTasks[2].actors).toStrictEqual([]);
    expect(sectionOneTasks[2].score).toBe(5);
    expect(sectionOneTasks[2].title).toBe('C task');

    expect(sections[1].title).toBe('another section');
    const { tasks: sectionTwoTasks } = sections[1];
    expect(sectionTwoTasks[0].actors).toStrictEqual([]);
    expect(sectionTwoTasks[0].score).toBe(5);
    expect(sectionTwoTasks[0].title).toBe('P task');

    expect(sectionTwoTasks[1].actors).toStrictEqual([]);
    expect(sectionTwoTasks[1].score).toBe(5);
    expect(sectionTwoTasks[1].title).toBe('Q task');

    expect(sectionTwoTasks[2].actors).toStrictEqual([]);
    expect(sectionTwoTasks[2].score).toBe(5);
    expect(sectionTwoTasks[2].title).toBe('R task');
  });
});
