import { describe, expect, it } from 'vitest';

import { expectNoErrorsOrAlternatives, flowchartParse as parse } from './test-util.js';

describe('flowchart', () => {
  it.each([
    `flowchart`,
    `  flowchart  `,
    `\tflowchart\t`,
    `
    \tflowchart
    `,
  ])('should handle regular flowchart', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.type).toBe('flowchart');
  });

  it.each([`flowchart TD`, `flowchart LR`, `flowchart DT`, `flowchart RL`])(
    'should handle direction',
    (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.dir).toBe(context.split(' ')[1]);
    }
  );

  it('parses basic example', () => {
    const result = parse('flowchart\nA --> B');
    expectNoErrorsOrAlternatives(result);
    expect(result.value.edges).toHaveLength(1);
    expect(result.value.edges[0].start.id).toBe('A');
    expect(result.value.edges[0].end.id).toBe('B');
  });

  it('parses basic example', () => {
    const result = parse('flowchart\nA[test]');
    expectNoErrorsOrAlternatives(result);
    expect(result.value.nodes).toHaveLength(1);
    expect(result.value.nodes[0].id).toBe('A');
    expect(result.value.nodes[0].label).toBe('test');
    expect(result.value.nodes[0].shape).toBe('square');
  });
});
