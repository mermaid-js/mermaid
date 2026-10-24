// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildRenderConfig,
  compareBackground,
  compareSemver,
  describeBundle,
  effectiveTheme,
  isPrerelease,
  isValidVersionParam,
  keyboardShortcutAction,
  type KeyEventDescriptor,
  parseCompareUrlState,
  pickLayoutElkVersion,
  reduceRegistryDocument,
  resolveVersionAlias,
  serializeCompareUrlState,
  sortVersionsDesc,
  type RegistrySummary,
} from './compare-versions.js';

const CDN = 'https://cdn.jsdelivr.net/npm';

describe('describeBundle', () => {
  it('uses the local dev bundles plus the local layout-elk for dev', () => {
    expect(describeBundle('dev')).toEqual({
      version: 'dev',
      format: 'esm',
      api: 'async',
      mermaidUrl: '/mermaid.esm.mjs',
      elkUrl: '/mermaid-layout-elk.esm.mjs',
      bestEffort: false,
    });
  });

  it('uses the ESM build and layout-elk for 11.x when an elk version is known', () => {
    expect(describeBundle('11.4.1', { elkVersion: '0.1.7' })).toEqual({
      version: '11.4.1',
      format: 'esm',
      api: 'async',
      mermaidUrl: `${CDN}/mermaid@11.4.1/dist/mermaid.esm.min.mjs`,
      elkUrl: `${CDN}/@mermaid-js/layout-elk@0.1.7/dist/mermaid-layout-elk.esm.min.mjs`,
      bestEffort: false,
    });
  });

  it('omits elk for 11.x when no layout-elk version matched', () => {
    expect(describeBundle('11.0.0').elkUrl).toBeUndefined();
  });

  it('never loads the external layout-elk for 12.x (elk is built in)', () => {
    const d = describeBundle('12.0.0', { elkVersion: '1.0.0' });
    expect(d.format).toBe('esm');
    expect(d.mermaidUrl).toBe(`${CDN}/mermaid@12.0.0/dist/mermaid.esm.min.mjs`);
    expect(d.elkUrl).toBeUndefined();
  });

  it('uses the ESM build without elk for 10.x', () => {
    expect(describeBundle('10.9.1', { elkVersion: '0.1.0' })).toEqual({
      version: '10.9.1',
      format: 'esm',
      api: 'async',
      mermaidUrl: `${CDN}/mermaid@10.9.1/dist/mermaid.esm.min.mjs`,
      elkUrl: undefined,
      bestEffort: false,
    });
  });

  it.each(['9.4.3', '8.14.0', '8.0.0'])('uses the IIFE callback API for %s', (v) => {
    expect(describeBundle(v)).toEqual({
      version: v,
      format: 'iife',
      api: 'callback',
      mermaidUrl: `${CDN}/mermaid@${v}/dist/mermaid.min.js`,
      elkUrl: undefined,
      bestEffort: false,
    });
  });

  it('marks pre-8 versions as best effort', () => {
    const d = describeBundle('7.1.2');
    expect(d.format).toBe('iife');
    expect(d.api).toBe('callback');
    expect(d.mermaidUrl).toBe(`${CDN}/mermaid@7.1.2/dist/mermaid.min.js`);
    expect(d.bestEffort).toBe(true);
  });

  it('rejects things that are not versions', () => {
    expect(() => describeBundle('latest')).toThrow();
    expect(() => describeBundle('1.0.0/../../evil')).toThrow();
  });
});

describe('semver helpers', () => {
  it('compares numerically, not lexically', () => {
    expect(compareSemver('10.0.0', '9.4.3')).toBeGreaterThan(0);
    expect(compareSemver('11.10.0', '11.9.9')).toBeGreaterThan(0);
    expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
  });

  it('orders prereleases before their release', () => {
    expect(compareSemver('11.0.0-alpha.7', '11.0.0')).toBeLessThan(0);
    expect(compareSemver('11.0.0-alpha.10', '11.0.0-alpha.7')).toBeGreaterThan(0);
    expect(compareSemver('10.9.0-rc.2', '10.8.0')).toBeGreaterThan(0);
  });

  it('detects prereleases', () => {
    expect(isPrerelease('11.0.0-alpha.7')).toBe(true);
    expect(isPrerelease('11.0.0')).toBe(false);
  });

  it('sorts newest first and hides prereleases by default', () => {
    const input = ['9.4.3', '11.0.0-alpha.7', '10.9.1', '11.10.0', '11.9.0', '8.0.0'];
    expect(sortVersionsDesc(input)).toEqual(['11.10.0', '11.9.0', '10.9.1', '9.4.3', '8.0.0']);
    expect(sortVersionsDesc(input, { includePrereleases: true })).toEqual([
      '11.10.0',
      '11.9.0',
      '11.0.0-alpha.7',
      '10.9.1',
      '9.4.3',
      '8.0.0',
    ]);
  });

  it('drops strings that are not semver', () => {
    expect(sortVersionsDesc(['1.0.0', 'garbage', '2.0'])).toEqual(['1.0.0']);
  });
});

