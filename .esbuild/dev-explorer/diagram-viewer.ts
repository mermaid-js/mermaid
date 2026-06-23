import { LitElement, html, nothing } from 'lit';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/split-panel/split-panel.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

import './code-editor';
import './console-panel';
import type { LogEntry, LogLevel } from './console-panel';

type MermaidIife = {
  initialize: (config: Record<string, unknown>) => void | Promise<void>;
  render: (
    id: string,
    text: string,
    container?: Element
  ) => Promise<{ svg: string; bindFunctions?: (el: Element) => void }>;
};

type CapturedNodeSize = {
  id: string;
  width: number;
  height: number;
};

type CapturedSizesEntry = {
  svgId: string;
  sizes: {
    nodes: CapturedNodeSize[];
    metadata?: Record<string, unknown>;
  };
};

// Shape of the render profiler exposed by mermaid dev/profiling builds as
// `window.__mermaidProfiler` (see packages/mermaid/src/profiler.ts).
type ProfileSpanLike = { name: string; duration: number; children: ProfileSpanLike[] };
type ProfileRecordLike = {
  label: string;
  tree: ProfileSpanLike;
  buckets?: Record<string, number>;
};
type MermaidProfiler = {
  enabled: boolean;
  autoPrint: boolean;
  runLabel?: string;
  records: ProfileRecordLike[];
  enable: () => void;
  disable: () => void;
  clear: () => void;
};

declare global {
  interface Window {
    mermaid?: MermaidIife;
    mermaidReady?: Promise<MermaidIife>;
    mermaidCaptureSizes?: boolean;
    mermaidCapturedSizes?: CapturedSizesEntry[];
    mermaidLastCapturedSizes?: CapturedSizesEntry;
    __mermaidProfiler?: MermaidProfiler;
  }
}

