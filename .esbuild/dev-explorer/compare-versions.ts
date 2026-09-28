/**
 * Pure (DOM-free) helpers for the Dev Explorer viewer, mostly for the "Compare"
 * tab: version sorting, npm registry reduction, per-era bundle descriptors,
 * layout-elk matching, URL state, the shared render config and keyboard
 * shortcuts. Shared by the browser bundle and the dev server (server.ts), and
 * unit-tested in compare-versions.spec.ts.
 */

const CDN = 'https://cdn.jsdelivr.net/npm';

// mermaid's `maxTextSize` (default 50_000) and `maxEdges` (default 500) are
// *secure* config keys, so they can't be raised from a diagram's frontmatter/
// directives — only via initialize(). The Dev Explorer is for testing large
// diagrams, so we set generous limits here.
export const DEV_MAX_TEXT_SIZE = 50_000_000;
export const DEV_MAX_EDGES = 1_000_000;

// ---------------------------------------------------------------------------
// Semver (hand-rolled; no semver dependency at the repo root)
// ---------------------------------------------------------------------------

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([\d.A-Za-z-]+))?$/;

type ParsedSemver = { major: number; minor: number; patch: number; prerelease: string[] };

function parseSemver(v: string): ParsedSemver | null {
  const m = SEMVER_RE.exec(v);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ? m[4].split('.') : [],
  };
}

export function isSemver(v: string): boolean {
  return parseSemver(v) !== null;
}

export function isPrerelease(v: string): boolean {
  return (parseSemver(v)?.prerelease.length ?? 0) > 0;
}

