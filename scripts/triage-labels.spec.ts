import { readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { DIAGRAMS_DIR, detectLabels, findMismatches, loadConfig } from './triage-labels.mjs';

const config = loadConfig();
const fence = (code: string) => '```mermaid\n' + code + '\n```';

describe('triage-labels', () => {
  it('has an entry for every diagram folder', () => {
    const folders = readdirSync(DIAGRAMS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(findMismatches(config, folders)).toEqual({ unlabelled: [], stale: [] });
  });

  it('reports folders without an entry and entries without a folder', () => {
    expect(findMismatches(config, ['flowchart', 'brandNew'])).toMatchObject({
      unlabelled: ['brandNew'],
      stale: expect.arrayContaining(['sequence']),
    });
  });

  it.each([
    ['flowchart LR\n  A --> B', 'Graph: Flow'],
    ['graph TD\n  A --> B', 'Graph: Flow'],
    ['flowchart-elk LR\n  A --> B', 'Graph: Flow'],
    ['gitGraph\n  commit', 'Graph: Git'],
    ['stateDiagram-v2\n  [*] --> A', 'Graph: State'],
    ['block-beta\n  a b', 'Graph: Block'],
    ['treeView-beta\n  root', 'Graph: TreeView'],
    ['railroad-ebnf-beta\n  a = b ;', 'Graph: Railroad'],
  ])('detects %j as %s', (code, label) => {
    expect(detectLabels(config, fence(code))).toEqual([label]);
  });

  it('skips front matter, directives and comments', () => {
    const code =
      '---\ntitle: x\n---\n%%{init: {"theme": "dark"}}%%\n%% note\nsequenceDiagram\n  A->>B: hi';
    expect(detectLabels(config, fence(code))).toEqual(['Graph: Sequence']);
  });

  it('collects every diagram type in the issue and ignores other code', () => {
    const body = `${fence('pie\n  "a": 1')}\n${fence('gantt\n  title x')}\n${fence('const graph = 1;')}`;
    expect(detectLabels(config, body)).toEqual(['Graph: Pie', 'Graph: Gantt']);
  });

  it('handles Windows line endings', () => {
    const code = '---\r\ntitle: x\r\n---\r\nsequenceDiagram\r\n  A->>B: hi';
    expect(detectLabels(config, '```mermaid\r\n' + code + '\r\n```')).toEqual(['Graph: Sequence']);
  });

  it('accepts untagged fences and skips fences in another language', () => {
    expect(detectLabels(config, '```\ngantt\n  title x\n```')).toEqual(['Graph: Gantt']);
    expect(detectLabels(config, '```yaml\nblock: x\n```')).toEqual([]);
  });

  it('returns nothing without a recognised diagram', () => {
    expect(detectLabels(config, 'The graph looks wrong.')).toEqual([]);
    expect(detectLabels(config, null)).toEqual([]);
  });
});
