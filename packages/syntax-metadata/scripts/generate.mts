/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generates @mermaid-js/syntax-metadata from mermaid's own grammars.
 *
 * Jison diagrams: compiles the .jison files, introspects the generated lexers (`rules`,
 * `conditions`, `performAction`) and `symbols_` to recover the real tokens (text, token name,
 * lexer contexts). Combinatoric rules (e.g. `\s*[xo<]?--+[-xo>]\s*`) are enumerated and only
 * candidates the real lexer accepts are kept.
 *
 * Langium diagrams: reads the `.langium` grammars and cross-checks the generated `Grammar`
 * reflection from @mermaid-js/parser.
 *
 * Writes one module per diagram plus an aggregate into ../src/generated.
 *
 * Usage: pnpm --filter @mermaid-js/syntax-metadata build
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// @ts-expect-error jison has no typings
import jison from 'jison';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const JISON_DIR = path.join(ROOT, 'packages/mermaid/src/diagrams');
const LANGIUM_DIR = path.join(ROOT, 'packages/parser/src/language');
const PARSER_DIST = path.join(ROOT, 'packages/parser/dist/mermaid-parser.core.mjs');
const GENERATED_DIR = path.resolve(import.meta.dirname, '../src/generated');

type Engine = 'jison' | 'langium';
type TokenKind = 'keyword' | 'operator' | 'punctuation';

interface TokenSpec {
  text: string;
  token: string;
  kind: TokenKind;
  contexts: string[];
  caseInsensitive?: boolean;
}

interface DiagramSyntax {
  engine: Engine;
  grammarId: string;
  source: string;
  tokens: TokenSpec[];
}

const walkFiles = async (dir: string, accept: (name: string) => boolean): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full, accept)));
    } else if (accept(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

// ---------------------------------------------------------------------------
// Jison: compile + introspect the generated lexer
// ---------------------------------------------------------------------------

const makeStub = (): any => {
  // A callable proxy: any method call, property read or write is absorbed, so
  // lexer actions can run without a real lexer behind them.
  const stub: any = new Proxy(() => stub, {
    apply: () => stub,
    get: (_target, prop) => {
      if (prop === Symbol.toPrimitive) {
        return () => 0;
      }
      if (prop === 'toString') {
        return () => '';
      }
      return stub;
    },
    set: () => true,
  });
  return stub;
};

/** Unescape a regex body only if it is a plain literal (no classes/quantifiers). */
const fullLiteral = (body: string): string | undefined => {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '\\') {
      const next = body[++i];
      if (next === undefined || /[BDSWbdnstw]/.test(next)) {
        return undefined;
      }
      out += next;
    } else {
      if (/[$()*+.?[\]^{|}]/.test(char)) {
        return undefined;
      }
      out += char;
    }
  }
  return out.length > 0 ? out : undefined;
};

/** Literal prefix of a rule like `title\s[^#\n;]+` -> `title`. */
const leadingLiteral = (body: string): string | undefined => {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '\\') {
      const next = body[++i];
      if (next === undefined || /[BDSWbdnstw]/.test(next)) {
        break;
      }
      out += next;
    } else if (/[\w -]/.test(char)) {
      out += char;
    } else {
      break;
    }
  }
  const text = out.trim();
  return /^[A-Za-z][\w -]*$/.test(text) ? text : undefined;
};

/** Fold single-character classes (`[x]`, `[\)]`) into literals, leaving class escapes alone. */
const foldClasses = (pattern: string): string =>
  pattern.replaceAll(/\[(\\)?([^\]^])]/g, (match, escaped: string | undefined, char: string) =>
    escaped && /[BDSWbdnstw]/.test(char)
      ? match
      : /[$()*+.?[\\\]^{|}]/.test(char)
        ? `\\${char}`
        : char
  );

const literalFromPattern = (pattern: string): string | undefined => {
  const folded = foldClasses(pattern).replace(/^\^/, '');
  const body = /^\(\?:([\S\s]*)\)$/.exec(folded)?.[1] ?? folded;
  // Rules often allow leading whitespace (`\s*TB`) or any prefix (`.*direction TB`).
  const stripped = body.replace(/^\\s[*+?]?/, '').replace(/^\.\*\s*/, '');
  const word = /^([A-Za-z][\w -]*?)(?:\\b)?$/.exec(stripped);
  return word ? word[1] : (fullLiteral(stripped) ?? leadingLiteral(stripped));
};