function comparePrereleaseIds(a: string, b: string): number {
  const an = /^\d+$/.test(a);
  const bn = /^\d+$/.test(b);
  if (an && bn) return Number(a) - Number(b);
  if (an) return -1;
  if (bn) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Semver precedence compare. Invalid versions sort below everything. */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return pa ? 1 : pb ? -1 : 0;
  for (const k of ['major', 'minor', 'patch'] as const) {
    if (pa[k] !== pb[k]) return pa[k] - pb[k];
  }
  // A release outranks its prereleases.
  if (pa.prerelease.length === 0 || pb.prerelease.length === 0) {
    return pb.prerelease.length - pa.prerelease.length;
  }
  const n = Math.max(pa.prerelease.length, pb.prerelease.length);
  for (let i = 0; i < n; i++) {
    const x = pa.prerelease[i];
    const y = pb.prerelease[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const c = comparePrereleaseIds(x, y);
    if (c !== 0) return c;
  }
  return 0;
}

export function sortVersionsDesc(
  versions: string[],
  { includePrereleases = false }: { includePrereleases?: boolean } = {}
): string[] {
  return versions
    .filter((v) => isSemver(v) && (includePrereleases || !isPrerelease(v)))
    .sort((a, b) => compareSemver(b, a));
}

// ---------------------------------------------------------------------------
// npm registry
// ---------------------------------------------------------------------------

export type RegistrySummary = {
  /** Every published semver version, newest first (prereleases included). */
  versions: string[];
  /** Publish time per version. */
  time: Record<string, string>;
  distTags: Record<string, string>;
};

/** Shape returned by `GET /dev/api/versions`. */
export type VersionsResponse = {
  mermaid: RegistrySummary;
  layoutElk: RegistrySummary;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Reduce a full npm registry document (several MB for mermaid) to what the UI needs. */
export function reduceRegistryDocument(doc: unknown): RegistrySummary {
  if (!isRecord(doc) || !isRecord(doc.versions)) {
    throw new Error('Unexpected registry document');
  }
  const versions = sortVersionsDesc(Object.keys(doc.versions), { includePrereleases: true });
  const rawTime = isRecord(doc.time) ? doc.time : {};
  const time: Record<string, string> = {};
  for (const v of versions) {
    if (typeof rawTime[v] === 'string') time[v] = rawTime[v];
  }
  const rawTags = isRecord(doc['dist-tags']) ? doc['dist-tags'] : {};
  const distTags: Record<string, string> = {};
  for (const [tag, v] of Object.entries(rawTags)) {
    if (typeof v === 'string' && isSemver(v)) distTags[tag] = v;
  }
  return { versions, time, distTags };
}

// ---------------------------------------------------------------------------
// Bundles per era
// ---------------------------------------------------------------------------

export type BundleDescriptor = {
  version: string;
  /** `esm` → dynamic import(); `iife` → classic <script> that sets window.mermaid. */
  format: 'esm' | 'iife';
  /** `async` → `await render(id, text)` → `{ svg }`; `callback` → `render(id, text, cb)`. */
  api: 'async' | 'callback';
  mermaidUrl: string;
  /** `@mermaid-js/layout-elk` ESM bundle to pass to `registerLayoutLoaders`. */
  elkUrl?: string;
  /** Pre-8 releases: loaded the same way as 8.x, but no guarantees. */
  bestEffort: boolean;
};

export function describeBundle(
  version: string,
  { elkVersion }: { elkVersion?: string } = {}
): BundleDescriptor {
  if (version === 'dev') {
    return {
      version,
      format: 'esm',
      api: 'async',
      mermaidUrl: '/mermaid.esm.mjs',
      elkUrl: '/mermaid-layout-elk.esm.mjs',
      bestEffort: false,
    };
  }
  const parsed = parseSemver(version);
  if (!parsed) {
    throw new Error(`Not a mermaid version: ${version}`);
  }
  if (parsed.major >= 10) {
    // elk moved into @mermaid-js/layout-elk in 11.0 and back into core in 12.0.
    const elkUrl =
      parsed.major === 11 && elkVersion && isSemver(elkVersion)
        ? `${CDN}/@mermaid-js/layout-elk@${elkVersion}/dist/mermaid-layout-elk.esm.min.mjs`
        : undefined;
    return {
      version,
      format: 'esm',
      api: 'async',
      mermaidUrl: `${CDN}/mermaid@${version}/dist/mermaid.esm.min.mjs`,
      elkUrl,
      bestEffort: false,
    };
  }
  return {
    version,
    format: 'iife',
    api: 'callback',
    mermaidUrl: `${CDN}/mermaid@${version}/dist/mermaid.min.js`,
    elkUrl: undefined,
    bestEffort: parsed.major < 8,
  };
}

/**
 * The `@mermaid-js/layout-elk` version to pair with a published mermaid 11.x:
 * the newest non-prerelease published at or before that mermaid release.
 * layout-elk 1.x peers on mermaid ^12, so 11.x stays on the 0.x line.
 * Other majors don't need the external package (10.x has no elk layout
 * loader; 12.x bundles elk), so they get `undefined`.
 */
export function pickLayoutElkVersion(
  mermaidVersion: string,
  mermaid: RegistrySummary,
  elk: RegistrySummary
): string | undefined {
  const parsed = parseSemver(mermaidVersion);
  if (parsed?.major !== 11) return undefined;
  const publishedAt = Date.parse(mermaid.time[mermaidVersion] ?? '');
  if (!Number.isFinite(publishedAt)) return undefined;
  return sortVersionsDesc(elk.versions).find((v) => {
    if (parseSemver(v)!.major >= 1) return false;
    const t = Date.parse(elk.time[v] ?? '');
    return Number.isFinite(t) && t <= publishedAt;
  });
}

/** Resolve the `latest` alias against the registry; `dev` and versions pass through. */
export function resolveVersionAlias(
  value: string,
  summary: RegistrySummary | undefined
): string | undefined {
  if (value === 'latest') return summary?.distTags.latest;
  return value;
}

// ---------------------------------------------------------------------------
// URL state
// ---------------------------------------------------------------------------

export type ViewerTab = 'diagram' | 'code' | 'profile' | 'compare';
export const VIEWER_TABS: readonly ViewerTab[] = ['diagram', 'code', 'profile', 'compare'];

export function isViewerTab(v: unknown): v is ViewerTab {
  return typeof v === 'string' && (VIEWER_TABS as readonly string[]).includes(v);
}

export type CompareUrlState = {
  tab: ViewerTab;
  /** `dev`, `latest` or an exact version. */
  left: string;
  right: string;
  diff: boolean;
};

export const DEFAULT_COMPARE_STATE: CompareUrlState = {
  tab: 'diagram',
  left: 'latest',
  right: 'dev',
  diff: false,
};

export function isValidVersionParam(v: string | null | undefined): v is string {
  return v === 'dev' || v === 'latest' || (typeof v === 'string' && isSemver(v));
}

export function parseCompareUrlState(params: URLSearchParams): CompareUrlState {
  const tab = params.get('tab');
  const left = params.get('left');
  const right = params.get('right');
  const diff = params.get('diff');
  return {
    tab: isViewerTab(tab) ? tab : DEFAULT_COMPARE_STATE.tab,
    left: isValidVersionParam(left) ? left : DEFAULT_COMPARE_STATE.left,
    right: isValidVersionParam(right) ? right : DEFAULT_COMPARE_STATE.right,
    diff: diff === '1' || diff === 'true',
  };
}

/** Query-param pairs for `setUrlParams` (null removes the param). */
export function serializeCompareUrlState(state: CompareUrlState): Record<string, string | null> {
  return {
    tab: state.tab,
    left: state.left,
    right: state.right,
    diff: state.diff ? '1' : null,
  };
}

// ---------------------------------------------------------------------------
// Render config
// ---------------------------------------------------------------------------

export type RenderSettings = {
  /**
   * `undefined` = "not set": the key is left out of the config entirely, so the
   * diagram's frontmatter/directives and the mermaid version's own defaults
   * decide (older versions have different defaults and can break on new values).
   */
  theme?: string;
  layout?: string;
  look?: string;
  logLevel: string;
  useMaxWidth: boolean;
  ignoreCrossLaneEdges: boolean;
  optimizeRanksByCrossings: boolean;
};

// Diagram config sections that honour `useMaxWidth`.
const USE_MAX_WIDTH_SECTIONS = [
  'flowchart',
  'sequence',
  'gantt',
  'journey',
  'timeline',
  'class',
  'state',
  'er',
  'pie',
  'quadrantChart',
  'xyChart',
  'requirement',
  'mindmap',
  'kanban',
  'gitGraph',
  'c4',
  'sankey',
  'packet',
  'block',
  'architecture',
  'radar',
  'treemap',
];

/**
 * The mermaid.initialize() config the viewer renders with. Unset theme /
 * layout / look are omitted (never `undefined`). With `naturalSize`, every
 * diagram renders at its intrinsic size (no `useMaxWidth`) so two renders
 * overlay pixel for pixel.
 */
export function buildRenderConfig(
  s: RenderSettings,
  { naturalSize = false }: { naturalSize?: boolean } = {}
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    startOnLoad: false,
    securityLevel: 'strict',
    maxTextSize: DEV_MAX_TEXT_SIZE,
    maxEdges: DEV_MAX_EDGES,
    ...(s.theme ? { theme: s.theme } : {}),
    ...(s.layout ? { layout: s.layout } : {}),
    ...(s.look ? { look: s.look } : {}),
    logLevel: s.logLevel,
    flowchart: {
      useMaxWidth: naturalSize ? false : s.useMaxWidth,
      ignoreCrossLaneEdges: s.ignoreCrossLaneEdges,
      optimizeRanksByCrossings: s.optimizeRanksByCrossings,
    },
  };
  if (naturalSize) {
    for (const section of USE_MAX_WIDTH_SECTIONS) {
      if (section === 'flowchart') continue;
      config[section] = { useMaxWidth: false };
    }
  }
  return config;
}

const DARK_THEMES = new Set(['dark', 'neo-dark', 'redux-dark', 'redux-dark-color']);

export function isDarkTheme(theme: string | undefined): boolean {
  return theme !== undefined && DARK_THEMES.has(theme);
}

/** Canvas background behind the SVG — matches `.diagram-inner` in styles.css. */
export function compareBackground(theme: string | undefined): string {
  return isDarkTheme(theme) ? '#0b1020' : '#ffffff';
}

/**
 * The theme a render will most likely use, for UI purposes only (canvas
 * background): the selected one, else a `theme:` from the diagram's
 * frontmatter or init directive, else `undefined` (treated as light).
 */
export function effectiveTheme(theme: string | undefined, source: string): string | undefined {
  if (theme) return theme;
  const m = /["']?\btheme["']?\s*:\s*["']?([\w-]+)/.exec(source);
  return m?.[1];
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

/** One element of a key event's composed path. */
export type KeyPathEntry = { tag: string; classes?: string[]; editable?: boolean };

export type KeyEventDescriptor = {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  repeat: boolean;
  defaultPrevented: boolean;
  /** Composed path (innermost first), so shadow-DOM controls are seen. */
  path: KeyPathEntry[];
};

export type ShortcutAction = 'prev' | 'next' | 'toggle-diff';

// Elements that own their keystrokes. Buttons are deliberately absent, so the
// arrows keep working right after clicking Prev/Next. `sl-tab` covers the tab
// nav (arrows move between tabs); `sl-split-panel` moves its divider.
const KEY_OWNING_TAGS = new Set([
  'input',
  'textarea',
  'select',
  'sl-input',
  'sl-textarea',
  'sl-select',
  'sl-option',
  'sl-checkbox',
  'sl-switch',
  'sl-range',
  'sl-radio',
  'sl-radio-button',
  'sl-radio-group',
  'sl-rating',
  'sl-color-picker',
  'sl-menu',
  'sl-menu-item',
  'sl-dropdown',
  'sl-tree',
  'sl-tree-item',
  'sl-split-panel',
  'sl-tab',
  'dev-code-editor',
]);

function ownsKeystrokes(entry: KeyPathEntry): boolean {
  return (
    KEY_OWNING_TAGS.has(entry.tag) ||
    entry.editable === true ||
    (entry.classes?.includes('cm-editor') ?? false)
  );
}

/**
 * Which viewer shortcut (if any) a keydown should trigger: ←/→ step through
 * the folder's fixtures, D toggles the Compare diff (only on that tab).
 */
export function keyboardShortcutAction(
  e: KeyEventDescriptor,
  { compareTab = false }: { compareTab?: boolean } = {}
): ShortcutAction | null {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return null;
  if (e.repeat || e.defaultPrevented) return null;
  let action: ShortcutAction | null = null;
  if (e.key === 'ArrowLeft') action = 'prev';
  else if (e.key === 'ArrowRight') action = 'next';
  else if ((e.key === 'd' || e.key === 'D') && compareTab) action = 'toggle-diff';
  if (!action) return null;
  if (e.path.some(ownsKeystrokes)) return null;
  return action;
}