describe('reduceRegistryDocument', () => {
  it('keeps versions (newest first), their publish times and dist-tags only', () => {
    const doc = {
      name: 'mermaid',
      readme: 'x'.repeat(1000),
      'dist-tags': { latest: '11.1.0', next: '11.2.0-rc.1' },
      versions: { '11.0.0': { big: true }, '11.1.0': {}, '11.2.0-rc.1': {} },
      time: {
        created: '2014-01-01T00:00:00.000Z',
        modified: '2025-01-01T00:00:00.000Z',
        '11.0.0': '2024-08-01T00:00:00.000Z',
        '11.1.0': '2024-09-01T00:00:00.000Z',
        '11.2.0-rc.1': '2024-10-01T00:00:00.000Z',
        '10.0.0-unpublished': '2023-01-01T00:00:00.000Z',
      },
    };
    expect(reduceRegistryDocument(doc)).toEqual({
      versions: ['11.2.0-rc.1', '11.1.0', '11.0.0'],
      time: {
        '11.0.0': '2024-08-01T00:00:00.000Z',
        '11.1.0': '2024-09-01T00:00:00.000Z',
        '11.2.0-rc.1': '2024-10-01T00:00:00.000Z',
      },
      distTags: { latest: '11.1.0', next: '11.2.0-rc.1' },
    });
  });

  it('throws on a malformed document', () => {
    expect(() => reduceRegistryDocument(null)).toThrow();
    expect(() => reduceRegistryDocument({ versions: 'nope' })).toThrow();
  });
});

describe('pickLayoutElkVersion', () => {
  const mermaid: RegistrySummary = {
    versions: ['12.0.0', '11.17.2', '11.4.1', '11.0.0', '10.9.1'],
    time: {
      '10.9.1': '2024-05-01T00:00:00.000Z',
      '11.0.0': '2024-08-20T00:00:00.000Z',
      '11.4.1': '2024-11-28T00:00:00.000Z',
      '11.17.2': '2026-09-15T00:00:00.000Z',
      '12.0.0': '2026-09-10T08:00:00.000Z',
    },
    distTags: { latest: '12.0.0' },
  };
  const elk: RegistrySummary = {
    versions: ['1.0.0', '0.2.3', '0.1.8-beta.1', '0.1.7', '0.1.0'],
    time: {
      '0.1.0': '2024-08-23T12:27:00.940Z',
      '0.1.7': '2024-11-27T17:15:51.715Z',
      '0.1.8-beta.1': '2024-11-28T00:00:00.000Z',
      '0.2.3': '2026-08-19T09:04:49.274Z',
      '1.0.0': '2026-09-10T07:32:38.031Z',
    },
    distTags: { latest: '1.0.0' },
  };

  it('picks the newest non-prerelease published at or before the mermaid version', () => {
    expect(pickLayoutElkVersion('11.4.1', mermaid, elk)).toBe('0.1.7');
  });

  it('keeps 11.x on the 0.x line even when 1.0.0 (peer mermaid ^12) is older', () => {
    expect(pickLayoutElkVersion('11.17.2', mermaid, elk)).toBe('0.2.3');
  });

  it('returns undefined when nothing was published before that version', () => {
    expect(pickLayoutElkVersion('11.0.0', mermaid, elk)).toBeUndefined();
  });

  it('returns undefined for versions that do not need the external package', () => {
    expect(pickLayoutElkVersion('10.9.1', mermaid, elk)).toBeUndefined();
    expect(pickLayoutElkVersion('12.0.0', mermaid, elk)).toBeUndefined();
    expect(pickLayoutElkVersion('dev', mermaid, elk)).toBeUndefined();
  });

  it('returns undefined when the publish time is unknown', () => {
    expect(pickLayoutElkVersion('11.9.9', mermaid, elk)).toBeUndefined();
  });
});

