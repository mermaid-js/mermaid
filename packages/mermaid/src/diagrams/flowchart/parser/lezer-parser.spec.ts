/**
 * Test the new Lezer-based flowchart parser
 */

import { describe, it, expect, beforeEach } from 'vitest';
import flowParser from './flowParser.ts';
import { FlowDB } from '../flowDb.js';

describe('Lezer Flowchart Parser', () => {
  let flowDb: FlowDB;

  beforeEach(() => {
    flowDb = new FlowDB();
    flowParser.parser.yy = flowDb;
    flowDb.clear();
  });

  it('should parse basic graph keyword', () => {
    const result = flowParser.parser.parse('graph TD');
    expect(result).toBeDefined();
    expect(flowDb.getDirection()).toBe('TB'); // TD is converted to TB by FlowDB
  });

  it('should parse flowchart keyword', () => {
    const result = flowParser.parser.parse('flowchart LR');
    expect(result).toBeDefined();
    expect(flowDb.getDirection()).toBe('LR');
  });

  it('should parse graph with single node', () => {
    const result = flowParser.parser.parse('graph TD\nA');
    expect(result).toBeDefined();
    expect(flowDb.getDirection()).toBe('TB'); // TD is converted to TB by FlowDB

    const vertices = flowDb.getVertices();
    expect(vertices.has('A')).toBe(true); // Use Map.has() instead of Object.keys()
  });

  it('should parse graph with simple edge', () => {
    const result = flowParser.parser.parse('graph TD\nA --> B');
    expect(result).toBeDefined();
    expect(flowDb.getDirection()).toBe('TB'); // TD is converted to TB by FlowDB

    const vertices = flowDb.getVertices();
    const edges = flowDb.getEdges();

    expect(vertices.has('A')).toBe(true); // Use Map.has() instead of Object.keys()
    expect(vertices.has('B')).toBe(true);
    expect(edges.length).toBeGreaterThan(0);
  });
});