const literalFromRegex = (regex: RegExp): string | undefined =>
  literalFromPattern(regex.source.replace(/^\^/, ''));

const kindOf = (text: string, token: string): TokenKind => {
  if (/arrow|link|transition|cross|point|edge|open|solid|dotted|stick/i.test(token)) {
    return 'operator';
  }
  if (/^[A-Z_a-z]/.test(text)) {
    return 'keyword';
  }
  return /[*+/<=>^|~-]/.test(text) ? 'operator' : 'punctuation';
};

const SKIP_TOKEN = /space|whitespace|newline|comment|eof|invalid|unicode_text/i;

interface JisonIntrospection {
  diagram: DiagramSyntax;
  probeErrors: number;
  parser: any;
  namesById: Map<number, string>;
  conflicts: number;
}

/**
 * Expand a bounded regex into candidate strings, or undefined when it uses constructs we
 * cannot enumerate (`.*`, negated/class escapes, unbounded alternations). Candidates are
 * validated against the real lexer before they are kept.
 */
const expandPattern = (pattern: string, limit = 64): string[] | undefined => {
  const unique = (values: string[]) => [...new Set(values)];
  let results = [''];
  let index = 0;
  while (index < pattern.length) {
    let atom: string[] | undefined;
    const char = pattern[index];
    if (char === '(') {
      let depth = 1;
      let end = index + 1;
      while (end < pattern.length && depth > 0) {
        if (pattern[end] === '(') {
          depth++;
        } else if (pattern[end] === ')') {
          depth--;
        }
        if (depth === 0) {
          break;
        }
        end++;
      }
      if (depth !== 0) {
        return undefined;
      }
      let body = pattern.slice(index + 1, end);
      if (body.startsWith('?:')) {
        body = body.slice(2);
      } else if (body.startsWith('?')) {
        return undefined;
      }
      atom = [];
      for (const alternative of body.split('|')) {
        const expanded = expandPattern(alternative, limit);
        if (!expanded) {
          return undefined;
        }
        atom.push(...expanded);
        if (atom.length > limit) {
          return undefined;
        }
      }
      index = end + 1;
    } else if (char === '[') {
      const end = pattern.indexOf(']', index + 1);
      if (end === -1) {
        return undefined;
      }
      const charClass = pattern.slice(index + 1, end);
      if (charClass.startsWith('^') || charClass.includes('\\') || charClass.length > 4) {
        return undefined;
      }
      atom = [...charClass];
      index = end + 1;
    } else if (char === '\\') {
      const next = pattern[index + 1];
      if (next === undefined) {
        return undefined;
      }
      if (next === 's') {
        atom = [''];
      } else if (/[BDSWbdntw]/.test(next)) {
        return undefined;
      } else {
        atom = [next];
      }
      index += 2;
    } else if (char === '.') {
      return undefined;
    } else {
      atom = [char];
      index += 1;
    }
    const quantifier = pattern[index];
    if (quantifier === '?' || quantifier === '*') {
      atom = ['', ...atom];
      index++;
    } else if (quantifier === '+') {
      // Exactly one repetition: enough for canonical forms (`-->`, `==>`, `~~~`) without
      // exploding into every `----`/`====` variant the lexer would also accept.
      index++;
    }
    atom = unique(atom);
    const next: string[] = [];
    for (const prefix of results) {
      for (const value of atom) {
        next.push(prefix + value);
      }
    }
    results = unique(next);
    if (results.length > limit) {
      return undefined;
    }
  }
  return results;
};

/** Lex `text` with the real lexer and return the token name, if the whole text matches. */
const lexerTokenFor = (
  lexer: any,
  namesById: Map<number, string>,
  text: string
): string | undefined => {
  try {
    lexer.setInput(text, {});
    const token = lexer.lex();
    if (typeof token !== 'number' || lexer.yytext?.trim() !== text) {
      return undefined;
    }
    return namesById.get(token);
  } catch {
    return undefined;
  }
};

