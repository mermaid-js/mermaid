import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IToken, TokenType } from 'chevrotain';
// @ts-ignore JISON doesn't support types
import flowJisonParser from './flow.jison';
import { FlowDB } from '../flowDb.js';
import { flowLexer } from './flow.lexer.js';

/**
 * Lexer-parity gate.
 *
 * The legacy jison lexer is the ORACLE. For each input we assert that the Chevrotain lexer emits the
 * *exact same token stream* (terminal name + image). Getting this green BEFORE writing the grammar is
 * high-payback: token-level divergences are far cheaper to debug here than as mysterious parser
 * errors later. (Same lesson learned migrating ANTLR / Tree-sitter grammars.)
 *
 * Known, intentional deviations (covered separately, not in the strict corpus here):
 * - `accTitle:` / `accDescr:` — jison emits two terminals incl. an empty-image value token; Chevrotain
 *   forbids empty-match tokens, so we capture a whole-line token and split in the visitor.
 * - `@{ ... }` shape data — jison emits an empty-image SHAPE_DATA opener; handled in the shapeData
 *   increment with tolerance.
 */

const terminals: Record<number, string> = flowJisonParser.parser.terminals_;

interface Tok {
  name: string;
  image: string;
}

/**
 * Collapse runs of consecutive SPACE tokens into one (concatenating images). The Chevrotain SPACE
 * token matches a whole whitespace RUN (`/[^\S\n\r]+/`, a perf fix), while jison emits one SPACE per
 * character — both are parse-equivalent since SPACE is only ever a separator. Normalising both streams
 * this way keeps the token-for-token parity assertion meaningful.
 */
function collapseSpaces(tokens: Tok[]): Tok[] {
  const out: Tok[] = [];
  for (const tok of tokens) {
    const prev = out[out.length - 1];
    if (tok.name === 'SPACE' && prev?.name === 'SPACE') {
      prev.image += tok.image;
    } else {
      out.push({ ...tok });
    }
  }
  return out;
}

function jisonTokens(input: string): Tok[] {
  const yy = new FlowDB();
  const lexer = flowJisonParser.lexer;
  lexer.setInput(input, yy);
  const out: Tok[] = [];
  for (let i = 0; i < 1000; i++) {
    const token = lexer.lex();
    if (token === 1 || token === undefined) {
      break;
    }
    const name = typeof token === 'number' ? terminals[token] : String(token);
    if (name === 'EOF') {
      break;
    }
    out.push({ name, image: lexer.yytext });
  }
  return collapseSpaces(out);
}

// Map a Chevrotain token to the jison terminal NAME it stands for (category name when categorized).
function grammarName(tokenType: TokenType): string {
  const cats = tokenType.CATEGORIES;
  if (cats && cats.length > 0) {
    return cats[0].name;
  }
  return tokenType.name;
}

function chevrotainTokens(input: string): Tok[] {
  const result = flowLexer.tokenize(input);
  if (result.errors.length > 0) {
    throw new Error(`lex error: ${result.errors[0].message}`);
  }
  return collapseSpaces(
    result.tokens.map((tok: IToken) => ({
      name: grammarName(tok.tokenType),
      image: tok.image,
    }))
  );
}

