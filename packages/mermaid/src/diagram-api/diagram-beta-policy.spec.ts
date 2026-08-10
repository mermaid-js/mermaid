/**
 * Beta policy for new diagram types:
 *
 * - NEVER_BETA_DIAGRAMS: stable diagrams that never had a beta phase (frozen list).
 * - GRADUATED_DIAGRAMS: diagrams that left beta but keep an optional `-beta` suffix for
 *   backwards compatibility. The detector must accept both `{id}` and `{id}-beta`.
 * - Any other registered diagram must require `-beta` in its syntax: the detector accepts
 *   the `-beta` keyword and rejects the same keyword without the `-beta` suffix. For
 *   diagrams whose keyword differs from `{id}-beta`, list the keyword in BETA_KEYWORD_OVERRIDES.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { detectors } from './detectType.js';
import { addDiagrams } from './diagram-orchestration.js';

/**
 * Stable diagrams that never had a beta phase.
 *
 * This list is frozen — it documents the diagrams that predate the `-beta` policy and
 * were never released under a `-beta` keyword. Do not add new entries.
 */
const NEVER_BETA_DIAGRAMS = new Set([
  'c4',
  'kanban',
  'classDiagram',
  'class',
  'er',
  'gantt',
  'info',
  'pie',
  'requirement',
  'sequence',
  'flowchart-v2',
  'flowchart',
  'timeline',
  'gitGraph',
  'stateDiagram',
  'state',
  'journey',
  'quadrantChart',
  'eventmodeling',
  'mindmap',
  'flowchart-elk',
]);

/**
 * Diagrams that graduated from beta to stable.
 *
 * Their canonical keyword no longer needs `-beta`, but for backwards compatibility the
 * detector must keep accepting the optional `-beta` suffix. The test below enforces that
 * both `{id}` and `{id}-beta` are detected.
 */
const GRADUATED_DIAGRAMS = new Set([
  'sankey',
  'packet',
  'xychart',
  'block',
  'ishikawa',
  'architecture',
  'treemap',
]);

/** Internal or pseudo-diagram types — not subject to beta policy. */
const EXCLUDED_DIAGRAMS = new Set(['error', '---']);

/**
 * Beta keyword for diagrams whose registered id differs from the keyword users type
 * (e.g. id `railroadEbnf` is triggered by `railroad-ebnf-beta`). Diagrams not listed
 * here are assumed to use `{id}-beta`.
 */
const BETA_KEYWORD_OVERRIDES: Record<string, string> = {
  railroad: 'railroad-beta',
  railroadEbnf: 'railroad-ebnf-beta',
  railroadAbnf: 'railroad-abnf-beta',
  railroadPeg: 'railroad-peg-beta',
};

describe('diagram beta policy', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it('new diagram types require -beta in syntax', () => {
    const violations: string[] = [];

    for (const [id, { detector }] of Object.entries(detectors)) {
      if (NEVER_BETA_DIAGRAMS.has(id) || GRADUATED_DIAGRAMS.has(id) || EXCLUDED_DIAGRAMS.has(id)) {
        continue;
      }

      const betaKeyword = BETA_KEYWORD_OVERRIDES[id] ?? `${id}-beta`;
      const plainKeyword = betaKeyword.replace(/-beta$/, '');

      const acceptsBeta = Boolean(detector(betaKeyword));
      const rejectsPlain = !detector(plainKeyword);

      if (!acceptsBeta || !rejectsPlain) {
        violations.push(id);
      }
    }

    if (violations.length > 0) {
      expect.fail(
        `New diagram type(s) must require \`-beta\` syntax: ${violations.join(', ')}.\n` +
          'Expected the detector to accept the `-beta` keyword and reject it without the suffix.\n' +
          'Do not add to NEVER_BETA_DIAGRAMS — update the detector instead.'
      );
    }
  });

  it('graduated diagrams accept an optional -beta suffix', () => {
    const violations: string[] = [];

    for (const id of GRADUATED_DIAGRAMS) {
      const { detector } = detectors[id] ?? {};
      if (!detector || !detector(id) || !detector(`${id}-beta`)) {
        violations.push(id);
      }
    }

    expect(
      violations,
      `Graduated diagram(s) must accept both \`{id}\` and \`{id}-beta\`: ${violations.join(', ')}`
    ).toEqual([]);
  });

  it('beta-policy lists contain no stale or overlapping entries', () => {
    const registered = new Set(Object.keys(detectors));
    const lists = {
      NEVER_BETA_DIAGRAMS,
      GRADUATED_DIAGRAMS,
    };

    for (const [name, set] of Object.entries(lists)) {
      const stale = [...set].filter((id) => !registered.has(id));
      expect(stale, `Stale ${name}: ${stale.join(', ')}`).toEqual([]);
    }

    const all = [...NEVER_BETA_DIAGRAMS, ...GRADUATED_DIAGRAMS];
    const duplicates = all.filter((id, i) => all.indexOf(id) !== i);
    expect(duplicates, `Diagram(s) listed in multiple sets: ${duplicates.join(', ')}`).toEqual([]);
  });
});
