// cspell:ignore knsv Sveidqvist kanbanesque
/**
 * The shared kanban parser fixtures.
 *
 * Test-only. Combines hand-picked edge cases with every kanban snippet already committed to the
 * repo — the diagram's own spec file, `samples.md`, and the published docs — so the suites built
 * on it re-sync themselves whenever any of those grow.
 *
 * It was assembled to diff this parser against the jison grammar it replaced, input by input, and
 * outlives that grammar as the snapshot suite in `kanban.fixtures.spec.ts`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export interface KanbanFixture {
  name: string;
  text: string;
}

/**
 * Hand-picked inputs. These deliberately include shapes, delimiters and malformed lines that the
 * committed examples never exercise — the committed examples alone are not a sufficient oracle.
 */
const CURATED: KanbanFixture[] = [
  ['bare-keyword', 'kanban'],
  ['keyword-newline', 'kanban\n'],
  ['simple', 'kanban\n    root'],
  ['same-line', 'kanban root'],
  ['keyword-cased', 'KanBan\n  root'],
  ['id-prefixed-keyword', 'kanban\n  kanbanesque'],
  ['id-is-keyword', 'kanban\n  kanban'],
  ['hierarchy', 'kanban\n    root\n      child1\n      child2\n '],
  ['deep-hierarchy', 'kanban\n  root\n    child1\n      leaf1\n    child2'],
  ['no-id-shape', 'kanban\n    (root)'],
  ['rect', 'kanban\n    root[The root]\n      '],
  ['circle', 'kanban\n  a((circle))'],
  ['hexagon', 'kanban\n  b{{hex}}'],
  ['cloud-open', 'kanban\n  c(-cloud-)'],
  ['bang', 'kanban\n  d))bang(('],
  ['rounded', 'kanban\n  e(rounded)'],
  ['cloud-close', 'kanban\n  f)cloud('],
  ['icon', 'kanban\n    root[The root]\n    ::icon(bomb)\n    '],
  ['icon-upper', 'kanban\n  root\n  ::ICON(bomb)'],
  ['class', 'kanban\n    root[The root]\n    :::m-4 p-8\n    '],
  ['class-empty', 'kanban\n  root\n  :::\n  child'],
  [
    'class-then-child',
    'kanban\n  root(Root)\n    Child(Child)\n    :::hot\n      a(a)\n      b[New Stuff]',
  ],
  ['quoted-descr', 'kanban\n    root["String containing []"]\n'],
  ['quoted-descr-parens', 'kanban\n  root["String containing ()"]\n'],
  ['markdown-descr', 'kanban\n  root["`bold **text**`"]\n'],
  ['markdown-descr-no-id', 'kanban\n  ["`**Create** Documentation`"]\n'],
  ['markdown-descr-delimiters', 'kanban\n  docs["`a [b] (c) d`"]\n'],
  ['markdown-descr-multiline', 'kanban\n  docs["`line one\n  line two`"]\n'],
  ['markdown-descr-empty', 'kanban\n  docs["``"]\n'],
  ['markdown-descr-rounded', 'kanban\n  docs("`**x**`")\n'],
  ['descr-after-string', 'kanban\n  a["x" y]\n'],
  ['comment-own-line', 'kanban\n  root(Root)\n\n      %% This is a comment\n      b[New Stuff]'],
  ['comment-end-of-line', 'kanban\n  root(Root)\n      a(a) %% This is a comment\n      b[x]'],
  ['comment-after-bare-id', 'kanban\n  root %% swallowed by the id\n'],
  ['whitespace-only-rows', 'kanban\nroot\n A\n \n\n B'],
  ['leading-blank-rows', '\n \nkanban\nroot\n A\n \n\n B'],
  ['leading-newlines', '\n\n\nkanban\nroot\n A\n \n\n B'],
  ['single-leading-newline', '\nkanban\nroot\n A'],
  ['blank-lines-after-keyword', 'kanban\n\n\n  root'],
  ['trailing-blank-lines', 'kanban\n  root\n\n\n'],
  ['metadata-inline', 'kanban\n        root@{ priority: high }\n    '],
  [
    'metadata-multiline',
    'kanban\n        root@{\n          icon: star\n          assigned: knsv\n        }\n    ',
  ],
  ['metadata-two-keys', 'kanban\n        root@{ icon: star, assigned: knsv }\n    '],
  ['metadata-single-quoted', "kanban\n        root@{ icon: star, label: 'fix things' }\n    "],
  ['metadata-double-quoted', 'kanban\n  id2@{\n    descr: "Lorem ipsum,\n      dolor sit"\n  }\n'],
  ['metadata-ticket', 'kanban\n        root@{ ticket: MC-1234 }\n    '],
  ['metadata-after-shape', "kanban\n  id8[Design grammar]@{ assigned: 'knsv' }\n"],
  ['metadata-empty', 'kanban\n  root@{}\n'],
  ['style-statement', 'kanban\n  id1[Todo]\n\n  style n2 stroke:#AA00FF,fill:#E1BEE7\n'],
  ['apostrophe-in-descr', "kanban\n  id12[Can't reproduce]\n"],
  ['items-without-section', 'kanban\n          root\n        fakeRoot\n    realRootWrongPlace'],
  // Inputs that run out with a lexer mode still open. The legacy `<<EOF>>` rule only exists in
  // the INITIAL state, so every one of these is a parse error there.
  ['unclosed-shape', 'kanban\n  root[unclosed\n'],
  ['unclosed-metadata', 'kanban\n  root@{ icon: star\n'],
  ['unclosed-metadata-string', 'kanban\n  root@{ label: "unclosed\n'],
  ['unclosed-string', 'kanban\n  root["unclosed\n'],
  ['unclosed-markdown-string', 'kanban\n  root["`unclosed\n'],
  ['unclosed-icon', 'kanban\n  root\n  ::icon(bomb'],
  ['class-marker-at-eof', 'kanban\n  root\n  :::'],
  ['closed-string-open-shape', 'kanban\n  root["done"\n'],
  ['brace-in-description', 'kanban\n  root[a}b]\n'],
  ['tabs-for-indent', 'kanban\n\troot\n\t\tchild'],
].map(([name, text]) => ({ name, text }));

