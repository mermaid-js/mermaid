import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-ignore JISON doesn't support types
import flowJisonParser from './flow.jison';
import { FlowDB } from '../flowDb.js';
import { preprocessDiagram } from '../../../preprocess.js';
import { encodeEntities } from '../../../utils.js';
import { parseFlowchartChevrotain } from './flow.chevrotain.js';

/**
 * Large-corpus parse validation for the flowchart parser.
 *
 * Point it at a folder of `.mmd` files and it parses every one with BOTH engines, then logs the files
 * that **fail under Chevrotain while succeeding under the legacy (jison) parser** — i.e. real
 * regressions. Other outcomes (both succeed, both fail, chevrotain-only success) are summarised but not
 * treated as regressions.
 *
 * Usage:
 *   PARSE_FIXTURE_PATH=/path/to/mmd/folder pnpm vitest run flow.parse-corpus.spec.ts
 *
 * The spec is skipped when `PARSE_FIXTURE_PATH` is unset, so it never runs in the normal suite. Files
 * are preprocessed exactly like `mermaid.parse` (frontmatter + directives + comments stripped, entities
 * encoded) so arbitrary real-world diagrams are handled.
 */

const FIXTURE_PATH = process.env.PARSE_FIXTURE_PATH;

function findMmdFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findMmdFiles(full));
    } else if (entry.name.endsWith('.mmd')) {
      out.push(full);
    }
  }
  return out;
}

/** Preprocess a raw diagram exactly like the production parse path does. */
function preprocess(raw: string): string {
  return encodeEntities(preprocessDiagram(raw).code) + '\n';
}

type ParseFn = (text: string) => void;

const parseLegacy: ParseFn = (text) => {
  flowJisonParser.parser.yy = new FlowDB();
  flowJisonParser.parser.yy.clear();
  flowJisonParser.parser.parse(text.replace(/}\s*\n/g, '}\n'));
};

const parseChevrotain: ParseFn = (text) => {
  parseFlowchartChevrotain(text.replace(/}\s*\n/g, '}\n'), new FlowDB());
};

function tryParse(parse: ParseFn, text: string): { ok: boolean; error?: string } {
  try {
    parse(text);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

describe.skipIf(!FIXTURE_PATH)('flowchart parse corpus (Chevrotain vs legacy)', () => {
  it('parses everything the legacy parser parses', () => {
    const files = findMmdFiles(FIXTURE_PATH!);
    const regressions: { file: string; error: string }[] = [];
    const improvements: string[] = []; // chevrotain OK, legacy FAIL
    const preprocessErrors: { file: string; error: string }[] = [];
    let bothOk = 0;
    let bothFail = 0;

    for (const file of files) {
      let text: string;
      try {
        text = preprocess(readFileSync(file, 'utf8'));
      } catch (error) {
        preprocessErrors.push({ file, error: (error as Error).message });
        continue;
      }
      const legacy = tryParse(parseLegacy, text);
      const chevrotain = tryParse(parseChevrotain, text);

      if (legacy.ok && chevrotain.ok) {
        bothOk++;
      } else if (legacy.ok && !chevrotain.ok) {
        regressions.push({ file, error: chevrotain.error ?? '' });
      } else if (!legacy.ok && chevrotain.ok) {
        improvements.push(file);
      } else {
        bothFail++;
      }
    }

    const lines = [
      '',
      `=== Flowchart parse corpus: ${FIXTURE_PATH} ===`,
      `  .mmd files scanned:                        ${files.length}`,
      `  both engines OK:                           ${bothOk}`,
      `  both engines FAIL (invalid / non-flow):    ${bothFail}`,
      `  chevrotain-only OK (legacy FAIL):          ${improvements.length}`,
      `  preprocess errors (skipped):               ${preprocessErrors.length}`,
      `  >> REGRESSIONS (legacy OK, chevrotain FAIL): ${regressions.length}`,
    ];
    for (const r of regressions) {
      lines.push('', `  ✗ ${r.file}`, `      ${r.error}`);
    }
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));

    expect(regressions.map((r) => r.file)).toEqual([]);
  }, 600_000);
});
