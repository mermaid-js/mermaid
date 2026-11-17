#!/usr/bin/env node
/**
 * Keeps issue labels for diagram types in step with the diagrams in the codebase.
 * `.github/triage-labels.json` is the single list: one entry per folder under
 * packages/mermaid/src/diagrams, giving its label and the keywords that start a diagram.
 *
 * CLI usage:
 *   node scripts/triage-labels.mjs check          Fail if a diagram folder has no entry, or an entry has no folder
 *   node scripts/triage-labels.mjs sync           Create any label that is missing on the repository
 *   node scripts/triage-labels.mjs label <issue>  Label an issue from the mermaid code it contains
 *
 * `sync` and `label` call the gh CLI and need GH_TOKEN and REPO (owner/name).
 */
/* eslint-disable no-console -- command-line script */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DIAGRAMS_DIR = join(root, 'packages/mermaid/src/diagrams');
export const QUEUE_LABEL = 'Triage: Needs AI';
const LABEL_COLOUR = 'b7eeff'; // cspell:disable-line

export const loadConfig = () =>
  JSON.parse(readFileSync(join(root, '.github/triage-labels.json'), 'utf8'));

/** Diagram folders with no entry, and entries with no folder. */
export function findMismatches(config, folders) {
  const known = new Set([...Object.keys(config.diagrams), ...config.ignore]);
  return {
    unlabelled: folders.filter((f) => !known.has(f)),
    stale: Object.keys(config.diagrams).filter((d) => !folders.includes(d)),
  };
}

const escapeRegExp = (text) => text.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');

/** First line of a diagram once front matter, directives and comments are removed. */
function firstStatement(code) {
  const body = code.replace(/^\s*---\n[\S\s]*?\n---\s*\n/, '').replace(/%%{[\S\s]*?}%%/g, '');
  return body.split('\n').find((line) => line.trim() && !line.trim().startsWith('%%')) ?? '';
}

/** Fences tagged with another language (yaml, js, ...) are not diagrams. */
const DIAGRAM_FENCE_LANGUAGES = new Set(['', 'mermaid', 'mmd']);

/** Labels for every diagram type found in the fenced code blocks of `text`. */
export function detectLabels(config, text) {
  // Mermaid normalises line endings before reading front matter, so do the same.
  const normalised = (text ?? '').replace(/\r\n?/g, '\n');
  const blocks = [...normalised.matchAll(/```([^\n]*)\n([\S\s]*?)```/g)]
    .filter((m) => DIAGRAM_FENCE_LANGUAGES.has(m[1].trim().toLowerCase()))
    .map((m) => m[2]);
  const labels = new Set();
  for (const block of blocks) {
    const line = firstStatement(block);
    for (const { label, keywords } of Object.values(config.diagrams)) {
      // A keyword may carry a version suffix (block-beta, stateDiagram-v2) but must end there.
      if (
        keywords.some((k) => new RegExp(`^\\s*${escapeRegExp(k)}(-beta|-v2)?(?![\\w-])`).test(line))
      ) {
        labels.add(label);
      }
    }
  }
  return [...labels];
}

const gh = (args, input) => execFileSync('gh', ['api', ...args], { encoding: 'utf8', input });

function check() {
  const folders = readdirSync(DIAGRAMS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const { unlabelled, stale } = findMismatches(loadConfig(), folders);
  for (const folder of unlabelled) {
    console.error(`No issue label for diagram "${folder}". Add it to .github/triage-labels.json.`);
  }
  for (const entry of stale) {
    console.error(
      `"${entry}" in .github/triage-labels.json has no folder under packages/mermaid/src/diagrams.`
    );
  }
  process.exit(unlabelled.length + stale.length > 0 ? 1 : 0);
}

function sync() {
  const repo = process.env.REPO;
  const existing = new Set(
    JSON.parse(gh([`repos/${repo}/labels`, '--paginate', '--slurp']))
      .flat()
      .map((l) => l.name)
  );
  for (const { label } of Object.values(loadConfig().diagrams)) {
    if (!existing.has(label)) {
      gh([
        '-X',
        'POST',
        `repos/${repo}/labels`,
        '-f',
        `name=${label}`,
        '-f',
        `color=${LABEL_COLOUR}`,
      ]);
      console.log(`created: ${label}`);
    }
  }
}

function label(issue) {
  const repo = process.env.REPO;
  const { body } = JSON.parse(gh([`repos/${repo}/issues/${issue}`]));
  // Everything else about the issue is left to the triage skill, so it is always queued.
  const labels = [...detectLabels(loadConfig(), body), QUEUE_LABEL];
  gh(
    ['-X', 'POST', `repos/${repo}/issues/${issue}/labels`, '--input', '-'],
    JSON.stringify({ labels })
  );
  console.log(labels.join('\n'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, argument] = process.argv.slice(2);
  if (command === 'check') {
    check();
  } else if (command === 'sync') {
    sync();
  } else if (command === 'label' && /^\d+$/.test(argument ?? '')) {
    label(argument);
  } else {
    console.error('Usage: triage-labels.mjs check | sync | label <issue number>');
    process.exit(1);
  }
}
