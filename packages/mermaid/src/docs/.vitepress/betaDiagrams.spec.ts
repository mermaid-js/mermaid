import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { betaSyntaxPages, optionalBetaKeywordPages } from './betaDiagrams.js';
import { getDiagramType } from './theme/exampleConfig.js';

const syntaxDir = [
  resolve(process.cwd(), 'packages/mermaid/src/docs/syntax'),
  resolve(process.cwd(), 'src/docs/syntax'),
].find((candidate) => existsSync(candidate))!;

const firstDiagramType = (page: string) => {
  const markdown = readFileSync(join(syntaxDir, `${page}.md`), 'utf8');
  const code = /```(?:mermaid-example|mermaid|mermaid-nocode)\n([\S\s]*?)```/.exec(markdown)?.[1];
  return code === undefined ? undefined : getDiagramType(code);
};

const pages = readdirSync(syntaxDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace(/\.md$/, ''));

describe('betaSyntaxPages', () => {
  it.each(pages)('marks %s as beta only if its keyword ends in -beta', (page) => {
    const usesBetaKeyword = firstDiagramType(page)?.endsWith('-beta') ?? false;
    expect(betaSyntaxPages.has(page)).toBe(usesBetaKeyword && !optionalBetaKeywordPages.has(page));
  });
});

const betaNotice = /^```warning\n.+ (?:is|are) in beta\. .+\n```$/m;
const stabilityClaim = /experimental diagram|new diagram type|(?:is|are) in \**beta\**/i;

describe('beta notices', () => {
  it.each(pages)('shows the beta notice on %s only if it is beta', (page) => {
    const markdown = readFileSync(join(syntaxDir, `${page}.md`), 'utf8');
    if (betaSyntaxPages.has(page)) {
      expect(markdown).toMatch(betaNotice);
    } else {
      expect(markdown).not.toMatch(stabilityClaim);
    }
  });
});
