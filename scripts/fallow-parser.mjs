#!/usr/bin/env node
/* eslint-disable no-console -- this is a CLI script; console output is its purpose */
// cspell:ignore fallowrc
/**
 * Scoped fallow dead-code check for migrated Chevrotain parser dirs.
 *
 * The repo's `.fallowrc.json` is intentionally minimal (rules off; `diagrams/**`, `common/**`,
 * `schemas/**` ignored), so a plain `fallow` run never sees the new parser code. This script
 * temporarily scopes `.fallowrc.json` to the parser chain (real diagram entry points reach the
 * parser files), runs `fallow dead-code`, filters findings to the new parser dirs, then restores
 * the config — so checking a migrated diagram is one command instead of a manual dance.
 *
 * Usage:
 *   node scripts/fallow-parser.mjs            # all diagrams that have a parser/ dir
 *   node scripts/fallow-parser.mjs pie sankey # specific diagrams
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RC = '.fallowrc.json';
const DIAGRAMS = 'packages/mermaid/src/diagrams';

const requested = process.argv.slice(2);
const withParser = readdirSync(DIAGRAMS, { withFileTypes: true })
  .filter(
    (d) => d.isDirectory() && d.name !== 'common' && existsSync(join(DIAGRAMS, d.name, 'parser'))
  )
  .map((d) => d.name);
const targets = requested.length > 0 ? requested : withParser;

if (targets.length === 0) {
  console.log('No migrated parser dirs found.');
  process.exit(0);
}

// Roots that reach the parser files: the diagram definition + the diagram's spec files.
const entry = [];
for (const id of targets) {
  const dir = join(DIAGRAMS, id);
  for (const file of readdirSync(dir)) {
    if (/(Diagram|\.spec)\.(ts|js)$/.test(file)) {
      entry.push(join(dir, file));
    }
  }
  const parserDir = join(dir, 'parser');
  if (existsSync(parserDir)) {
    for (const file of readdirSync(parserDir)) {
      if (/\.spec\.(ts|js)$/.test(file)) {
        entry.push(join(parserDir, file));
      }
    }
  }
}

const original = readFileSync(RC, 'utf8');
const cfg = JSON.parse(original);
const stillIgnored = (p) =>
  !targets.some((id) => p === `${DIAGRAMS}/${id}/**`) && p !== `${DIAGRAMS}/common/**`;
cfg.entry = entry;
cfg.ignorePatterns = (cfg.ignorePatterns ?? []).filter(stillIgnored);

const newFileRe = new RegExp(`diagrams/(?:${targets.join('|')}|common)/parser/`);

let exitCode = 0;
try {
  writeFileSync(RC, JSON.stringify(cfg, null, 2));

  let raw = '';
  try {
    raw = execSync('npx fallow dead-code --format json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (error) {
    raw = error.stdout?.toString() ?? ''; // fallow exits non-zero when it reports issues
  }

  const data = JSON.parse(raw);
  const seen = new Set();
  const hits = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (Object.values(node).some((v) => typeof v === 'string' && newFileRe.test(v))) {
      const key = JSON.stringify(node);
      if (!seen.has(key)) {
        seen.add(key);
        hits.push(node);
      }
    }
    Object.values(node).forEach(walk);
  };
  walk(data);

  console.log(`fallow dead-code — parser dirs (${targets.join(', ')}): ${hits.length} finding(s)`);
  for (const hit of hits) {
    console.log('  -', JSON.stringify(hit));
  }
  exitCode = hits.length > 0 ? 1 : 0;
} finally {
  writeFileSync(RC, original); // always restore
}

process.exit(exitCode);