const introspectJison = async (file: string): Promise<JisonIntrospection> => {
  const source = await readFile(file, 'utf8');
  const generator = new jison.Generator(source, { moduleType: 'amd' });
  const parser = generator.createParser();
  const lexer = parser.lexer;
  const namesById = new Map<number, string>(
    Object.entries(parser.symbols_ ?? {}).map(([name, id]) => [id as number, name])
  );

  const byKey = new Map<string, TokenSpec>();
  let probeErrors = 0;
  const conditions: Record<string, { rules: number[] }> = lexer.conditions ?? {};

  const add = (text: string, token: string, regex: RegExp, state: string) => {
    const key = `${token}\u0000${text}`;
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.contexts.includes(state)) {
        existing.contexts.push(state);
      }
      return;
    }
    byKey.set(key, {
      caseInsensitive: regex.flags.includes('i') || undefined,
      contexts: [state],
      kind: kindOf(text, token),
      text,
      token,
    });
  };

  for (const [state, condition] of Object.entries(conditions)) {
    for (const ruleIndex of condition.rules) {
      const regex: RegExp | undefined = lexer.rules?.[ruleIndex];
      if (!regex) {
        continue;
      }
      let token: string | undefined;
      try {
        const stub = makeStub();
        const result = lexer.performAction.call(stub, stub, stub, ruleIndex, state);
        if (typeof result === 'number') {
          token = namesById.get(result);
        } else if (typeof result === 'string') {
          token = result;
        }
      } catch {
        probeErrors++;
      }
      const literal = literalFromRegex(regex);
      // Rules that only switch lexer state (e.g. `"click"[\s]+`) still describe a keyword.
      if (!token && literal && /^[A-Za-z][\w -]*$/.test(literal)) {
        token = literal;
      }
      if (!token || SKIP_TOKEN.test(token)) {
        continue;
      }
      if (literal) {
        add(literal, token, regex, state);
        continue;
      }
      // Combinatoric rules like `\s*[xo<]?--+[-xo>]\s*`: enumerate candidates and keep
      // only the ones the real lexer accepts as this token.
      const candidates = expandPattern(foldClasses(regex.source.replace(/^\^/, '')));
      if (!candidates) {
        continue;
      }
      for (const candidate of candidates) {
        const text = candidate.trim();
        if (!text || text.length > 12) {
          continue;
        }
        if (lexerTokenFor(lexer, namesById, text) === token) {
          add(text, token, regex, state);
        }
      }
    }
  }

  const grammarId = path.basename(file, '.jison');
  return {
    conflicts: generator.conflicts,
    diagram: {
      engine: 'jison',
      grammarId,
      source: path.relative(ROOT, file),
      tokens: [...byKey.values()].sort((a, b) => a.text.localeCompare(b.text)),
    },
    namesById,
    parser,
    probeErrors,
  };
};

// ---------------------------------------------------------------------------
// Langium: textual grammar + generated Grammar reflection
// ---------------------------------------------------------------------------

const collectKeywords = (
  body: string,
  add: (text: string, context: string) => void,
  context: string
) => {
  for (const match of body.matchAll(/"([^\n"]*)"|'([^\n']*)'/g)) {
    const text = match[1] ?? match[2];
    if (text) {
      add(text, context);
    }
  }
};

const TERMINAL_LINE = /^[\t ]*(?:hidden[\t ]+)?terminal[\t ]+([A-Z_][\dA-Z_]*)[\t ]*:[\t ]*(.+)$/gm;

