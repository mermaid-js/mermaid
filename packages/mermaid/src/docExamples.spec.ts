import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import mermaid from './mermaid.js';

/**
 * Every diagram in the docs is rendered on the docs site. A diagram that does not parse renders
 * the "Syntax error in text" diagram instead, and when it is rendered without a container that
 * error diagram is left at the end of the page (issue #6630).
 */

const docsDir = join(__dirname, 'docs');
const diagramBlock = /^```(mermaid|mermaid-example|mermaid-nocode)[^\S\n]*\n([\S\s]*?)^```/gm;

const findMarkdownFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      return [];
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return findMarkdownFiles(path);
    }
    return entry.name.endsWith('.md') ? [path] : [];
  });

const examples = findMarkdownFiles(docsDir).flatMap((file) => {
  const markdown = readFileSync(file, 'utf8');
  return [...markdown.matchAll(diagramBlock)].map((match) => ({
    name: `${relative(docsDir, file)}:${markdown.slice(0, match.index).split('\n').length}`,
    code: match[2],
  }));
});

// ZenUML is an external diagram that is only registered on the docs site.
const isZenUML = (code: string) => /^\s*zenuml\b/m.test(code.replace(/^---[\S\s]*?---/, ''));

describe('diagrams in the docs', () => {
  it('finds the examples', () => {
    expect(examples.length).toBeGreaterThan(100);
  });

  it.each(examples.filter(({ code }) => !isZenUML(code)))('$name parses', async ({ code }) => {
    await expect(mermaid.parse(code)).resolves.toBeTruthy();
  });
});
