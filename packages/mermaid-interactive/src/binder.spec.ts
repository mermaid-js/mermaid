import { describe, expect, it } from 'vitest';
import { parseEdgeId, parseInteractions } from './binder.js';

// ---------------------------------------------------------------------------
// parseInteractions()
// ---------------------------------------------------------------------------
describe('parseInteractions()', () => {
  it('returns empty array for plain Mermaid with no @interact comments', () => {
    const src = 'flowchart LR\n  A --> B';
    expect(parseInteractions(src)).toHaveLength(0);
  });

  it('parses a single @interact comment', () => {
    const src = 'flowchart LR\n  A --> B\n%% @interact A {"collapsible":true}';
    const interactions = parseInteractions(src);
    expect(interactions).toHaveLength(1);
    expect(interactions[0]).toEqual({
      nodeId: 'A',
      props: { collapsible: true },
    });
  });

  it('parses multiple @interact comments', () => {
    const src = [
      'flowchart LR',
      '  A --> B --> C',
      '%% @interact A {"collapsible":true,"tooltip":"Click"}',
      '%% @interact C {"collapsible":true,"defaultState":"collapsed"}',
    ].join('\n');
    const interactions = parseInteractions(src);
    expect(interactions).toHaveLength(2);
    expect(interactions[0].nodeId).toBe('A');
    expect(interactions[0].props.tooltip).toBe('Click');
    expect(interactions[1].nodeId).toBe('C');
    expect(interactions[1].props.defaultState).toBe('collapsed');
  });

  it('silently skips @interact comments with malformed JSON', () => {
    const src = 'flowchart LR\n%% @interact A {bad json}\n%% @interact B {"collapsible":true}';
    const interactions = parseInteractions(src);
    // Only the valid one is returned
    expect(interactions).toHaveLength(1);
    expect(interactions[0].nodeId).toBe('B');
  });

  it('handles all interaction prop types: boolean, string, number', () => {
    const src =
      '%% @interact N {"collapsible":true,"tooltip":"Hi","expandedOpacity":0.9,"collapsedZoom":2}';
    const [n] = parseInteractions(src);
    expect(n.props.collapsible).toBe(true);
    expect(n.props.tooltip).toBe('Hi');
    expect(n.props.expandedOpacity).toBe(0.9);
    expect(n.props.collapsedZoom).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// parseEdgeId()
// ---------------------------------------------------------------------------
describe('parseEdgeId()', () => {
  it('returns null for an empty string', () => {
    expect(parseEdgeId('')).toBeNull();
  });

  it('returns null for an opaque stateDiagram edge ID like "edge0"', () => {
    expect(parseEdgeId('edge0')).toBeNull();
    expect(parseEdgeId('edge42')).toBeNull();
  });

  it('returns null for unrecognised formats', () => {
    expect(parseEdgeId('random-string')).toBeNull();
    expect(parseEdgeId('A-B')).toBeNull();
  });

  // Flowchart — dash format (older renderer)
  it('parses flowchart dash-format IDs: L-SOURCE-TARGET-N', () => {
    expect(parseEdgeId('L-A-B-0')).toEqual({ source: 'A', target: 'B' });
    expect(parseEdgeId('L-OrderItem-Product-3')).toEqual({
      source: 'OrderItem',
      target: 'Product',
    });
  });

  it('does not parse L- format without trailing counter', () => {
    expect(parseEdgeId('L-A-B')).toBeNull();
  });

  // Flowchart — underscore format (current getEdgeId)
  it('parses flowchart underscore-format IDs: L_SOURCE_TARGET_N', () => {
    expect(parseEdgeId('L_A_B_0')).toEqual({ source: 'A', target: 'B' });
    expect(parseEdgeId('L_AuthService_Database_1')).toEqual({
      source: 'AuthService',
      target: 'Database',
    });
  });

  // classDiagram format
  it('parses classDiagram IDs: id_SOURCE_TARGET_N', () => {
    expect(parseEdgeId('id_Animal_Dog_0')).toEqual({ source: 'Animal', target: 'Dog' });
    expect(parseEdgeId('id_OrderItem_Product_2')).toEqual({
      source: 'OrderItem',
      target: 'Product',
    });
  });

  // Node names containing compound names
  it('handles compound node names in classDiagram format', () => {
    const result = parseEdgeId('id_ShoppingCart_OrderItem_0');
    expect(result).toEqual({ source: 'ShoppingCart', target: 'OrderItem' });
  });
});
