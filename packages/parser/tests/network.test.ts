import { describe, expect, it } from 'vitest';

import { Network } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, networkParse as parse } from './test-util.js';

describe('network', () => {
  it.each([`network`, `networkDiagram`])('should handle empty diagram', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Network.$type);
  });

  it('should handle nodes and links', () => {
    const result = parse(`networkDiagram
    title Sample Topology
    accTitle: Sample
    accDescr: A sample network
    node router : router "Router"
    node sw1 : switch "Switch 1"
    node sw2 : switch "Switch 2"
    node srv : server "Server"
    router --- sw1
    router --- sw2
    sw1 --- srv : "primary"
    sw2 --- srv : "secondary"
    `);
    expectNoErrorsOrAlternatives(result);
    const ast = result.value;
    expect(ast.title).toBe('Sample Topology');
    expect(ast.accTitle).toBe('Sample');
    expect(ast.accDescr).toBe('A sample network');
    expect(ast.nodes.map((n) => n.id)).toEqual(['router', 'sw1', 'sw2', 'srv']);
    expect(ast.nodes[0].nodeType).toBe('router');
    expect(ast.nodes[0].label).toBe('Router');
    expect(ast.links).toHaveLength(4);
    expect(ast.links[2].label).toBe('primary');
    expect(ast.links[0].arrow).toBe('---');
  });

  it('should accept directional arrows', () => {
    const result = parse(`network
    a --> b
    a <-- b
    a <--> b
    `);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.links.map((l) => l.arrow)).toEqual(['-->', '<--', '<-->']);
  });

  it('should accept per-node metadata', () => {
    const result = parse(`network
    node a : router ip="10.0.0.1" model="hp-1234"
    `);
    expectNoErrorsOrAlternatives(result);
    const meta = result.value.nodes[0].meta;
    expect(meta).toHaveLength(2);
    expect(meta?.[0].key).toBe('ip');
    expect(meta?.[0].value).toBe('10.0.0.1');
    expect(meta?.[1].value).toBe('hp-1234');
  });

  it('should accept subnets', () => {
    const result = parse(`networkDiagram
    subnet vpc1 "VPC 1" {
      node a : router
      a --- b
    }
    `);
    expectNoErrorsOrAlternatives(result);
    const subnet = result.value.subnets[0];
    expect(subnet.id).toBe('vpc1');
    expect(subnet.label).toBe('VPC 1');
    expect(subnet.nodes).toHaveLength(1);
    expect(subnet.links).toHaveLength(1);
  });

  it('should handle nodes without types or labels', () => {
    const result = parse(`network
    node a
    node b : switch
    a --- b
    `);
    expectNoErrorsOrAlternatives(result);
    const ast = result.value;
    expect(ast.nodes).toHaveLength(2);
    expect(ast.nodes[0].nodeType).toBeUndefined();
    expect(ast.nodes[0].label).toBeUndefined();
    expect(ast.nodes[1].nodeType).toBe('switch');
  });

  it('should accept -- as a link', () => {
    const result = parse(`network
    a -- b
    `);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.links).toHaveLength(1);
    expect(result.value.links[0].source).toBe('a');
    expect(result.value.links[0].target).toBe('b');
  });
});
