import { describe, expect, it } from 'vitest';
import { preprocess } from './preprocessor.js';

describe('preprocess()', () => {
  // ---------------------------------------------------------------------------
  // Passthrough — plain Mermaid is unchanged
  // ---------------------------------------------------------------------------
  it('passes through plain Mermaid unchanged', () => {
    const src = `flowchart LR\n  A --> B`;
    const { diagram, interactions } = preprocess(src);
    expect(diagram).toBe(src);
    expect(interactions).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Template extraction — template blocks are removed from output
  // ---------------------------------------------------------------------------
  it('removes template blocks from the diagram', () => {
    const src = `template Svc(name) {\n  name[Service]\n}\nflowchart LR`;
    const { diagram } = preprocess(src);
    expect(diagram).not.toContain('template');
    expect(diagram).toContain('flowchart LR');
  });

  // ---------------------------------------------------------------------------
  // Scalar parameter substitution
  // ---------------------------------------------------------------------------
  it('substitutes scalar template parameters', () => {
    const src = [
      'template Box(label) {',
      '  B[label]',
      '}',
      'flowchart LR',
      '  use Box(label="Hello")',
    ].join('\n');
    const { diagram } = preprocess(src);
    expect(diagram).toContain('B[Hello]');
    expect(diagram).not.toContain('use Box');
  });

  it('does not substitute partial word matches for scalar params', () => {
    // "node" should not be replaced inside "nodeId"
    const src = [
      'template T(node) {',
      '  nodeId --> node',
      '}',
      'flowchart LR',
      '  use T(node="X")',
    ].join('\n');
    const { diagram } = preprocess(src);
    expect(diagram).toContain('nodeId --> X');
    expect(diagram).not.toContain('nodeId --> node');
  });

  // ---------------------------------------------------------------------------
  // Array parameter substitution
  // ---------------------------------------------------------------------------
  it('substitutes array template parameters by index', () => {
    const src = [
      'template Svc(endpoints[]) {',
      '  A --> endpoints[0]',
      '  A --> endpoints[1]',
      '}',
      'flowchart LR',
      '  use Svc(endpoints=["E1", "E2"])',
    ].join('\n');
    const { diagram } = preprocess(src);
    expect(diagram).toContain('A --> E1');
    expect(diagram).toContain('A --> E2');
  });

  // ---------------------------------------------------------------------------
  // Multiple use invocations of the same template
  // ---------------------------------------------------------------------------
  it('expands multiple use invocations of the same template', () => {
    const src = [
      'template Node(id, lbl) {',
      '  id[lbl]',
      '}',
      'flowchart LR',
      '  use Node(id="A", lbl="Alpha")',
      '  use Node(id="B", lbl="Beta")',
    ].join('\n');
    const { diagram } = preprocess(src);
    expect(diagram).toContain('A[Alpha]');
    expect(diagram).toContain('B[Beta]');
  });

  // ---------------------------------------------------------------------------
  // Unknown template
  // ---------------------------------------------------------------------------
  it('emits an error comment for unknown template references', () => {
    const src = `flowchart LR\n  use Missing(x="1")`;
    const { diagram } = preprocess(src);
    expect(diagram).toContain('%% [ERROR] Unknown template: Missing');
  });

  // ---------------------------------------------------------------------------
  // Interaction blocks extracted and encoded
  // ---------------------------------------------------------------------------
  it('extracts a simple interaction block and encodes it as a %% comment', () => {
    const src = [
      'flowchart LR',
      '  A --> B',
      'interaction A {',
      '  collapsible: true',
      '  tooltip: "Click me"',
      '}',
    ].join('\n');
    const { diagram, interactions } = preprocess(src);
    expect(diagram).not.toContain('interaction A');
    expect(diagram).toContain('%% @interact A');
    expect(interactions).toHaveLength(1);
    expect(interactions[0]).toMatchObject({
      nodeId: 'A',
      props: { collapsible: true, tooltip: 'Click me' },
    });
  });

  it('extracts multiple interaction blocks', () => {
    const src = [
      'flowchart LR',
      '  A --> B --> C',
      'interaction A { collapsible: true }',
      'interaction C { collapsible: true\n  defaultState: collapsed }',
    ].join('\n');
    const { interactions } = preprocess(src);
    expect(interactions).toHaveLength(2);
    expect(interactions[0].nodeId).toBe('A');
    expect(interactions[1].nodeId).toBe('C');
    expect(interactions[1].props.defaultState).toBe('collapsed');
  });

  it('coerces numeric values in interaction props', () => {
    const src = [
      'flowchart LR',
      '  A --> B',
      'interaction A {',
      '  expandedOpacity: 0.8',
      '  collapsedZoom: 2',
      '}',
    ].join('\n');
    const { interactions } = preprocess(src);
    expect(interactions[0].props.expandedOpacity).toBe(0.8);
    expect(interactions[0].props.collapsedZoom).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // Interaction blocks inside templates — expanded correctly
  // ---------------------------------------------------------------------------
  it('processes interaction blocks inside expanded templates', () => {
    const src = [
      'template Svc(name) {',
      '  name[Service]',
      '  interaction name {',
      '    collapsible: true',
      '  }',
      '}',
      'flowchart LR',
      '  use Svc(name="Auth")',
    ].join('\n');
    const { interactions } = preprocess(src);
    expect(interactions).toHaveLength(1);
    expect(interactions[0].nodeId).toBe('Auth');
  });

  // ---------------------------------------------------------------------------
  // Labels containing ) and } — brittle regex edge cases
  // ---------------------------------------------------------------------------
  it('handles node labels containing ) without breaking template use expansion', () => {
    // `use` expansion uses a regex that captures to the closing `)`. A label
    // containing `)` inside the template body should be left intact.
    const src = [
      'template T(n) {',
      '  n["text (note)"]',
      '}',
      'flowchart LR',
      '  use T(n="X")',
    ].join('\n');
    const { diagram } = preprocess(src);
    expect(diagram).toContain('X["text (note)"]');
  });

  it('handles node labels containing } without breaking interaction extraction', () => {
    // Interaction extraction uses a regex up to the first `}`. The label `}` in
    // a diagram node should be preserved (it never appears in an interaction block).
    const src = [
      'flowchart LR',
      '  A["{key: val}"] --> B',
      'interaction B { collapsible: true }',
    ].join('\n');
    const { diagram, interactions } = preprocess(src);
    expect(diagram).toContain('A["{key: val}"]');
    expect(interactions).toHaveLength(1);
    expect(interactions[0].nodeId).toBe('B');
  });
});