const parseLangiumText = async (file: string): Promise<DiagramSyntax> => {
  const source = await readFile(file, 'utf8');
  const clean = source.replaceAll(/\/\*[\S\s]*?\*\//g, '').replaceAll(/\/\/[^\n]*/g, '');
  const byKey = new Map<string, TokenSpec>();
  const add = (text: string, context: string) => {
    const key = `${text}\u0000${context}`;
    const existing = byKey.get(key);
    if (existing) {
      return;
    }
    byKey.set(key, {
      contexts: [context],
      kind: kindOf(text, text),
      text,
      token: text,
    });
  };
  // Terminals carry tokens too: quoted alternatives and literal regexes.
  for (const match of clean.matchAll(TERMINAL_LINE)) {
    const [, name, rest] = match;
    const regexPattern = /^\/([\S\s]*)\/[a-z]*[\t ]*;?[\t ]*$/.exec(rest.trim());
    if (regexPattern) {
      const text = literalFromPattern(regexPattern[1]);
      if (text) {
        add(text, name);
      }
    } else {
      collectKeywords(rest, add, name);
    }
  }
  // Parser-rule keywords; terminal lines are removed so their regexes are not read as keywords.
  const withoutTerminals = clean.replaceAll(
    /^[\t ]*(?:hidden[\t ]+)?terminal[\t ]+[A-Z_][\dA-Z_]*[\t ]*:.*$/gm,
    ''
  );
  const ruleStarts = [
    ...withoutTerminals.matchAll(/^([A-Z]\w*)(?:\s+returns\s+[\w ,<>[\]|]+)?\s*:/gm),
  ];
  for (const [index, start] of ruleStarts.entries()) {
    const body = withoutTerminals.slice(
      (start.index ?? 0) + start[0].length,
      ruleStarts[index + 1]?.index ?? withoutTerminals.length
    );
    collectKeywords(body, add, start[1]);
  }
  const grammarId = path.basename(file, '.langium');
  return {
    engine: 'langium',
    grammarId,
    source: path.relative(ROOT, file),
    tokens: [...byKey.values()].sort((a, b) => a.text.localeCompare(b.text)),
  };
};

const collectGrammarReflection = (grammar: any): TokenSpec[] => {
  const byKey = new Map<string, TokenSpec>();
  const visited = new WeakSet<object>();
  const add = (text: string, context: string, caseInsensitive: boolean) => {
    const key = `${text}\u0000${context}`;
    if (byKey.has(key)) {
      return;
    }
    byKey.set(key, {
      caseInsensitive: caseInsensitive || undefined,
      contexts: [context],
      kind: kindOf(text, text),
      text,
      token: text,
    });
  };
  const walk = (node: any, context: string, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 100 || visited.has(node)) {
      return;
    }
    visited.add(node);
    if (node.$type === 'Keyword' && typeof node.value === 'string') {
      add(node.value, context, Boolean(node.caseInsensitive));
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const child of value) {
          walk(child, context, depth + 1);
        }
      } else {
        walk(value, context, depth + 1);
      }
    }
  };
  for (const rule of grammar.rules ?? []) {
    if (rule.$type === 'ParserRule') {
      walk(rule.definition, rule.name);
    }
  }
  return [...byKey.values()].sort((a, b) => a.text.localeCompare(b.text));
};

const loadLangiumReflection = async (): Promise<Map<string, TokenSpec[]>> => {
  const result = new Map<string, TokenSpec[]>();
  try {
    const module: Record<string, any> = await import(pathToFileURL(PARSER_DIST).href);
    for (const [name, value] of Object.entries(module)) {
      if (!name.endsWith('GeneratedModule') || !value?.Grammar) {
        continue;
      }
      // Langium exposes the grammar lazily as a factory function.
      const grammar = typeof value.Grammar === 'function' ? value.Grammar() : value.Grammar;
      result.set(
        name.replace(/GeneratedModule$/, '').toLowerCase(),
        collectGrammarReflection(grammar)
      );
    }
  } catch (error) {
    console.warn(`! could not load ${PARSER_DIST}: ${String(error)}`);
  }
  return result;
};

// ---------------------------------------------------------------------------
// Checks + report
// ---------------------------------------------------------------------------

const normalize = (value: string) => value.trim().toLowerCase();
const moduleKey = (value: string) => value.toLowerCase().replaceAll(/[^\da-z]/g, '');

const GENERATED_HEADER = '// Generated by scripts/generate.mts. Do not edit.';