function stringifyArgs(args: unknown[]) {
  // Mermaid's internal logger frequently uses console formatting like:
  //   console.log('%c...message...', 'color: lightgreen', ...)
  // For the log panel we want the human text, not the formatting tokens/styles.
  const normalized = [...args];
  if (typeof normalized[0] === 'string') {
    const fmt = normalized[0];
    const cssCount = (fmt.match(/%c/g) ?? []).length;
    if (cssCount > 0) {
      normalized[0] = fmt.replaceAll('%c', '');
      // Drop the corresponding CSS args that follow the format string.
      normalized.splice(1, cssCount);
    }
  }

  return normalized
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.stack ?? a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type MermaidTheme =
  | 'default'
  | 'dark'
  | 'forest'
  | 'neutral'
  | 'base'
  | 'redux'
  | 'redux-dark'
  | 'redux-color';
type MermaidLayout = 'dagre' | 'elk' | 'domus' | 'hola' | 'swimlane';
type MermaidLook = 'classic' | 'handDrawn' | 'neo';
type MermaidLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type ViewerTab = 'diagram' | 'code' | 'profile';

const ALL_LAYOUTS: MermaidLayout[] = ['dagre', 'elk', 'domus', 'hola', 'swimlane'];

// mermaid's `maxTextSize` (default 50_000) and `maxEdges` (default 500) are
// *secure* config keys, so they can't be raised from a diagram's frontmatter/
// directives — only via initialize(). The Dev Explorer is for testing large
// diagrams, so we set generous limits here.
const DEV_MAX_TEXT_SIZE = 50_000_000;
const DEV_MAX_EDGES = 1_000_000;

// Phases emitted by the profiler tree, in display order. "total" is taken from
// the root `render` span. See packages/mermaid/src/profiler.ts.
const PROFILE_PHASES = ['parse', 'prepare', 'measure', 'layout', 'paint', 'serialize'] as const;

// One render's normalized per-phase durations + total.
type RunSample = { total: number; phases: Record<string, number> };
// Trimmed-mean aggregate for one (diagram, layout) series.
type RunStats = { total: number; phases: Record<string, number>; samples: number };
// One diagram's result within a layout.
type DiagramResult = { diagram: string; stats: RunStats | null; failures: number };
// Aggregate for one layout across the whole diagram set.
type LayoutSetResult = {
  layout: string;
  perDiagram: DiagramResult[];
  /** Sum of per-diagram total render times — the headline score (lower is better). */
  score: number;
  /** Sum of per-diagram values for each phase. */
  phaseTotals: Record<string, number>;
  failures: number;
};

function findSpan(tree: ProfileSpanLike, name: string): ProfileSpanLike | undefined {
  if (tree.name === name) return tree;
  for (const child of tree.children) {
    const found = findSpan(child, name);
    if (found) return found;
  }
  return undefined;
}

// Resolve a phase's duration from a render tree, normalizing the measure/layout
// split so the columns are comparable across layouts. elk measures DOM node
// sizes in its measureLayout hook (the top-level "measure" span) and its layout
// span is pure algorithm. dagre instead supplies a no-op measure hook and sizes
// nodes inside its layout core, emitting a "measure" span nested in "layout". So:
//   measure = the hook span + any measure span nested inside layout
//   layout  = the layout span minus that nested measure (i.e. pure algorithm)
// Other phases are read directly.
function phaseDuration(tree: ProfileSpanLike, phase: string): number | undefined {
  if (phase === 'measure') {
    const hook = findSpan(tree, 'measure');
    const layoutSpan = findSpan(tree, 'layout');
    const inLayout = layoutSpan ? findSpan(layoutSpan, 'measure') : undefined;
    if (!hook && !inLayout) return undefined;
    return (hook?.duration ?? 0) + (inLayout && inLayout !== hook ? inLayout.duration : 0);
  }
  if (phase === 'layout') {
    const layoutSpan = findSpan(tree, 'layout');
    if (!layoutSpan) return undefined;
    const inLayout = findSpan(layoutSpan, 'measure');
    return layoutSpan.duration - (inLayout?.duration ?? 0);
  }
  return findSpan(tree, phase)?.duration;
}

// Time of the actual external library call (dagreLayout / elk.layout), captured
// as a "layoutCore" span inside the layout phase. The rest of "layout" is our
// own wrapper code (the part we can actually optimize).
function layoutLibDuration(tree: ProfileSpanLike): number | undefined {
  const layoutSpan = findSpan(tree, 'layout');
  if (!layoutSpan) return undefined;
  // The top-level external call is a DIRECT child of the layout span. dagre also
  // emits nested layoutCore spans for subgraphs (deeper, inside the measure
  // span); a depth-first search would wrongly grab one of those, so only look one
  // level down. (Nested subgraph layout time still lands in `measure` — the
  // documented recursion caveat.)
  return layoutSpan.children.find((c) => c.name === 'layoutCore')?.duration;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN;
}

// Normalize one render tree (+ flat buckets) to its per-phase durations + total.
function sampleFromTree(tree: ProfileSpanLike, buckets: Record<string, number> = {}): RunSample {
  const phases: Record<string, number> = {};
  for (const phase of PROFILE_PHASES) {
    const d = phaseDuration(tree, phase);
    if (typeof d === 'number') phases[phase] = d;
  }
  // Split the layout phase into the external library call vs. our wrapper.
  const lib = layoutLibDuration(tree);
  if (typeof lib === 'number') {
    phases.layoutLib = lib;
    if (typeof phases.layout === 'number') {
      phases.layoutOurs = Math.max(0, phases.layout - lib);
    }
  }
  // Flat accumulators summed across the render (e.g. getBBox, getBoundingClientRect).
  for (const [name, value] of Object.entries(buckets)) {
    if (typeof value === 'number') phases[name] = value;
  }
  return { total: tree.duration, phases };
}

// Aggregate a (diagram, layout) series: drop the single fastest and slowest run
// by total — discarding warmup/cold-start and any anomaly — then mean the rest.
function trimmedStats(samples: RunSample[]): RunStats | null {
  if (samples.length === 0) return null;
  let kept = samples;
  if (samples.length >= 3) {
    kept = [...samples].sort((a, b) => a.total - b.total).slice(1, -1);
  }
  const phases: Record<string, number> = {};
  // Aggregate every key any sample carries (phases + dynamic buckets like getBBox).
  const keys = new Set<string>();
  for (const s of kept) {
    for (const k of Object.keys(s.phases)) keys.add(k);
  }
  for (const phase of keys) {
    const vals = kept.map((k) => k.phases[phase]).filter((v): v is number => typeof v === 'number');
    if (vals.length) {
      phases[phase] = mean(vals);
    }
  }
  return { total: mean(kept.map((k) => k.total)), phases, samples: kept.length };
}

function fmtMs(n: number): string {
  return Number.isFinite(n) ? n.toFixed(1) : '–';
}

function baseName(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? path : path.slice(i + 1);
}

const DEFAULT_THEME: MermaidTheme = 'default';
const DEFAULT_LAYOUT: MermaidLayout = 'dagre';
const DEFAULT_LOOK: MermaidLook = 'classic';
const DEFAULT_MERMAID_LOG_LEVEL: MermaidLogLevel = 'warn';

function readUrlParam(name: string) {
  try {
    return new URL(window.location.href).searchParams.get(name);
  } catch {
    return null;
  }
}

function setUrlParams(pairs: Record<string, string | null | undefined>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(pairs)) {
    if (!v) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  history.replaceState(null, '', url);
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function isTheme(v: unknown): v is MermaidTheme {
  return (
    v === 'default' ||
    v === 'dark' ||
    v === 'forest' ||
    v === 'neutral' ||
    v === 'base' ||
    v === 'redux' ||
    v === 'redux-dark' ||
    v === 'redux-color'
  );
}

function isLayout(v: unknown): v is MermaidLayout {
  return v === 'dagre' || v === 'elk' || v === 'domus' || v === 'hola' || v === 'swimlane';
}

function isLook(v: unknown): v is MermaidLook {
  return v === 'classic' || v === 'handDrawn' || v === 'neo';
}

function isMermaidLogLevel(v: unknown): v is MermaidLogLevel {
  return (
    v === 'trace' || v === 'debug' || v === 'info' || v === 'warn' || v === 'error' || v === 'fatal'
  );
}

function normalizeLayout(v: unknown): MermaidLayout | null {
  // Back-compat:
  // - older UI used `renderer=dagre-d3|dagre-wrapper|elk`
  // - new UI uses `layout=dagre|elk|domus`
  if (v === 'dagre' || v === 'elk' || v === 'domus' || v === 'hola' || v === 'swimlane') return v;
  if (v === 'dagre-d3' || v === 'dagre-wrapper') return 'dagre';
  return null;
}

function sizeCaptureUnavailableReason(layout: MermaidLayout) {
  if (layout !== 'swimlane') {
    return 'No size data is available for this layout. Select swimlanes to capture DDLT sizes.';
  }
  return '';
}

function parseBoolean(v: unknown): boolean | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return null;
}

export class DevDiagramViewer extends LitElement {
  static properties = {
    filePath: { type: String },
    sseToken: { type: Number },
    theme: { state: true },
    layout: { state: true },
    look: { state: true },
    mermaidLogLevel: { state: true },
    useMaxWidth: { state: true },
    ignoreCrossLaneEdges: { state: true },
    optimizeRanksByCrossings: { state: true },
    loading: { state: true },
    error: { state: true },
    source: { state: true },
    savedSource: { state: true },
    editorSource: { state: true },
    svg: { state: true },
    splitPosition: { state: true },
    activeTab: { state: true },
    dirty: { state: true },
    saving: { state: true },
    saveMessage: { state: true },
    sizesSaving: { state: true },
    sizesMessage: { state: true },
    siblings: { state: true },
    profileScope: { state: true },
    profileLayouts: { state: true },
    profileIterations: { state: true },
    profileRunning: { state: true },
    profileProgress: { state: true },
    profileError: { state: true },
    profileResults: { state: true },
    profileCopyMsg: { state: true },
  };

  declare filePath: string;
  declare sseToken: number;
  declare theme: MermaidTheme;
  declare layout: MermaidLayout;
  declare look: MermaidLook;
  declare mermaidLogLevel: MermaidLogLevel;
  declare useMaxWidth: boolean;
  declare ignoreCrossLaneEdges: boolean;
  declare optimizeRanksByCrossings: boolean;
  declare loading: boolean;
  declare error: string;
  declare source: string;
  declare savedSource: string;
  declare editorSource: string;
  declare svg: string;
  declare splitPosition: number;
  declare activeTab: ViewerTab;
  declare dirty: boolean;
  declare saving: boolean;
  declare saveMessage: string;
  declare sizesSaving: boolean;
  declare sizesMessage: string;
  declare siblings: string[];
  declare profileScope: 'diagram' | 'folder';
  declare profileLayouts: MermaidLayout[];
  declare profileIterations: number;
  declare profileRunning: boolean;
  declare profileProgress: string;
  declare profileError: string;
  declare profileResults: LayoutSetResult[] | null;
  declare profileCopyMsg: string;

  #renderSeq = 0;
  #profileCancel = false;
  #consolePatched = false;
  #originalConsole?: {
    log: typeof console.log;
    info: typeof console.info;
    debug: typeof console.debug;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor() {
    super();
    const themeParam = readUrlParam('theme');
    const layoutParam = readUrlParam('layout');
    const lookParam = readUrlParam('look');
    const rendererParam = readUrlParam('renderer'); // legacy
    const logParam = readUrlParam('logLevel');
    const useMaxWidthParam = readUrlParam('useMaxWidth');
    const ignoreCrossLaneEdgesParam =
      readUrlParam('flowchart.ignoreCrossLaneEdges') ?? readUrlParam('ignoreCrossLaneEdges');
    const optimizeRanksByCrossingsParam =
      readUrlParam('flowchart.optimizeRanksByCrossings') ??
      readUrlParam('optimizeRanksByCrossings');

    const storedTheme = readStorage('devExplorer.viewer.theme');
    const storedLayout = readStorage('devExplorer.viewer.layout');
    const storedLook = readStorage('devExplorer.viewer.look');
    const storedRenderer = readStorage('devExplorer.viewer.renderer'); // legacy
    const storedLog = readStorage('devExplorer.viewer.logLevel');
    const storedUseMaxWidth = readStorage('devExplorer.viewer.useMaxWidth');
    const storedIgnoreCrossLaneEdges = readStorage('devExplorer.viewer.ignoreCrossLaneEdges');
    const storedOptimizeRanksByCrossings = readStorage(
      'devExplorer.viewer.optimizeRanksByCrossings'
    );
    const storedSplitPosition = readStorage('devExplorer.viewer.splitPosition');

    this.theme = isTheme(themeParam)
      ? themeParam
      : isTheme(storedTheme)
        ? storedTheme
        : DEFAULT_THEME;
    this.layout =
      normalizeLayout(layoutParam) ??
      normalizeLayout(rendererParam) ??
      normalizeLayout(storedLayout) ??
      normalizeLayout(storedRenderer) ??
      DEFAULT_LAYOUT;
    this.look = isLook(lookParam) ? lookParam : isLook(storedLook) ? storedLook : DEFAULT_LOOK;
    this.mermaidLogLevel = isMermaidLogLevel(logParam)
      ? logParam
      : isMermaidLogLevel(storedLog)
        ? storedLog
        : DEFAULT_MERMAID_LOG_LEVEL;

    this.useMaxWidth = parseBoolean(useMaxWidthParam) ?? parseBoolean(storedUseMaxWidth) ?? true;
    const parsedIgnoreCrossLaneEdges = parseBoolean(ignoreCrossLaneEdgesParam);
    const parsedOptimizeRanksByCrossings = parseBoolean(optimizeRanksByCrossingsParam);
    this.ignoreCrossLaneEdges =
      parsedIgnoreCrossLaneEdges ?? parseBoolean(storedIgnoreCrossLaneEdges) ?? true;
    this.optimizeRanksByCrossings =
      parsedOptimizeRanksByCrossings ??
      (parsedIgnoreCrossLaneEdges != null
        ? this.ignoreCrossLaneEdges
        : (parseBoolean(storedOptimizeRanksByCrossings) ?? this.ignoreCrossLaneEdges));
    this.splitPosition = storedSplitPosition ? Number(storedSplitPosition) : 75;

    this.filePath = '';
    this.sseToken = 0;
    this.loading = true;
    this.error = '';
    this.source = '';
    this.savedSource = '';
    this.editorSource = '';
    this.svg = '';
    this.activeTab = 'diagram';
    this.dirty = false;
    this.saving = false;
    this.saveMessage = '';
    this.sizesSaving = false;
    this.sizesMessage = '';
    this.siblings = [];

    const storedProfileLayouts = readStorage('devExplorer.viewer.profileLayouts');
    const parsedProfileLayouts = (storedProfileLayouts?.split(',') ?? []).filter(
      (v): v is MermaidLayout => isLayout(v)
    );
    this.profileLayouts = parsedProfileLayouts.length ? parsedProfileLayouts : ['dagre', 'elk'];
    this.profileScope =
      readStorage('devExplorer.viewer.profileScope') === 'folder' ? 'folder' : 'diagram';
    const storedIterations = Number(readStorage('devExplorer.viewer.profileIterations'));
    this.profileIterations =
      Number.isFinite(storedIterations) && storedIterations >= 1 ? storedIterations : 5;
    this.profileRunning = false;
    this.profileProgress = '';
    this.profileError = '';
    this.profileResults = null;
    this.profileCopyMsg = '';
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#installConsoleCapture();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#restoreConsoleCapture();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('filePath')) {
      void this.#loadAndRender();
      void this.#loadSiblings();
    } else if (changed.has('sseToken')) {
      // A file may have been added/removed in the folder — refresh siblings.
      void this.#loadSiblings();
      // On rebuild events, re-fetch + re-render the currently open diagram.
      if (!this.filePath) return;
      if (this.dirty) {
        this.saveMessage = 'File changed on disk; reload to discard local edits.';
        return;
      }
      void this.#loadAndRender();
    } else if (
      changed.has('theme') ||
      changed.has('layout') ||
      changed.has('look') ||
      changed.has('mermaidLogLevel') ||
      changed.has('useMaxWidth') ||
      changed.has('ignoreCrossLaneEdges') ||
      changed.has('optimizeRanksByCrossings')
    ) {
      // Re-render the currently loaded diagram with the new config without refetching.
      if (this.source) void this.#renderCurrentSource();
    }
  }

  #back() {
    this.dispatchEvent(new CustomEvent('back', { bubbles: true, composed: true }));
  }

  // Fetch the list of .mmd files in the current file's folder so Prev/Next can
  // step through them in the same order the explorer shows.
  async #loadSiblings() {
    if (!this.filePath) {
      this.siblings = [];
      return;
    }
    const idx = this.filePath.lastIndexOf('/');
    const dir = idx === -1 ? '' : this.filePath.slice(0, idx);
    try {
      const url = new URL('/dev/api/files', window.location.origin);
      if (dir) url.searchParams.set('path', dir);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { entries?: { kind: string; path: string }[] };
      this.siblings = (json.entries ?? []).filter((e) => e.kind === 'file').map((e) => e.path);
    } catch {
      this.siblings = [];
    }
  }

  get #siblingIndex() {
    return this.siblings.indexOf(this.filePath);
  }

  #go(delta: number) {
    const idx = this.#siblingIndex;
    if (idx === -1) return;
    const target = this.siblings[idx + delta];
    if (!target) return;
    if (this.dirty && !window.confirm('Discard unsaved changes and switch diagrams?')) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent('open-file', { detail: { path: target }, bubbles: true, composed: true })
    );
  }

  #persistSettings() {
    writeStorage('devExplorer.viewer.theme', this.theme);
    writeStorage('devExplorer.viewer.layout', this.layout);
    writeStorage('devExplorer.viewer.look', this.look);
    writeStorage('devExplorer.viewer.logLevel', this.mermaidLogLevel);
    writeStorage('devExplorer.viewer.useMaxWidth', String(this.useMaxWidth));
    writeStorage('devExplorer.viewer.ignoreCrossLaneEdges', String(this.ignoreCrossLaneEdges));
    writeStorage(
      'devExplorer.viewer.optimizeRanksByCrossings',
      String(this.optimizeRanksByCrossings)
    );
    setUrlParams({
      theme: this.theme,
      layout: this.layout,
      look: this.look,
      renderer: null, // drop legacy param
      logLevel: this.mermaidLogLevel,
      useMaxWidth: this.useMaxWidth ? '1' : '0',
      'flowchart.ignoreCrossLaneEdges': this.ignoreCrossLaneEdges ? '1' : '0',
      'flowchart.optimizeRanksByCrossings': this.optimizeRanksByCrossings ? '1' : '0',
      ignoreCrossLaneEdges: null, // drop legacy/convenience alias
      optimizeRanksByCrossings: null, // drop legacy/convenience alias
    });
  }

  #persistSplitPosition() {
    writeStorage('devExplorer.viewer.splitPosition', String(this.splitPosition));
  }

  #setActiveTab(tab: ViewerTab) {
    this.activeTab = tab;
    if (tab === 'code') {
      void this.updateComplete.then(() => {
        const editor = this.querySelector('dev-code-editor') as any;
        editor?.requestMeasure?.();
      });
    }
  }

  #syncConsolePanelFilters() {
    const panel = this.querySelector('dev-console-panel') as any;
    if (!panel) return;
    // This is intentionally opinionated: less noise by default as logLevel increases.
    if (
      this.mermaidLogLevel === 'trace' ||
      this.mermaidLogLevel === 'debug' ||
      this.mermaidLogLevel === 'info'
    ) {
      panel.showInfo = true;
      panel.showWarn = true;
      panel.showError = true;
      return;
    }
    if (this.mermaidLogLevel === 'warn') {
      panel.showInfo = false;
      panel.showWarn = true;
      panel.showError = true;
      return;
    }
    // error / fatal
    panel.showInfo = false;
    panel.showWarn = false;
    panel.showError = true;
  }

  #appendLog(entry: LogEntry) {
    const panel = this.querySelector('dev-console-panel') as any;
    panel?.append?.(entry);
  }

  #installConsoleCapture() {
    if (this.#consolePatched) return;
    this.#consolePatched = true;

    this.#originalConsole = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error,
    };

    const capture = (level: LogLevel, args: unknown[]) => {
      this.#appendLog({
        ts: Date.now(),
        level,
        message: stringifyArgs(args),
      });
    };

    // Mermaid uses its own logger which routes to console.info/debug/warn/error.
    // Capture those too (map debug/info/log -> panel "info").
    console.log = (...args) => {
      capture('info', args);
      this.#originalConsole!.log.apply(console, args as any);
    };
    console.info = (...args) => {
      capture('info', args);
      this.#originalConsole!.info.apply(console, args as any);
    };
    console.debug = (...args) => {
      capture('info', args);
      this.#originalConsole!.debug.apply(console, args as any);
    };
    console.warn = (...args) => {
      capture('warn', args);
      this.#originalConsole!.warn.apply(console, args as any);
    };
    console.error = (...args) => {
      capture('error', args);
      this.#originalConsole!.error.apply(console, args as any);
    };
  }

  #restoreConsoleCapture() {
    if (!this.#consolePatched) return;
    this.#consolePatched = false;
    if (!this.#originalConsole) return;
    console.log = this.#originalConsole.log;
    console.info = this.#originalConsole.info;
    console.debug = this.#originalConsole.debug;
    console.warn = this.#originalConsole.warn;
    console.error = this.#originalConsole.error;
    this.#originalConsole = undefined;
  }

  #clearLogs() {
    const panel = this.querySelector('dev-console-panel') as any;
    panel?.clear?.();
  }

  async #fetchSourceFor(path: string) {
    const url = new URL('/dev/api/file', window.location.origin);
    url.searchParams.set('path', path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  }

  async #fetchSource() {
    return this.#fetchSourceFor(this.filePath);
  }

  async #saveSource() {
    if (!this.filePath || this.saving) return false;
    if (!this.dirty) return true;

    this.saving = true;
    this.error = '';
    this.saveMessage = '';
    try {
      const nextSource = this.editorSource;
      const url = new URL('/dev/api/file', window.location.origin);
      url.searchParams.set('path', this.filePath);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: nextSource,
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `HTTP ${res.status}`);
      }

      this.savedSource = nextSource;
      this.source = nextSource;
      this.dirty = false;
      this.saveMessage = `Saved ${new Date().toLocaleTimeString(undefined, { hour12: false })}`;
      return await this.#renderCurrentSource();
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      this.saveMessage = 'Save failed.';
      return false;
    } finally {
      this.saving = false;
    }
  }

  async #saveSizes() {
    if (!this.filePath || this.sizesSaving) return;

    const unavailableReason = sizeCaptureUnavailableReason(this.layout);
    if (unavailableReason) {
      this.sizesMessage = 'size data unavailable';
      this.error = unavailableReason;
      return;
    }

    this.sizesSaving = true;
    this.error = '';
    this.sizesMessage = this.dirty ? 'saving diagram...' : 'capturing sizes...';

    const previousCaptureFlag = Boolean(window.mermaidCaptureSizes);
    const previousLastCapture = window.mermaidLastCapturedSizes;

    try {
      if (this.dirty) {
        const saved = await this.#saveSource();
        if (!saved) {
          this.sizesMessage = 'save diagram failed';
          return;
        }
      }

      window.mermaidLastCapturedSizes = undefined;
      window.mermaidCaptureSizes = true;
      this.sizesMessage = 'capturing sizes...';

      const rendered = await this.#renderCurrentSource();
      if (!rendered) {
        throw new Error(this.error || 'Could not render diagram for size capture');
      }

      const captured = window.mermaidLastCapturedSizes;
      const nodes = captured?.sizes.nodes ?? [];
      if (nodes.length === 0) {
        throw new Error('Mermaid did not capture any node sizes; select a capture-enabled layout');
      }

      this.sizesMessage = 'saving sizes...';
      const res = await fetch('/dev/api/sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.filePath,
          nodes,
          capturedFrom: `dev-explorer ${this.filePath} theme=${this.theme} look=${this.look} layout=${this.layout}`,
        }),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { path?: string; nodes?: number };
      this.sizesMessage = `sizes saved${json.nodes ? ` (${json.nodes})` : ''}`;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      this.sizesMessage = 'size save failed';
    } finally {
      window.mermaidCaptureSizes = previousCaptureFlag;
      if (!window.mermaidLastCapturedSizes) {
        window.mermaidLastCapturedSizes = previousLastCapture;
      }
      this.sizesSaving = false;
    }
  }

  #handleEditorChange(value: string) {
    this.editorSource = value;
    this.dirty = value !== this.savedSource;
    if (this.dirty) {
      this.saveMessage = '';
      this.sizesMessage = '';
    }
  }

  async #loadAndRender() {
    const seq = ++this.#renderSeq;
    this.loading = true;
    this.error = '';
    this.svg = '';
    this.#clearLogs();
    this.#syncConsolePanelFilters();

    try {
      const source = await this.#fetchSource();
      if (seq !== this.#renderSeq) return;
      this.source = source;
      this.savedSource = source;
      this.editorSource = source;
      this.dirty = false;
      this.saveMessage = '';
      this.sizesMessage = '';
      await this.#renderMermaid(source);
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
  }

  async #renderCurrentSource() {
    const seq = ++this.#renderSeq;
    this.loading = true;
    this.error = '';
    this.svg = '';
    this.#clearLogs();
    this.#syncConsolePanelFilters();
    try {
      const source = this.source;
      if (!source) return false;
      if (seq !== this.#renderSeq) return false;
      await this.#renderMermaid(source);
      return true;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      return false;
    } finally {
      this.loading = false;
    }
  }

  #toggleProfileLayout(layout: MermaidLayout, checked: boolean) {
    const next = checked
      ? [...new Set([...this.profileLayouts, layout])]
      : this.profileLayouts.filter((l) => l !== layout);
    // Keep canonical order so the comparison columns are stable.
    this.profileLayouts = ALL_LAYOUTS.filter((l) => next.includes(l));
    writeStorage('devExplorer.viewer.profileLayouts', this.profileLayouts.join(','));
  }

  #setProfileIterations(value: number) {
    const clamped = Math.max(1, Math.min(50, Math.round(value) || 1));
    this.profileIterations = clamped;
    writeStorage('devExplorer.viewer.profileIterations', String(clamped));
  }

  #setProfileScope(scope: string) {
    const next = scope === 'folder' ? 'folder' : 'diagram';
    this.profileScope = next;
    writeStorage('devExplorer.viewer.profileScope', next);
  }

  #cancelProfile() {
    this.#profileCancel = true;
  }

  // Serializable snapshot of the last run, for tracking improvements across runs.
  #profileResultsJson() {
    const round1 = (n: number) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : null);
    const roundMap = (m: Record<string, number>) =>
      Object.fromEntries(Object.entries(m).map(([k, v]) => [k, round1(v)]));
    return {
      capturedAt: new Date().toISOString(),
      scope: this.profileScope,
      iterations: this.profileIterations,
      aggregation: 'mean of runs after dropping the fastest and slowest; warmup discarded',
      theme: this.theme,
      look: this.look,
      phases: [...PROFILE_PHASES],
      layouts: (this.profileResults ?? []).map((r) => ({
        layout: r.layout,
        score: round1(r.score),
        phaseTotals: roundMap(r.phaseTotals),
        failures: r.failures,
        perDiagram: r.perDiagram.map((d) => ({
          diagram: d.diagram,
          total: d.stats ? round1(d.stats.total) : null,
          phases: d.stats ? roundMap(d.stats.phases) : null,
          samples: d.stats?.samples ?? 0,
          failures: d.failures,
        })),
      })),
    };
  }

  async #copyProfileJson() {
    const json = JSON.stringify(this.#profileResultsJson(), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      this.profileCopyMsg = 'Copied ✓';
    } catch {
      // Clipboard can be blocked (focus/permissions); fall back to the console.
      console.log('[dev-explorer] profile results JSON:\n' + json);
      this.profileCopyMsg = 'Clipboard blocked — logged to console';
    }
    setTimeout(() => {
      this.profileCopyMsg = '';
    }, 2500);
  }

  #profileInitConfig(layout: MermaidLayout) {
    return {
      startOnLoad: false,
      securityLevel: 'strict',
      maxTextSize: DEV_MAX_TEXT_SIZE,
      maxEdges: DEV_MAX_EDGES,
      theme: this.theme,
      layout,
      look: this.look,
      // Quiet the logger during the batch so the console panel stays readable.
      logLevel: 'error',
      flowchart: {
        useMaxWidth: this.useMaxWidth,
        ignoreCrossLaneEdges: this.ignoreCrossLaneEdges,
        optimizeRanksByCrossings: this.optimizeRanksByCrossings,
      },
    };
  }

  // Resolve the set of diagrams to profile: just the current file, or every
  // sibling .mmd in the current folder. Sources are fetched up front so a slow
  // fetch never lands inside a timed render.
  async #resolveProfileDiagrams(): Promise<{ path: string; source: string }[]> {
    if (this.profileScope === 'folder') {
      const paths = this.siblings.length ? this.siblings : this.filePath ? [this.filePath] : [];
      const diagrams: { path: string; source: string }[] = [];
      for (const path of paths) {
        try {
          diagrams.push({ path, source: await this.#fetchSourceFor(path) });
        } catch {
          // Skip unreadable files rather than aborting the whole run.
        }
      }
      return diagrams;
    }
    return this.source ? [{ path: this.filePath || '(current)', source: this.source }] : [];
  }

  /**
   * Benchmark the selected diagram set across the selected layouts and produce a
   * per-layout score (total render time, lower is better) so improvements are
   * trackable run-to-run.
   *
   * Renders run sequentially (the profiler has a single phase stack and parallel
   * renders would contend on the main thread). Each layout is warmed up once
   * (untimed) to absorb the one-time dynamic layout-loader import, and each
   * (diagram, layout) series drops its fastest and slowest run before averaging.
   */
  async #runProfile() {
    if (this.profileRunning) return;

    const profiler = window.__mermaidProfiler;
    if (!profiler) {
      this.profileError =
        'Profiling is not available in this build. Restart the dev server (`pnpm dev`) — it compiles mermaid with profiling enabled.';
      return;
    }
    const m = (await window.mermaidReady?.catch(() => undefined)) ?? window.mermaid;
    if (!m) {
      this.profileError = 'window.mermaid is not available.';
      return;
    }

    const layouts = this.profileLayouts.length ? this.profileLayouts : [this.layout];
    const iterations = Math.max(1, Math.min(50, Math.round(this.profileIterations) || 1));

    this.profileError = '';
    this.profileResults = null;
    this.profileRunning = true;
    this.#profileCancel = false;

    const diagrams = await this.#resolveProfileDiagrams();
    if (diagrams.length === 0) {
      this.profileError = 'No diagrams to profile.';
      this.profileRunning = false;
      return;
    }

    const prevEnabled = profiler.enabled;
    const prevAutoPrint = profiler.autoPrint;
    profiler.enable();
    // Suppress the per-render console summary during a batch; we render our own table.
    profiler.autoPrint = false;

    const results: LayoutSetResult[] = [];

    try {
      // Warmup: load each layout module + JIT once, untimed and discarded, so the
      // one-time dynamic import doesn't inflate the first measured render.
      this.profileProgress = 'warming up…';
      await this.updateComplete;
      for (const layout of layouts) {
        try {
          await m.initialize(this.#profileInitConfig(layout));
          await m.render(`dev-profile-warmup-${layout}`, diagrams[0].source);
        } catch {
          // A layout that can't render the first diagram is reported per-run below.
        }
      }

      const totalUnits = layouts.length * diagrams.length;
      let unit = 0;
      for (const layout of layouts) {
        const perDiagram: DiagramResult[] = [];
        for (const diagram of diagrams) {
          if (this.#profileCancel) break;
          unit++;
          await m.initialize(this.#profileInitConfig(layout));
          profiler.clear();
          let failures = 0;
          for (let i = 0; i < iterations; i++) {
            if (this.#profileCancel) break;
            this.profileProgress = `${layout} · ${baseName(diagram.path)} · ${i + 1}/${iterations} (${unit}/${totalUnits})`;
            // Let Lit flush the progress label before the (potentially long) render.
            await this.updateComplete;
            profiler.runLabel = layout;
            const id = `dev-profile-${unit}-${i}-${Math.random().toString(16).slice(2)}`;
            try {
              await m.render(id, diagram.source);
            } catch (e) {
              failures++;
              console.error(
                `[dev-explorer] profile render failed for layout=${layout} ${diagram.path}:`,
                e
              );
            }
          }
          const samples = profiler.records.map((r) => sampleFromTree(r.tree, r.buckets));
          perDiagram.push({ diagram: diagram.path, stats: trimmedStats(samples), failures });
        }

        const measured = perDiagram.filter((d) => d.stats);
        const phaseTotals: Record<string, number> = {};
        const phaseKeys = new Set<string>();
        for (const d of measured) {
          for (const k of Object.keys(d.stats?.phases ?? {})) phaseKeys.add(k);
        }
        for (const phase of phaseKeys) {
          phaseTotals[phase] = measured.reduce((s, d) => s + (d.stats?.phases[phase] ?? 0), 0);
        }
        results.push({
          layout,
          perDiagram,
          score: measured.reduce((s, d) => s + (d.stats?.total ?? 0), 0),
          phaseTotals,
          failures: perDiagram.reduce((s, d) => s + d.failures, 0),
        });
        if (this.#profileCancel) break;
      }

      this.profileResults = results;
    } catch (e) {
      this.profileError = e instanceof Error ? e.message : String(e);
    } finally {
      profiler.autoPrint = prevAutoPrint;
      if (!prevEnabled) profiler.disable();
      this.profileRunning = false;
      this.profileProgress = '';
    }
  }

  async #renderMermaid(text: string) {
    const m = (await window.mermaidReady?.catch(() => undefined)) ?? window.mermaid;
    if (!m) {
      throw new Error(
        'window.mermaid is not available (did /mermaid.esm.mjs load and did the bootstrap set window.mermaid?)'
      );
    }

    const initConfig = {
      startOnLoad: false,
      securityLevel: 'strict',
      maxTextSize: DEV_MAX_TEXT_SIZE,
      maxEdges: DEV_MAX_EDGES,
      theme: this.theme,
      layout: this.layout,
      look: this.look,
      logLevel: this.mermaidLogLevel,
      flowchart: {
        useMaxWidth: this.useMaxWidth,
        ignoreCrossLaneEdges: this.ignoreCrossLaneEdges,
        optimizeRanksByCrossings: this.optimizeRanksByCrossings,
      },
    };

    // Debugging aid: log exactly what we are about to initialize/render with.
    // Do it *before* initialize so detector issues can be correlated.
    const previewLimit = 4000;
    const preview =
      text.length > previewLimit
        ? `${text.slice(0, previewLimit)}\n… (${text.length - previewLimit} more chars)`
        : text;
    console.log('[dev-explorer] mermaid.initialize config:', initConfig);
    console.log('[dev-explorer] diagram source preview:\n' + preview);

    // Keep it deterministic-ish between reloads.
    await m.initialize(initConfig);

    const id = `dev-explorer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { svg, bindFunctions } = await m.render(id, text);
    this.svg = svg;
    // Allow mermaid to attach event handlers (e.g. links).
    await this.updateComplete;
    // If the page ever ended up scrolled down due to a previous oversized render, snap back to top.
    // (We intentionally removed vertical scrollbars in the viewer.)
    try {
      window.scrollTo(0, 0);
    } catch {
      // ignore
    }
    const container = this.querySelector('.diagram-inner');
    if (container && bindFunctions) bindFunctions(container);
  }

  render() {
    const saveStatus = this.saving
      ? 'saving...'
      : this.dirty
        ? 'unsaved changes'
        : this.saveMessage || 'saved';
    const sizesStatus = this.sizesSaving
      ? this.sizesMessage || 'saving sizes...'
      : this.sizesMessage;
    const sizesUnavailableReason = sizeCaptureUnavailableReason(this.layout);
    const saveSizesDisabled =
      this.loading || this.saving || this.sizesSaving || Boolean(sizesUnavailableReason);

    return html`
      <div class="header">
        <sl-button size="small" variant="default" @click=${() => this.#back()}>
          <sl-icon slot="prefix" name="arrow-left"></sl-icon>
          Back
        </sl-button>
        <sl-button-group label="Diagram navigation">
          <sl-button
            size="small"
            variant="default"
            ?disabled=${this.#siblingIndex <= 0}
            title="Previous diagram in folder"
            @click=${() => this.#go(-1)}
          >
            <sl-icon slot="prefix" name="chevron-left"></sl-icon>
            Prev
          </sl-button>
          <sl-button
            size="small"
            variant="default"
            ?disabled=${this.#siblingIndex === -1 || this.#siblingIndex >= this.siblings.length - 1}
            title="Next diagram in folder"
            @click=${() => this.#go(1)}
          >
            Next
            <sl-icon slot="suffix" name="chevron-right"></sl-icon>
          </sl-button>
        </sl-button-group>
        <div style="min-width: 0;">
          <div class="title">
            Diagram
            ${this.#siblingIndex >= 0 && this.siblings.length > 0
              ? html`<span class="subtle"
                  >(${this.#siblingIndex + 1}/${this.siblings.length})</span
                >`
              : nothing}
          </div>
          <div class="path">${this.filePath}</div>
        </div>
        <div class="spacer"></div>
        <div class="viewer-controls">
          <div class="control">
            <span class="label">Theme</span>
            <sl-select
              size="small"
              value=${this.theme}
              @sl-change=${(e: any) => {
                const v = e.target?.value;
                if (isTheme(v)) {
                  this.theme = v;
                  this.#persistSettings();
                }
              }}
            >
              <sl-option value="default">default</sl-option>
              <sl-option value="dark">dark</sl-option>
              <sl-option value="forest">forest</sl-option>
              <sl-option value="neutral">neutral</sl-option>
              <sl-option value="base">base</sl-option>
              <sl-option value="redux">redux</sl-option>
              <sl-option value="redux-dark">redux-dark</sl-option>
              <sl-option value="redux-color">redux-color</sl-option>
            </sl-select>
          </div>

          <div class="control">
            <span class="label">Layout</span>
            <sl-select
              size="small"
              value=${this.layout}
              @sl-change=${(e: any) => {
                const v = e.target?.value;
                if (isLayout(v)) {
                  this.layout = v;
                  this.#persistSettings();
                }
              }}
            >
              <sl-option value="dagre">dagre</sl-option>
              <sl-option value="elk">elk</sl-option>
              <sl-option value="domus">domus</sl-option>
              <sl-option value="hola">hola</sl-option>
              <sl-option value="swimlane">swimlane</sl-option>
            </sl-select>
          </div>

          <div class="control">
            <span class="label">Look</span>
            <sl-select
              size="small"
              value=${this.look}
              @sl-change=${(e: any) => {
                const v = e.target?.value;
                if (isLook(v)) {
                  this.look = v;
                  this.#persistSettings();
                }
              }}
            >
              <sl-option value="classic">classic</sl-option>
              <sl-option value="handDrawn">handdrawn</sl-option>
              <sl-option value="neo">neo</sl-option>
            </sl-select>
          </div>

          <div class="control">
            <span class="label">Log</span>
            <sl-select
              size="small"
              value=${this.mermaidLogLevel}
              @sl-change=${(e: any) => {
                const v = e.target?.value;
                if (isMermaidLogLevel(v)) {
                  this.mermaidLogLevel = v;
                  this.#persistSettings();
                  this.#syncConsolePanelFilters();
                }
              }}
            >
              <sl-option value="trace">trace</sl-option>
              <sl-option value="debug">debug</sl-option>
              <sl-option value="info">info</sl-option>
              <sl-option value="warn">warn</sl-option>
              <sl-option value="error">error</sl-option>
              <sl-option value="fatal">fatal</sl-option>
            </sl-select>
          </div>
        </div>
        ${this.loading ? html`<div class="subtle">rendering…</div>` : nothing}
      </div>

      ${this.error
        ? html`<div class="empty">Error: <span class="path">${this.error}</span></div>`
        : nothing}

      <div class="content">
        <sl-tab-group
          class="viewer-tabs"
          active-tab=${this.activeTab}
          @sl-tab-show=${(e: any) => {
            const name = e.detail?.name;
            if (name === 'diagram' || name === 'code' || name === 'profile') {
              this.#setActiveTab(name);
            }
          }}
        >
          <sl-tab slot="nav" panel="diagram">
            <sl-icon name="diagram-3"></sl-icon>
            Diagram
          </sl-tab>
          <sl-tab slot="nav" panel="code">
            <sl-icon name="file-earmark-code"></sl-icon>
            Code
          </sl-tab>
          <sl-tab slot="nav" panel="profile">
            <sl-icon name="speedometer2"></sl-icon>
            Profile
          </sl-tab>

          <sl-tab-panel name="diagram">
            <sl-split-panel
              position=${this.splitPosition}
              style="height: 100%;"
              @sl-reposition=${(e: any) => {
                this.splitPosition = e.target?.position ?? 75;
                this.#persistSplitPosition();
              }}
            >
              <div slot="start" class="diagram">
                <div class="diagram-inner" data-theme=${this.theme} .innerHTML=${this.svg}></div>
              </div>
              <div slot="end" style="height: 100%;">
                <dev-console-panel></dev-console-panel>
              </div>
            </sl-split-panel>
          </sl-tab-panel>

          <sl-tab-panel name="code">
            <div class="code-pane">
              <div class="code-toolbar">
                <div class="path">${this.filePath}</div>
                <div class="spacer"></div>
                <div class="subtle">${saveStatus}</div>
                ${sizesStatus ? html`<div class="subtle">${sizesStatus}</div>` : nothing}
                <sl-button
                  size="small"
                  variant="primary"
                  ?disabled=${!this.dirty || this.saving || this.sizesSaving}
                  @click=${() => void this.#saveSource()}
                >
                  <sl-icon slot="prefix" name="floppy"></sl-icon>
                  Save
                </sl-button>
                <sl-tooltip
                  content=${sizesUnavailableReason}
                  ?disabled=${!sizesUnavailableReason}
                  hoist
                >
                  <span class="tooltip-target">
                    <sl-button
                      size="small"
                      variant="default"
                      ?disabled=${saveSizesDisabled}
                      @click=${() => void this.#saveSizes()}
                    >
                      <sl-icon slot="prefix" name="rulers"></sl-icon>
                      Save sizes
                    </sl-button>
                  </span>
                </sl-tooltip>
              </div>
              <dev-code-editor
                .value=${this.editorSource}
                @code-change=${(e: CustomEvent<{ value: string }>) =>
                  this.#handleEditorChange(e.detail.value)}
                @save-code=${() => void this.#saveSource()}
              ></dev-code-editor>
            </div>
          </sl-tab-panel>

          <sl-tab-panel name="profile">${this.#renderProfilePanel()}</sl-tab-panel>
        </sl-tab-group>
      </div>
    `;
  }

  #renderProfilePanel() {
    // cspell:ignore nums
    return html`
      <div class="profile-pane">
        <style>
          .profile-pane {
            padding: 12px;
            height: 100%;
            overflow: auto;
          }
          .profile-controls {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 14px;
            margin-bottom: 14px;
          }
          .profile-layouts {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
          }
          .profile-iter {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .profile-iter input {
            width: 64px;
            padding: 3px 6px;
            background: var(--sl-input-background-color, #222);
            color: inherit;
            border: 1px solid var(--sl-color-neutral-300, #555);
            border-radius: 4px;
          }
          .profile-table {
            border-collapse: collapse;
            font-variant-numeric: tabular-nums;
            font-size: 13px;
          }
          .profile-table th,
          .profile-table td {
            padding: 4px 14px;
            text-align: right;
            border-bottom: 1px solid var(--sl-color-neutral-200, #3a3a3a);
            white-space: nowrap;
          }
          .profile-table th.phase,
          .profile-table td.phase {
            text-align: left;
            color: var(--sl-color-neutral-600, #aaa);
          }
          .profile-table tr.total td,
          .profile-table tr.total th {
            font-weight: 600;
            border-top: 2px solid var(--sl-color-neutral-300, #555);
          }
          .profile-table td.best {
            color: var(--sl-color-success-600, #4ade80);
          }
          .profile-min {
            color: var(--sl-color-neutral-500, #888);
            font-size: 11px;
            margin-left: 6px;
          }
          .profile-fail {
            color: var(--sl-color-warning-600, #fbbf24);
          }
          .profile-meta {
            color: var(--sl-color-neutral-500, #888);
            font-size: 12px;
            margin: 10px 0 4px;
          }
          .profile-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 4px 0 8px;
          }
          .profile-table tr.sub-row th.phase {
            padding-left: 30px;
            font-weight: 400;
            color: var(--sl-color-neutral-500, #888);
          }
          .profile-table tr.sub-row td {
            color: var(--sl-color-neutral-500, #888);
          }
        </style>

        <div class="profile-controls">
          <div class="profile-iter">
            <span class="label">Scope</span>
            <sl-select
              size="small"
              value=${this.profileScope}
              ?disabled=${this.profileRunning}
              @sl-change=${(e: any) => this.#setProfileScope(e.target?.value)}
            >
              <sl-option value="diagram">This diagram</sl-option>
              <sl-option value="folder">Folder (${this.siblings.length || 1})</sl-option>
            </sl-select>
          </div>
          <div class="profile-layouts">
            <span class="label">Layouts</span>
            ${ALL_LAYOUTS.map(
              (layout) => html`
                <sl-checkbox
                  size="small"
                  ?checked=${this.profileLayouts.includes(layout)}
                  ?disabled=${this.profileRunning}
                  @sl-change=${(e: any) =>
                    this.#toggleProfileLayout(layout, Boolean(e.target?.checked))}
                  >${layout}</sl-checkbox
                >
              `
            )}
          </div>
          <div class="profile-iter">
            <span class="label">Iterations</span>
            <input
              type="number"
              min="1"
              max="50"
              .value=${String(this.profileIterations)}
              ?disabled=${this.profileRunning}
              @change=${(e: any) => this.#setProfileIterations(Number(e.target?.value))}
            />
          </div>
          <sl-button
            size="small"
            variant="primary"
            ?loading=${this.profileRunning}
            ?disabled=${this.profileRunning ||
            this.profileLayouts.length === 0 ||
            (this.profileScope === 'diagram' && !this.source)}
            @click=${() => void this.#runProfile()}
          >
            <sl-icon slot="prefix" name="stopwatch"></sl-icon>
            Run profile
          </sl-button>
          ${this.profileRunning
            ? html`
                <sl-button size="small" variant="default" @click=${() => this.#cancelProfile()}>
                  Stop
                </sl-button>
                <span class="subtle">${this.profileProgress}</span>
              `
            : nothing}
        </div>

        ${this.profileError
          ? html`<div class="empty">Error: <span class="path">${this.profileError}</span></div>`
          : nothing}
        ${this.profileResults?.length
          ? html`
              <div class="profile-actions">
                <sl-button
                  size="small"
                  variant="default"
                  ?disabled=${this.profileRunning}
                  @click=${() => void this.#copyProfileJson()}
                >
                  <sl-icon slot="prefix" name="clipboard"></sl-icon>
                  Copy JSON
                </sl-button>
                ${this.profileCopyMsg
                  ? html`<span class="subtle">${this.profileCopyMsg}</span>`
                  : nothing}
              </div>
              ${this.#renderProfileTable(this.profileResults)}
            `
          : !this.profileRunning && !this.profileError
            ? html`<div class="subtle">
                Pick layouts and a scope, then “Run profile”. Each
                ${this.profileScope === 'folder' ? 'diagram in the folder' : 'run'} renders
                ${this.profileIterations}× per layout; the fastest and slowest runs are dropped and
                the rest averaged. The score is total render time across the set (lower is better),
                so you can track optimizations.
              </div>`
            : nothing}
      </div>
    `;
  }

  #renderProfileTable(results: LayoutSetResult[]) {
    const scores = results.map((r) => r.score).filter((v) => Number.isFinite(v) && v > 0);
    const bestScore = scores.length ? Math.min(...scores) : NaN;
    // All layouts share the same diagram order; use the longest list in case a
    // run was cancelled mid-layout.
    const diagrams =
      results.reduce<DiagramResult[]>(
        (best, r) => (r.perDiagram.length > best.length ? r.perDiagram : best),
        []
      ) ?? [];
    const multi = diagrams.length > 1;

    return html`
      <div class="profile-meta">
        ${multi ? `${diagrams.length} diagrams` : diagrams[0] ? baseName(diagrams[0].diagram) : ''}
        · warmup + drop fastest &amp; slowest · score = total ms (lower is better)
      </div>
      <table class="profile-table">
        <thead>
          <tr>
            <th class="phase">phase</th>
            ${results.map(
              (r) =>
                html`<th>
                  ${r.layout}${r.failures
                    ? html`<span class="profile-fail"> ⚠${r.failures}</span>`
                    : nothing}
                </th>`
            )}
          </tr>
        </thead>
        <tbody>
          ${PROFILE_PHASES.flatMap((phase) => {
            const row = html`
              <tr>
                <th class="phase">${phase}</th>
                ${results.map((r) => html`<td>${fmtMs(r.phaseTotals[phase])}</td>`)}
              </tr>
            `;
            const subRow = (label: string, key: string) => html`
              <tr class="sub-row">
                <th class="phase">${label}</th>
                ${results.map((r) => {
                  const v = r.phaseTotals[key];
                  return html`<td>${v > 0 ? fmtMs(v) : '–'}</td>`;
                })}
              </tr>
            `;
            // Break "layout" into the external library call vs. our wrapper, and
            // "measure" into the DOM reflow queries (getBBox / getBoundingClientRect).
            if (phase === 'layout') {
              return [
                row,
                subRow('↳ lib (external)', 'layoutLib'),
                subRow('↳ ours (wrapper)', 'layoutOurs'),
              ];
            }
            if (phase === 'measure') {
              return [
                row,
                subRow('↳ getBBox', 'getBBox'),
                subRow('↳ getBoundingClientRect', 'getBoundingClientRect'),
              ];
            }
            return [row];
          })}
          <tr class="total">
            <th class="phase">score</th>
            ${results.map((r) => {
              const isBest = Number.isFinite(r.score) && r.score === bestScore;
              return html`<td class=${isBest ? 'best' : ''}>${fmtMs(r.score)}</td>`;
            })}
          </tr>
        </tbody>
      </table>

      ${multi
        ? html`
            <div class="profile-meta">per-diagram total (ms)</div>
            <table class="profile-table">
              <thead>
                <tr>
                  <th class="phase">diagram</th>
                  ${results.map((r) => html`<th>${r.layout}</th>`)}
                </tr>
              </thead>
              <tbody>
                ${diagrams.map((d, di) => {
                  const rowVals = results
                    .map((r) => r.perDiagram[di]?.stats?.total)
                    .filter((v): v is number => typeof v === 'number');
                  const bestVal = rowVals.length ? Math.min(...rowVals) : NaN;
                  return html`
                    <tr>
                      <th class="phase">${baseName(d.diagram)}</th>
                      ${results.map((r) => {
                        const dr = r.perDiagram[di];
                        const v = dr?.stats?.total;
                        const isBest = typeof v === 'number' && v === bestVal;
                        return html`<td class=${isBest ? 'best' : ''}>
                          ${dr?.stats
                            ? fmtMs(v!)
                            : dr?.failures
                              ? html`<span class="profile-fail">fail</span>`
                              : '–'}
                        </td>`;
                      })}
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          `
        : nothing}
    `;
  }
}

customElements.define('dev-diagram-viewer', DevDiagramViewer);
