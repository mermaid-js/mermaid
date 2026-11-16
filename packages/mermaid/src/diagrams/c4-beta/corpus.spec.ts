import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@mermaid-js/parser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { log } from '../../logger.js';
import { EXPECTED } from './corpus/expected.js';
import type { WarningKind } from './corpus/expected.js';
import { C4BetaDB } from './db.js';
import { populateDb } from './parser.js';

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
    populateDb(await parse('c4', text), db);
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
  'b03-kind-keywords-as-ids': 'row 3: any word but the six statement words is an id',
  'b05-empty-braces-and-group': 'row 11: an empty group draws a frame',
  'b06-four-arrows': 'row 6: `a <-- c` is stored as `c --> a`; and `---` is not on this branch',
  'b10-direction-legend-acc': '`legend` is not on this branch',
  'b16-arrow-without-spaces': 'row 1: an id never contains `--`; and `---` is not on this branch',
  'b17-digit-leading-id': 'row 2: ids may start with a digit',
  'b18-keyword-ids': 'row 5: an unknown relation end is an error at parse',
  'b19-unknown-end': 'row 5: an unknown relation end is an error at parse',
  'b20-duplicate-id': 'row 4: a duplicate id is an error naming both lines',
  'b25-step-outside-dynamic': 'row 8: `N:` outside `dynamic` gives a warning',
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
