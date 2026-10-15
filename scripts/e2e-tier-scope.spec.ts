import { describe, it, expect } from 'vitest';
import {
  buildTierSpecPattern,
  buildPrTierSpecPattern,
  SPEC_BASE_DIR,
  MMD_SNAPSHOTS_SPEC,
  otherTierDir,
} from './e2e-tier-scope.mjs';

// The tests run in the repo root, so the tier subfolders created by the file
// reorganisation are present on disk — no mocking needed.

describe('buildTierSpecPattern', () => {
  it('always includes the global mmd snapshot runner', () => {
    expect(buildTierSpecPattern(['pr-check']).split(',')).toContain(MMD_SNAPSHOTS_SPEC);
  });

  it('includes at least one diagram pr-check subfolder', () => {
    const patterns = buildTierSpecPattern(['pr-check']).split(',');
    expect(
      patterns.some((p) => p.startsWith(`${SPEC_BASE_DIR}/`) && p.endsWith('/pr-check/'))
    ).toBe(true);
  });

  it('includes at least one diagram nightly-check subfolder when nightly-check is requested', () => {
    const patterns = buildTierSpecPattern(['nightly-check']).split(',');
    expect(
      patterns.some((p) => p.startsWith(`${SPEC_BASE_DIR}/`) && p.endsWith('/nightly-check/'))
    ).toBe(true);
  });

  it('combines multiple tiers without duplicating the runner', () => {
    const prOnly = new Set(buildTierSpecPattern(['pr-check']).split(','));
    const nightlyOnly = new Set(buildTierSpecPattern(['nightly-check']).split(','));
    const combined = buildTierSpecPattern(['pr-check', 'nightly-check']).split(',');

    for (const pattern of prOnly) {
      expect(combined).toContain(pattern);
    }
    for (const pattern of nightlyOnly) {
      expect(combined).toContain(pattern);
    }
    expect(combined.filter((p) => p === MMD_SNAPSHOTS_SPEC)).toHaveLength(1);
  });

  it('includes the cross-cutting e2e/other/pr-check specs', () => {
    expect(buildTierSpecPattern(['pr-check']).split(',')).toContain(`${otherTierDir('pr-check')}/`);
  });

  it('omits an e2e/other tier subfolder that does not exist on disk', () => {
    expect(buildTierSpecPattern(['this-tier-does-not-exist']).split(',')).not.toContain(
      `${otherTierDir('this-tier-does-not-exist')}/`
    );
  });

  it('returns patterns that Playwright can compile as regular expressions', () => {
    for (const pattern of buildTierSpecPattern(['pr-check', 'nightly-check']).split(',')) {
      expect(() => new RegExp(pattern, 'gi')).not.toThrow();
    }
  });

  it('returns a sorted, de-duplicated, comma-separated list', () => {
    const patterns = buildTierSpecPattern(['pr-check']).split(',');
    expect(patterns).toEqual([...new Set(patterns)].sort());
  });

  it('returns just the runner and e2e/other/pr-check when the spec base dir has no diagram folders', () => {
    expect(buildTierSpecPattern(['pr-check'], 'e2e/does-not-exist').split(',')).toEqual(
      [`${otherTierDir('pr-check')}/`, MMD_SNAPSHOTS_SPEC].sort()
    );
  });

  it('throws when given no tiers', () => {
    expect(() => buildTierSpecPattern([])).toThrow();
  });
});

describe('buildPrTierSpecPattern (back-compat wrapper)', () => {
  it('is equivalent to buildTierSpecPattern(["pr-check"])', () => {
    expect(buildPrTierSpecPattern()).toBe(buildTierSpecPattern(['pr-check']));
  });
});
