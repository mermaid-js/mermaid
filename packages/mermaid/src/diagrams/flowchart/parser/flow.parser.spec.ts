import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-ignore JISON doesn't support types
import flowJisonParser from './flow.jison';
import { FlowDB } from '../flowDb.js';
import { flowLexer } from './flow.lexer.js';
import { flowParser } from './flow.parser.js';

/**
 * Parser-acceptance gate.
 *
 * The grammar must accept *everything jison accepts*. For each harvested diagram string we parse with
 * jison (does it throw?) and with Chevrotain; if jison accepts, Chevrotain must too (no parser errors).
 * This validates the grammar shape broadly before the visitor exists — the db-level oracle (the 965
 * specs) comes once the visitor fills `FlowDB`.
 *
 * `@{ }` shape data and `%%` comment inputs are skipped here (shapeData grammar lands in its own
 * increment; comments are stripped before the parser in production).
 */

function jisonAccepts(input: string): boolean {
  try {
    const p = flowJisonParser.parser ?? flowJisonParser;
    p.yy = new FlowDB();
    p.yy.clear?.();
    // jison's flowParser.ts wrapper applies this normalization before parsing.
    p.parse(input.replace(/}\s*\n/g, '}\n'));
    return true;
  } catch {
    return false;
  }
}

function chevrotainErrors(input: string): string[] {
  const lex = flowLexer.tokenize(input);
  if (lex.errors.length > 0) {
    return [`lex: ${lex.errors[0].message}`];
  }
  flowParser.input = lex.tokens;
  // @ts-expect-error generated rule method
  flowParser.start();
  return flowParser.errors.map((e) => e.message);
}

function harvest(): string[] {
  const dir = dirname(fileURLToPath(import.meta.url));
  const found = new Set<string>();
  const re = /\.parse\(\s*(['`])((?:\\.|(?!\1)[\S\s])*?)\1\s*\)/g;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.spec.js'))) {
    const src = readFileSync(join(dir, file), 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const quote = m[1];
      const raw = m[2]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\`/g, '`')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
      if (quote === '`' && raw.includes('${')) {
        continue;
      }
      if (raw.includes('%%')) {
        continue;
      }
      found.add(raw);
    }
  }
  return [...found];
}

const HARVESTED = harvest().filter(jisonAccepts);

describe('flowchart parser acceptance (accepts everything jison accepts)', () => {
  it('has a substantial jison-accepted corpus', () => {
    expect(HARVESTED.length).toBeGreaterThan(80);
  });

  it.each(HARVESTED)('accepts: %j', (input) => {
    expect(chevrotainErrors(input)).toEqual([]);
  });
});
