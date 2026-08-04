import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { setConfig } from '../../../diagram-api/diagramAPI.js';
import type { ParserDefinition } from '../../../diagram-api/types.js';

/**
 * Test utilities shared by every migrated diagram's specs:
 * - `describeForEachParserEngine` — run a spec body against both engines.
 * - `assertParserParity` — the automated parity gate (legacy and Chevrotain must fill `db` identically).
 * - `loadParserFixtures` — read a `.mmd` fixture corpus.
 *
 * Imported only by `*.spec.ts` files (it pulls in `vitest` + `node:fs`).
 */

const PARSER_ENGINES = ['legacy', 'chevrotain'] as const;
export type ParserEngine = (typeof PARSER_ENGINES)[number];

/** Runs `body` inside a `describe` once per parser engine, selecting it via config in `beforeEach`. */
export function describeForEachParserEngine(
  diagramId: string,
  body: (engine: ParserEngine) => void
): void {
  describe.each(PARSER_ENGINES)(`%s parser`, (engine) => {
    beforeEach(() => {
      setConfig({ parser: { [diagramId]: engine } });
    });
    body(engine);
  });
}

export interface ParserFixture {
  name: string;
  source: string;
}

/** Reads `*.mmd` fixtures from a directory, stripping YAML frontmatter (the parser never sees it). */
export function loadParserFixtures(dir: string): ParserFixture[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.mmd'))
    .sort()
    .map((file) => ({
      name: file,
      source: readFileSync(resolve(dir, file), 'utf8').replace(
        /^---\r?\n[\S\s]*?\r?\n---\r?\n/,
        ''
      ),
    }));
}

export interface ParserParityOptions<T> {
  diagramId: string;
  /** The dispatcher parser (`./xParser.js`), which honors the engine config. */
  parser: ParserDefinition;
  /** Resets `db` state before each parse. */
  clear: () => void;
  /** Returns a plain, comparable snapshot of `db` state after a parse. */
  snapshot: () => T;
  /** VALID inputs only — both engines must succeed. (Error-case parity belongs in the spec.) */
  inputs: ParserFixture[];
}

/**
 * The automated parity gate: asserts the legacy and Chevrotain engines fill `db` identically for
 * every input. This catches the "passes the specs but diverges from legacy" class of bug that
 * the unit specs miss — feed it the diagram's fixture corpus (and, later, fuzzed inputs).
 */
export function assertParserParity<T>(options: ParserParityOptions<T>): void {
  const { diagramId, parser, clear, snapshot, inputs } = options;

  describe(`${diagramId} parser parity (legacy ↔ chevrotain)`, () => {
    if (inputs.length === 0) {
      it('has fixtures to compare', () => {
        expect(inputs.length).toBeGreaterThan(0);
      });
      return;
    }

    it.each(inputs)('produces identical db for $name', async ({ source }) => {
      const runWith = async (engine: ParserEngine): Promise<T> => {
        setConfig({ parser: { [diagramId]: engine } });
        clear();
        await parser.parse(source);
        return snapshot();
      };
      const legacy = await runWith('legacy');
      const chevrotain = await runWith('chevrotain');
      expect(chevrotain).toStrictEqual(legacy);
    });
  });
}