/** Pulls every fenced mermaid block out of a markdown file. */
function fencedKanbanBlocks(markdown: string, label: string): KanbanFixture[] {
  const blocks: KanbanFixture[] = [];
  const fence = /```mermaid(?:-example)?\n([\S\s]*?)```/g;
  let match;
  let index = 0;
  while ((match = fence.exec(markdown)) !== null) {
    const body = match[1];
    // Frontmatter and directives are stripped before the parser ever sees them.
    const text = body.replace(/^---\n[\S\s]*?\n---\n/, '');
    if (/^\s*kanban/.test(text)) {
      blocks.push({ name: `${label}-${index++}`, text });
    }
  }
  return blocks;
}

/** Pulls every diagram string literal out of the diagram's own spec file. */
function specLiterals(source: string): KanbanFixture[] {
  const entries: KanbanFixture[] = [];
  let index = 0;
  for (const match of source.matchAll(/`((?:[^\\`]|\\.)*)`/g)) {
    const text = match[1].replace(/\\([$\\`nrt])/g, (_, c: string) =>
      c === 'n' ? '\n' : c === 'r' ? '\r' : c === 't' ? '\t' : c
    );
    if (/^\s*kanban/.test(text)) {
      entries.push({ name: `spec-tpl-${index++}`, text });
    }
  }
  for (const match of source.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    const text = match[1].replace(/\\(['\\nrt])/g, (_, c: string) =>
      c === 'n' ? '\n' : c === 'r' ? '\r' : c === 't' ? '\t' : c
    );
    if (/^\s*kanban/.test(text)) {
      entries.push({ name: `spec-str-${index++}`, text });
    }
  }
  return entries;
}

function read(relative: string): string {
  return readFileSync(resolve(here, relative), 'utf8');
}

/** The `.mmd` fixtures the e2e rendering suite snapshots. */
function e2eFixtures(): KanbanFixture[] {
  const directory = resolve(here, '../../../../../../e2e/diagrams/kanban');
  return readdirSync(directory)
    .filter((file) => file.endsWith('.mmd'))
    .sort()
    .map((file) => ({
      name: `e2e-${file.replace(/\.mmd$/, '')}`,
      text: readFileSync(resolve(directory, file), 'utf8'),
    }));
}

export const kanbanFixtures: KanbanFixture[] = [
  ...CURATED,
  ...specLiterals(read('../kanban.spec.ts')),
  ...fencedKanbanBlocks(read('../samples.md'), 'samples'),
  ...fencedKanbanBlocks(read('../../../docs/syntax/kanban.md'), 'docs'),
  ...e2eFixtures(),
];
