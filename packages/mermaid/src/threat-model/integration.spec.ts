import { describe, expect, it } from 'vitest';
import { mermaidAPI } from '../mermaidAPI.js';

const source = (target = 'API', kind = 'process', body = 'flowchart LR\n API --> DB') => `---
threatModel:
  version: 1
  id: api
  state: draft
  elements:
    - id: ${target}
      kind: ${kind}
  threats: []
---
${body}`;

describe('public threat modeling API', () => {
  it('returns machine-readable metadata from parse without changing diagram type', async () => {
    const result = await mermaidAPI.parse(source());
    expect(result.diagramType).toBe('flowchart-v2');
    expect(result.threatModel?.elements).toEqual([{ id: 'API', kind: 'process' }]);
  });
  it('preserves literal HTML-like evidence text in frontmatter', async () => {
    const input = source().replace(
      '  threats: []',
      `  notes: ['<a href="https://example.org">evidence</a>']\n  threats: []`
    );
    expect((await mermaidAPI.parse(input)).threatModel?.notes).toEqual([
      '<a href="https://example.org">evidence</a>',
    ]);
  });
  it('does not leak metadata into the next diagram', async () => {
    await mermaidAPI.parse(source());
    expect(await mermaidAPI.parse('flowchart LR\n A --> B')).not.toHaveProperty('threatModel');
  });
  it('validates references during parse, including suppressErrors', async () => {
    await expect(mermaidAPI.parse(source('missing'))).rejects.toThrow('no matching');
    expect(await mermaidAPI.parse(source('missing'), { suppressErrors: true })).toBe(false);
  });
  it('binds explicit edge IDs and subgraph IDs', async () => {
    await expect(
      mermaidAPI.parse(source('query', 'flow', 'flowchart LR\n API query@--> DB'))
    ).resolves.toHaveProperty('threatModel');
    await expect(
      mermaidAPI.parse(
        source('Zone', 'boundary', 'flowchart LR\n subgraph Zone\n API --> DB\n end')
      )
    ).resolves.toHaveProperty('threatModel');
  });
  it('rejects unsupported diagram families instead of silently ignoring annotations', async () => {
    await expect(
      mermaidAPI.parse(source('API', 'process', 'sequenceDiagram\n API->>DB: query'))
    ).rejects.toThrow('currently supports');
  });
});
