import { describe, it, expect } from 'vitest';
import { parseBpmn } from './bpmn.parser.js';

describe('artifact statements', () => {
  it('parses a data object, a data store and an annotation', () => {
    const parsed = parseBpmn(`bpmn-beta LR
  lane "Fulfilment"
    task t1 "Pick items"
    data d1 "Pick list"
    data-store ds1 "Inventory"
    note n1 "Stock checked nightly"
`);

    expect(parsed.nodes.map((n) => [n.id, n.kind])).toEqual([
      // A container with no explicit id gets a generated one; the quoted text is its label.
      ['lane-1', 'lane'],
      ['t1', 'activity'],
      ['d1', 'data'],
      ['ds1', 'store'],
      ['n1', 'annotation'],
    ]);
  });
});