/** Structural corpus — every feature whose lexing should match jison byte-for-byte. */
const CORPUS: string[] = [
  // headers + directions
  'graph TD\nA-->B\n',
  'flowchart LR\n A --> B\n',
  'graph\n A --> B\n',
  'flowchart-elk TD\n A --> B\n',
  'swimlane-beta LR\n A --> B\n',
  // edges
  'graph TD\nA-->B\n',
  'graph TD\nA --> B\n',
  'graph TD\nx-->y\n',
  'graph TD\nA o--o B\n',
  'graph TD\nA <--> B\n',
  'graph TD\nA --- B\n',
  'graph TD\nA ==> B\n',
  'graph TD\nA === B\n',
  'graph TD\nA -.-> B\n',
  'graph TD\nA -. text .-> B\n',
  'graph TD\nA == text ==> B\n',
  'graph TD\nA -- text only --> B\n',
  'graph TD\nA --x B & C\n',
  'graph TD\nA --> B --> C\n',
  'graph TD\nA --->|label|B\n',
  'graph TD\nA -->|label| B\n',
  'graph TD\nA ~~~ B\n',
  // shapes
  'flowchart LR\n A[sq] --> B(round)\n',
  'flowchart LR\n A{diamond} --> B((circle))\n',
  'flowchart LR\n A[[sub]] --> B[(db)]\n',
  'flowchart LR\n A([stad]) --> B>odd]\n',
  'flowchart LR\n A[/trap/] --> B[\\inv\\]\n',
  'flowchart LR\n A[/lean\\] --> B[\\lean/]\n',
  'flowchart LR\n A(-ellipse-) --> B\n',
  'flowchart LR\n A{{hexagon}} --> B\n',
  // strings + markdown
  'graph TD\n A["string label"]\n',
  'graph TD\n A["`md **bold**`"]\n',
  'graph TD\n A-->|"quoted edge"|B\n',
  // ids / chaining / styling
  'graph TD\n A:::cls\n',
  'graph TD\n A & B --> C & D\n',
  'classDef foo fill:#f9f\n',
  'class A,B foo\n',
  'style A fill:#f9f,stroke:#333\n',
  'linkStyle 0 stroke:red\n',
  'linkStyle default interpolate basis stroke:red\n',
  // subgraph
  'subgraph one\n a --> b\n end\n',
  'flowchart TB\n subgraph one\n direction LR\n a --> b\n end\n',
  // interactions
  'click A "https://x.com" "tip"\n',
  'click A callback "tooltip"\n',
  'click A href "https://x.com" _blank\n',
  // numbers / misc
  'graph TD\n 1 --> 2\n',
  'graph TD;A-->B;\n',
];

describe('flowchart lexer parity (Chevrotain vs jison)', () => {
  it.each(CORPUS)('matches jison token stream for: %j', (input) => {
    const expected = jisonTokens(input);
    const actual = chevrotainTokens(input);
    expect(actual).toEqual(expected);
  });
});

/**
 * Harvested corpus — the actual `parse('...')` / `parse(`...`)` diagram strings used by every
 * co-located flowchart spec. This stresses the lexer against hundreds of real inputs for free and
 * keeps itself in sync as the specs evolve. Inputs exercising the two known deviations
 * (`accTitle`/`accDescr` whole-line, `@{ }` shape data) are skipped here and covered separately.
 */
function harvestSpecInputs(): string[] {
  const dir = dirname(fileURLToPath(import.meta.url));
  const files = readdirSync(dir).filter((f) => f.endsWith('.spec.js'));
  const found = new Set<string>();
  // Matches parse('…') and parse(`…`) with a single string-literal argument on one logical line.
  const re = /\.parse\(\s*(['`])((?:\\.|(?!\1)[\S\s])*?)\1\s*\)/g;
  for (const file of files) {
    const src = readFileSync(join(dir, file), 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const quote = m[1];
      let raw = m[2];
      // Decode JS escapes back to the literal string the spec actually parses.
      raw = raw
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\`/g, '`')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
      if (quote === '`' && raw.includes('${')) {
        continue; // template interpolation — can't reconstruct statically
      }
      // Skip the two documented lexer deviations + comment-cleanup inputs (handled elsewhere).
      if (/accTitle|accDescr|@{|%%/.test(raw)) {
        continue;
      }
      found.add(raw);
    }
  }
  return [...found];
}

const HARVESTED = harvestSpecInputs();

describe('flowchart lexer parity over harvested spec inputs', () => {
  it('harvested a substantial corpus', () => {
    expect(HARVESTED.length).toBeGreaterThan(100);
  });

  it.each(HARVESTED)('matches jison token stream for: %j', (input) => {
    let expected: Tok[];
    try {
      expected = jisonTokens(input);
    } catch {
      return; // jison lexer itself rejected this input — not a parity concern
    }
    const actual = chevrotainTokens(input);
    expect(actual).toEqual(expected);
  });
});
