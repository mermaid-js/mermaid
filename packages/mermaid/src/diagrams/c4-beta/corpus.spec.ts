import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { log } from '../../logger.js';
import { EXPECTED } from './corpus/expected.js';
import type { WarningKind } from './corpus/expected.js';
import { C4BetaDB } from './db.js';
import { parseC4Beta } from './parser.js';

const CORPUS = join(import.meta.dirname, 'corpus');

const source = (probe: string): string => readFileSync(join(CORPUS, `${probe}.mmd`), 'utf8');

/** The dropped input each warning is about, by the words of its message. */
const WARNING_PATTERNS: [WarningKind, RegExp][] = [
  ['technology', /technology .* is ignored/],
  ['instances', /instances .* is ignored/],
  ['step', /step .* is ignored/],
  ['style', /unsupported style/],
];

const warningKind = (message: string): WarningKind | 'other' =>
  WARNING_PATTERNS.find(([, pattern]) => pattern.test(message))?.[0] ?? 'other';

/** What the parser makes of a text: `undefined` when it refuses it. */
const summarize = async (text: string) => {
  const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
  try {
    const db = new C4BetaDB();
    await parseC4Beta(text, db);
    const boundaries = db.getBoundaryIds();
    const { edges } = db.getData();
    return {
      elements: db.getElements().map((element) => element.id),
      boundaries: db
        .getElements()
        .map((element) => element.id)
        .filter((id) => boundaries.has(id)),
      relations: db
        .getRelationships()
        .map((relation) => `${relation.sourceId}>${relation.targetId}`),
      edges: edges.length,
      warnings: [
        ...new Set(
          warn.mock.calls
            .map(([message]) => warningKind(String(message)))
            .filter((kind) => kind !== 'other')
        ),
      ],
    };
  } catch {
    return undefined;
  } finally {
    warn.mockRestore();
  }
};

/**
 * The probes the parser does not yet give the verdict of the spec. Each names the row of the
 * "prototype oddities" table it waits on; fixing the row removes its entry.
 */
const NOT_YET: Record<string, string> = {
  'b06-four-arrows': 'the `---` arrow, which is not on this branch',
  'b10-direction-legend-acc': '`legend`, which is not on this branch',
  'b16-arrow-without-spaces': 'the `---` arrow, which is not on this branch',
};

describe('c4-beta shared probes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const [probe, expected] of Object.entries(EXPECTED)) {
    const reason = NOT_YET[probe];
    const run = reason === undefined ? it : it.fails;
    run(reason === undefined ? probe : `${probe} (waits on ${reason})`, async () => {
      const got = await summarize(source(probe));
      if (expected.verdict === 'reject') {
        expect(got).toBeUndefined();
        return;
      }
      expect(got).toBeDefined();
      expect({
        elements: got?.elements,
        boundaries: got?.boundaries,
        relations: got?.relations,
        warnings: got?.warnings,
      }).toEqual({
        elements: expected.elements,
        boundaries: expected.boundaries,
        relations: expected.relations,
        warnings: expected.warnings ?? [],
      });
    });
  }
});

describe('c4-beta shared probes, as far as this branch reads them', () => {
  it('b06-four-arrows without its undirected arrow stores `a <-- c` as `c --> a`', async () => {
    const text = source('b06-four-arrows').replace(/^c --- d.*\n/m, '');
    const got = await summarize(text);
    expect(got?.relations).toEqual(['a>b', 'c>a', 'b>d']);
  });
});