const emit = async (diagrams: DiagramSyntax[]) => {
  await mkdir(GENERATED_DIR, { recursive: true });
  for (const diagram of diagrams) {
    await writeFile(
      path.join(GENERATED_DIR, `${diagram.grammarId}.ts`),
      [
        GENERATED_HEADER,
        "import type { DiagramSyntax } from '../types.js';",
        '',
        `export const syntaxMetadata: DiagramSyntax = ${JSON.stringify(diagram)} as DiagramSyntax;`,
        '',
      ].join('\n')
    );
  }
  await writeFile(
    path.join(GENERATED_DIR, 'all.ts'),
    [
      GENERATED_HEADER,
      "import type { DiagramSyntax } from '../types.js';",
      ...diagrams.map(
        (diagram, index) =>
          `import { syntaxMetadata as diagram${index} } from './${diagram.grammarId}.js';`
      ),
      '',
      `export const allSyntaxMetadata: DiagramSyntax[] = [${diagrams
        .map((_diagram, index) => `diagram${index}`)
        .join(', ')}];`,
      '',
    ].join('\n')
  );
};

const main = async () => {
  const jisonFiles = await walkFiles(JISON_DIR, (name) => name.endsWith('.jison'));
  const langiumFiles = await walkFiles(LANGIUM_DIR, (name) => name.endsWith('.langium'));

  const jisonResults: JisonIntrospection[] = [];
  for (const file of jisonFiles.sort()) {
    jisonResults.push(await introspectJison(file));
  }
  const langiumDiagrams = await Promise.all(langiumFiles.sort().map(parseLangiumText));
  const reflection = await loadLangiumReflection();

  const diagrams: DiagramSyntax[] = [
    ...jisonResults.map((result) => result.diagram),
    ...langiumDiagrams,
  ];
  if (diagrams.length === 0) {
    throw new Error('No grammars found; check JISON_DIR/LANGIUM_DIR.');
  }
  await emit(diagrams);

  const lines: string[] = [];
  lines.push(`Generated ${diagrams.length} diagrams from mermaid grammars`);
  lines.push('='.repeat(60));

  let failures = 0;

  lines.push('');
  lines.push('jison extraction');
  lines.push('-'.repeat(60));
  for (const result of jisonResults) {
    const { tokens, grammarId } = result.diagram;
    const keywords = tokens.filter((token) => token.kind === 'keyword').length;
    const operators = tokens.filter((token) => token.kind === 'operator').length;
    const contexts = new Set(tokens.flatMap((token) => token.contexts)).size;
    const flags = [
      result.probeErrors > 0 ? `${result.probeErrors} probe errors` : '',
      result.conflicts > 0 ? `${result.conflicts} grammar conflicts` : '',
    ]
      .filter(Boolean)
      .join(', ');
    lines.push(
      `  ${grammarId.padEnd(22)} ${String(tokens.length).padStart(3)} tokens ` +
        `(${keywords} keywords, ${operators} operators, ${contexts} contexts)` +
        (flags ? `  [${flags}]` : '')
    );
    if (tokens.length === 0) {
      failures++;
      lines.push('    !! no tokens extracted');
    }
  }

  lines.push('');
  lines.push('langium reflection parity (informational)');
  lines.push('-'.repeat(60));
  for (const diagram of langiumDiagrams) {
    if (diagram.tokens.length === 0) {
      continue;
    }
    const reflected = reflection.get(moduleKey(diagram.grammarId));
    if (!reflected) {
      lines.push(`  ${diagram.grammarId.padEnd(18)} no generated module (text-only)`);
      continue;
    }
    const textKeywords = new Set(diagram.tokens.map((token) => normalize(token.text)));
    const reflectedKeywords = new Set(reflected.map((token) => normalize(token.text)));
    const missing = [...textKeywords].filter((token) => !reflectedKeywords.has(token));
    lines.push(
      `  ${diagram.grammarId.padEnd(18)} text=${textKeywords.size} reflection=${reflectedKeywords.size}` +
        (missing.length > 0 ? ` missing-in-reflection=[${missing.join(', ')}]` : '')
    );
  }

  lines.push('');
  lines.push(failures === 0 ? 'all checks passed' : `${failures} check(s) failed`);
  console.log(lines.join('\n'));
  if (failures > 0) {
    process.exitCode = 1;
  }
};

await main();
