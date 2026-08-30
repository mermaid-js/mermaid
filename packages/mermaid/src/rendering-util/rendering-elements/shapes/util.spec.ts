import { describe, it, expect } from 'vitest';
import type { Node } from '../../types.js';
import { getNodeClasses } from './util.js';

const node = (fields: Partial<Node> = {}): Node => ({ id: 'n', ...fields }) as Node;

describe('getNodeClasses', () => {
  it('names what the node is to the renderer', () => {
    expect(getNodeClasses(node({ cssClasses: 'default' }))).toBe('node default');
  });

  it('names a hand drawn node as one', () => {
    expect(getNodeClasses(node({ look: 'handDrawn', cssClasses: 'default' }))).toBe(
      'rough-node default'
    );
  });

  it('adds what the shape asks for', () => {
    expect(getNodeClasses(node({ cssClasses: 'bpmn-event' }), 'bpmn-event-start')).toBe(
      'node bpmn-event bpmn-event-start'
    );
  });

  it('writes a class named by both the diagram and the shape once', () => {
    expect(getNodeClasses(node({ cssClasses: 'bpmn-activity' }), 'bpmn-activity')).toBe(
      'node bpmn-activity'
    );
    expect(getNodeClasses(node({ cssClasses: 'bpmn-event bpmn-throw' }), 'bpmn-event')).toBe(
      'node bpmn-event bpmn-throw'
    );
  });

  it('leaves nothing behind for a class the node does not have', () => {
    expect(getNodeClasses(node())).toBe('node');
    expect(getNodeClasses(node({ cssClasses: '' }), '')).toBe('node');
  });
});