describe('resolveVersionAlias', () => {
  it('maps latest to the dist-tag and passes other values through', () => {
    const summary = { versions: ['12.0.0'], time: {}, distTags: { latest: '12.0.0' } };
    expect(resolveVersionAlias('latest', summary)).toBe('12.0.0');
    expect(resolveVersionAlias('dev', summary)).toBe('dev');
    expect(resolveVersionAlias('9.4.3', summary)).toBe('9.4.3');
    expect(resolveVersionAlias('latest', undefined)).toBeUndefined();
  });
});

describe('compare URL state', () => {
  it('uses defaults when nothing is set', () => {
    expect(parseCompareUrlState(new URLSearchParams(''))).toEqual({
      tab: 'diagram',
      left: 'latest',
      right: 'dev',
      diff: false,
    });
  });

  it('parses every field', () => {
    expect(
      parseCompareUrlState(new URLSearchParams('tab=compare&left=9.4.3&right=dev&diff=1'))
    ).toEqual({ tab: 'compare', left: '9.4.3', right: 'dev', diff: true });
  });

  it('falls back to defaults for invalid values', () => {
    expect(
      parseCompareUrlState(new URLSearchParams('tab=nope&left=<script>&right=1.x&diff=maybe'))
    ).toEqual({ tab: 'diagram', left: 'latest', right: 'dev', diff: false });
  });

  it('round-trips through serialize', () => {
    const state = { tab: 'compare', left: '11.4.1', right: 'dev', diff: true } as const;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(serializeCompareUrlState(state))) {
      if (v) params.set(k, v);
    }
    expect(parseCompareUrlState(params)).toEqual(state);
  });

  it('serializes diff=false as a removal', () => {
    expect(
      serializeCompareUrlState({ tab: 'code', left: 'latest', right: 'dev', diff: false })
    ).toEqual({ tab: 'code', left: 'latest', right: 'dev', diff: null });
  });

  it('validates version params', () => {
    expect(isValidVersionParam('dev')).toBe(true);
    expect(isValidVersionParam('latest')).toBe(true);
    expect(isValidVersionParam('11.0.0-alpha.7')).toBe(true);
    expect(isValidVersionParam('11')).toBe(false);
    expect(isValidVersionParam('')).toBe(false);
  });
});

describe('buildRenderConfig', () => {
  const settings = {
    theme: 'dark',
    layout: 'elk',
    look: 'classic',
    logLevel: 'warn',
    useMaxWidth: true,
    ignoreCrossLaneEdges: true,
    optimizeRanksByCrossings: false,
  };

  it('matches the viewer config', () => {
    expect(buildRenderConfig(settings)).toEqual({
      startOnLoad: false,
      securityLevel: 'strict',
      maxTextSize: 50_000_000,
      maxEdges: 1_000_000,
      theme: 'dark',
      layout: 'elk',
      look: 'classic',
      logLevel: 'warn',
      flowchart: {
        useMaxWidth: true,
        ignoreCrossLaneEdges: true,
        optimizeRanksByCrossings: false,
      },
    });
  });

  it('omits theme, layout and look entirely when they are not set', () => {
    const config = buildRenderConfig({
      ...settings,
      theme: undefined,
      layout: undefined,
      look: undefined,
    });
    expect(config).not.toHaveProperty('theme');
    expect(config).not.toHaveProperty('layout');
    expect(config).not.toHaveProperty('look');
    expect(Object.values(config)).not.toContain(undefined);
    expect(config.securityLevel).toBe('strict');
    expect(config.logLevel).toBe('warn');
  });

  it('passes each set key through independently', () => {
    const config = buildRenderConfig({ ...settings, theme: 'forest', layout: undefined });
    expect(config.theme).toBe('forest');
    expect(config).not.toHaveProperty('layout');
    expect(config.look).toBe('classic');
  });

  it('keeps keys unset in the natural-size compare config too', () => {
    const config = buildRenderConfig(
      { ...settings, theme: undefined, layout: undefined, look: undefined },
      { naturalSize: true }
    );
    expect(config).not.toHaveProperty('theme');
    expect(config).not.toHaveProperty('layout');
    expect(config).not.toHaveProperty('look');
  });

  it('forces natural size for compare', () => {
    const config = buildRenderConfig(settings, { naturalSize: true });
    expect((config.flowchart as Record<string, unknown>).useMaxWidth).toBe(false);
    expect((config.sequence as Record<string, unknown>).useMaxWidth).toBe(false);
    expect((config.state as Record<string, unknown>).useMaxWidth).toBe(false);
  });
});

