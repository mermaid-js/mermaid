import { describe, it, expect, beforeEach } from 'vitest';
import { WardleyBuilder } from './wardleyBuilder.js';

describe('WardleyBuilder.resolveNodeId', () => {
  let builder: WardleyBuilder;

  beforeEach(() => {
    builder = new WardleyBuilder();
  });

  it('returns the id when a node exists with that exact id', () => {
    builder.addNode({ id: 'API', label: 'API', x: 60, y: 70 });
    expect(builder.resolveNodeId('API')).toBe('API');
  });

  it('falls back to label match for pipeline-style synthetic ids', () => {
    builder.addNode({
      id: 'Kettle_Campfire Kettle',
      label: 'Campfire Kettle',
      x: 35,
      y: 45,
      className: 'pipeline-component',
    });
    expect(builder.resolveNodeId('Campfire Kettle')).toBe('Kettle_Campfire Kettle');
  });

  it('returns the input unchanged when no id or label matches', () => {
    builder.addNode({ id: 'API', label: 'API', x: 60, y: 70 });
    expect(builder.resolveNodeId('Unknown')).toBe('Unknown');
  });

  it('prefers exact id over label match when both exist', () => {
    builder.addNode({ id: 'Alpha', label: 'Beta', x: 0, y: 0 });
    builder.addNode({ id: 'Beta', label: 'Gamma', x: 1, y: 1 });
    // "Beta" is the id of the second node AND the label of the first — id wins
    expect(builder.resolveNodeId('Beta')).toBe('Beta');
  });
});
