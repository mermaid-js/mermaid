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

  it.each([
    // TB
    'TB',
    'v',
    'TD',
    // LR
    'LR',
    '<',
    // RL
    'RL',
    '>',
    // BT
    'BT',
    '^',
  ])('should handle direction', (context: string) => {
    const result = parse(`flowchart ${context}`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.dir).toBe(context);
  });

  it.each([`flowchart`, `graph`, `flowchart-elk`])(
    'should handle flowchart types',
    (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.type).toBe(context);
    }
  );

  it.each([`flowchart ; A`, `flowchart\nA`, `flowchart;A`, `flowchart;\nA`])(
    'should handle delimiters',
    (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
    }
  );

  it.each([`flowchart\n%% comment\nA`, `flowchart\n \t%% comment\nA`])(
    'should handle comments',
    (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
    }
  );

  it.each([
    '.',
    'Start 103a.a1',
    '_',
    ':',
    ',',
    'a-b',
    '+',
    '*',
    '<',
    '&lt;',
    '>',
    '&gt;',
    '=',
    '&equals;',
    '&',
  ])('should handle special characters in labels', (context: string) => {
    const result = parse(`flowchart;A(${context})-->B;`);
    expectNoErrorsOrAlternatives(result);
  });

  it.each([
    ['[a]', 'FlowchartNodeSquare'],
    ['(a)', 'FlowchartNodeRound'],
    ['{a}', 'FlowchartNodeDiamond'],
    ['(-a-)', 'FlowchartNodeEllipse'],
    ['([a])', 'FlowchartNodeStadium'],
    ['>a]', 'FlowchartNodeOdd'],
    ['[(a)]', 'FlowchartNodeCylinder'],
    ['(((a)))', 'FlowchartNodeDoublecircle'],
    ['[/a\\]', 'FlowchartNodeTrapezoid'],
    ['[\\a/]', 'FlowchartNodeInvTrapezoid'],
    ['[/a/]', 'FlowchartNodeLeanRight'],
    ['[\\a\\]', 'FlowchartNodeLeanLeft'],
    ['[[a]]', 'FlowchartNodeSubroutine'],
    ['{{a}}', 'FlowchartNodeHexagon'],
  ])('should handle shapes', (context: string, nodeType: string) => {
    const result = parse(`flowchart;A${context};`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.nodes).toHaveLength(1);
    expect(result.value.nodes[0].id).toBe('A');
    expect(result.value.nodes[0].label).toBe(context);
    expect(result.value.nodes[0].$type).toBe(nodeType);
  });

  it.each([
    ['-->', 'FlowchartEdgeRegular', undefined],
    ['-->|a|', 'FlowchartEdgeRegular', '|a|'],
    ['-.->', 'FlowchartEdgeDotted', undefined],
    ['-.->|a|', 'FlowchartEdgeDotted', '|a|'],
    ['==>', 'FlowchartEdgeThick', undefined],
    ['==>|a|', 'FlowchartEdgeThick', '|a|'],
    ['~~~', 'FlowchartEdgeInvisible', undefined],
    ['~~~|a|', 'FlowchartEdgeInvisible', '|a|'],
  ])('should handle edge labels', (context: string, edgeType: string, label?: string) => {
    const result = parse(`flowchart;A ${context} B;`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.edges).toHaveLength(1);
    expect(result.value.edges[0].start.id).toBe('A');
    expect(result.value.edges[0].end.id).toBe('B');
    expect(result.value.edges[0].$type).toBe(edgeType);
    expect(result.value.edges[0].label).toBe(label);
  });

  it.each([
    '---',
    '-->',
    '--x',
    '--o',
    '<--',
    'x--',
    'o--',
    '<-->',
    '===',
    '==>',
    '==x',
    '==o',
    '<==',
    'x==',
    'o==',
    '<==>',
    '-.-',
    '-.->',
    '-.-x',
    '-.-o',
    '<-.-',
    'x-.-',
    'o-.-',
    '<-.->',
    '.-',
    '<.-',
    '.->',
  ])('should handle arrow end and start types', (context: string) => {
    const result = parse(`flowchart;A ${context} B;`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.edges).toHaveLength(1);
    expect(result.value.edges[0].start.id).toBe('A');
    expect(result.value.edges[0].end.id).toBe('B');
  });

  it.each([
    '---',
    '----',
    '-----',
    '-->',
    '--->',
    '---->',
    '===',
    '====',
    '=====',
    '==>',
    '===>',
    '====>',
    '-.-',
    '-..-',
    '-...-',
    '-.->',
    '-..->',
    '-...->',
  ])('should handle arrow lengths', (context: string) => {
    const result = parse(`flowchart;A ${context} B;`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.edges).toHaveLength(1);
    expect(result.value.edges[0].start.id).toBe('A');
    expect(result.value.edges[0].end.id).toBe('B');
  });

  it.each([
    '--a---',
    '--a-->',
    '<--a-->',
    '<--a---', // 👈 last one doesn't work in playground
    '==a===',
    '==a==>',
    '<==a==>',
    '<==a===', // 👈 last one doesn't work in playground
    '-.a.-',
    '-.a.->',
    '<-.a.-',
  ])('should handle arrow labels', (context: string) => {
    const result = parse(`flowchart;A ${context} B;`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.edges).toHaveLength(1);
    expect(result.value.edges[0].start.id).toBe('A');
    expect(result.value.edges[0].end.id).toBe('B');
  });

  // subgraph: subgraph, direction, end
  // chaining: A -- text --> B -- text2 --> C
  // conjunction: a --> b & c--> d, A & B--> C & D
});