describe('effectiveTheme', () => {
  it('uses the selected theme when set', () => {
    expect(effectiveTheme('forest', '---\nconfig:\n  theme: dark\n---\nflowchart')).toBe('forest');
  });

  it('falls back to a frontmatter or directive theme when unset', () => {
    expect(effectiveTheme(undefined, '---\nconfig:\n  theme: dark\n---\nflowchart\n a')).toBe(
      'dark'
    );
    expect(effectiveTheme(undefined, "%%{init: {'theme': 'neo-dark'}}%%\nflowchart")).toBe(
      'neo-dark'
    );
    expect(effectiveTheme(undefined, 'flowchart\n a --> b')).toBeUndefined();
  });
});

describe('compareBackground', () => {
  it('matches the viewer canvas background', () => {
    expect(compareBackground('default')).toBe('#ffffff');
    expect(compareBackground('dark')).toBe('#0b1020');
    expect(compareBackground('redux-dark-color')).toBe('#0b1020');
    expect(compareBackground(undefined)).toBe('#ffffff');
  });
});

describe('keyboardShortcutAction', () => {
  const body = [{ tag: 'body' }, { tag: 'html' }];
  const key = (k: string, extra: Partial<KeyEventDescriptor> = {}): KeyEventDescriptor => ({
    key: k,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    repeat: false,
    defaultPrevented: false,
    path: body,
    ...extra,
  });

  it('maps the arrows to prev/next', () => {
    expect(keyboardShortcutAction(key('ArrowLeft'))).toBe('prev');
    expect(keyboardShortcutAction(key('ArrowRight'))).toBe('next');
    expect(keyboardShortcutAction(key('ArrowUp'))).toBeNull();
  });

  it('toggles the diff with D only on the compare tab', () => {
    expect(keyboardShortcutAction(key('d'), { compareTab: true })).toBe('toggle-diff');
    expect(keyboardShortcutAction(key('D'), { compareTab: true })).toBe('toggle-diff');
    expect(keyboardShortcutAction(key('d'))).toBeNull();
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'repeat', 'defaultPrevented'] as const)(
    'ignores events with %s',
    (flag) => {
      expect(keyboardShortcutAction(key('ArrowRight', { [flag]: true }))).toBeNull();
      expect(keyboardShortcutAction(key('d', { [flag]: true }), { compareTab: true })).toBeNull();
    }
  );

  it.each([
    ['input', [{ tag: 'input' }]],
    ['textarea', [{ tag: 'textarea' }]],
    ['select', [{ tag: 'select' }]],
    ['contenteditable', [{ tag: 'div', editable: true }]],
    [
      'CodeMirror',
      [
        { tag: 'div', classes: ['cm-content'] },
        { tag: 'div', classes: ['cm-editor'] },
      ],
    ],
    ['sl-select', [{ tag: 'div' }, { tag: 'sl-select' }]],
    ['sl-input', [{ tag: 'input' }, { tag: 'sl-input' }]],
    ['sl-checkbox', [{ tag: 'sl-checkbox' }]],
    ['sl-range', [{ tag: 'sl-range' }]],
    ['sl-radio-group', [{ tag: 'sl-radio' }, { tag: 'sl-radio-group' }]],
    ['sl-split-panel divider', [{ tag: 'div' }, { tag: 'sl-split-panel' }]],
    ['the tab nav', [{ tag: 'div' }, { tag: 'sl-tab' }, { tag: 'sl-tab-group' }]],
  ])('ignores key events from %s', (_name, path) => {
    const p = [...path, ...body];
    expect(keyboardShortcutAction(key('ArrowLeft', { path: p }))).toBeNull();
    expect(keyboardShortcutAction(key('d', { path: p }), { compareTab: true })).toBeNull();
  });

  it('still navigates from a focused button or inside a tab panel', () => {
    const p = [
      { tag: 'button' },
      { tag: 'sl-button' },
      { tag: 'sl-tab-panel' },
      { tag: 'sl-tab-group' },
      ...body,
    ];
    expect(keyboardShortcutAction(key('ArrowRight', { path: p }))).toBe('next');
  });
});
