import { describe, expect } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import markdown from '../../docs/syntax/timing.md?raw';
import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';

addDiagrams();

const examples = [...markdown.matchAll(/^```mermaid-example[^\n]*\r?\n([\S\s]*?)\r?\n```$/gm)].map(
  ([, source]) => source
);

describe('timing documentation examples', () => {
  jsdomIt(
    'renders every example, including frontmatter and accessibility metadata',
    async () => {
      expect(examples.length).toBeGreaterThan(0);
      for (const [index, source] of examples.entries()) {
        mermaidAPI.initialize({});
        const { svg } = await mermaidAPI.render(`timing-doc-${index}`, source);
        expect(svg, `example ${index + 1}`).toContain('timing-root');
        expect(svg, `example ${index + 1}`).not.toMatch(/NaN|Infinity/);
      }
    },
    60_000
  );
});
