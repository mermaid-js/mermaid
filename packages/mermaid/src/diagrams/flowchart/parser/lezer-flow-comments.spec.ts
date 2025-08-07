/**
 * Lezer-based flowchart parser tests for comment handling
 * Migrated from flow-comments.spec.js to test Lezer parser compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import flowParser from './flowParser.ts';
import { FlowDB } from '../flowDb.js';
import { setConfig } from '../../../config.js';
import { cleanupComments } from '../../../diagram-api/comments.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Lezer Comments] when parsing', () => {
  beforeEach(() => {
    flowParser.parser.yy = new FlowDB();
    flowParser.parser.yy.clear();
  });

  it('should handle comments', () => {
    const result = flowParser.parser.parse(cleanupComments('graph TD;\n%% Comment\n A-->B;'));

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the start', () => {
    const result = flowParser.parser.parse(cleanupComments('%% Comment\ngraph TD;\n A-->B;'));

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the end', () => {
    const result = flowParser.parser.parse(
      cleanupComments('graph TD;\n A-->B\n %% Comment at the end\n')
    );

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the end no trailing newline', () => {
    const result = flowParser.parser.parse(cleanupComments('graph TD;\n A-->B\n%% Comment'));

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle comments at the end many trailing newlines', () => {
    const result = flowParser.parser.parse(cleanupComments('graph TD;\n A-->B\n%% Comment\n\n\n'));

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle no trailing newlines', () => {
    const result = flowParser.parser.parse(cleanupComments('graph TD;\n A-->B'));

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle many trailing newlines', () => {
    const result = flowParser.parser.parse(cleanupComments('graph TD;\n A-->B\n\n'));

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle a comment with blank rows in-between', () => {
    const result = flowParser.parser.parse(cleanupComments('graph TD;\n\n\n %% Comment\n A-->B;'));

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });

  it('should handle a comment with mermaid flowchart code in them', () => {
    const result = flowParser.parser.parse(
      cleanupComments(
        'graph TD;\n\n\n %% Test od>Odd shape]-->|Two line<br>edge comment|ro;\n A-->B;'
      )
    );

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
  });
});
