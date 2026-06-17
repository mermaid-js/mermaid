/* eslint-disable no-console */

/**
 * Lightweight, hierarchical render profiler.
 *
 * ## Zero production cost
 * Every call site is guarded by `injected.profiling`, a compile-time constant
 * that esbuild replaces with the literal `false` for normal builds. The guard
 * then folds away (`if (false) { … }`), every reference to {@link profiler}
 * disappears, and this whole module is tree-shaken out — zero bytes, zero
 * runtime cost. Dev and dedicated profiling builds set it to `true`.
 *
 * ## Two gates (hybrid)
 * 1. Build-time (`injected.profiling`): present only in dev/profiling builds.
 * 2. Runtime ({@link Profiler.enabled}): off by default even when compiled in,
 *    so a profiling build pays only a single boolean check until you opt in
 *    with `profiler.enable()` (or `__mermaidProfiler.enable()` in the console).
 *
 * ## Output
 * When enabled, each measured phase emits:
 *  1. A User Timing entry (`performance.measure`) so phases show up in the
 *     Chrome DevTools Performance panel "Timings" track — standard
 *     instrumentation, free visualization.
 *  2. A node in an in-memory tree ({@link ProfileSpan}) used for the structured
 *     console summary and for programmatic access via {@link Profiler.report}.
 */

export interface ProfileSpan {
  name: string;
  /** High-res start timestamp (`performance.now()`), relative to the time origin. */
  start: number;
  /** Wall-clock duration in milliseconds. `-1` until the span ends. */
  duration: number;
  children: ProfileSpan[];
}

const hasPerformance = typeof performance !== 'undefined' && typeof performance.now === 'function';

const now = (): number => (hasPerformance ? performance.now() : 0);

/** DevTools timeline prefix so mermaid marks/measures are easy to spot and filter. */
const MEASURE_PREFIX = '🧜 ';

/**
 * DevTools custom-track config (Chrome 130+). Phases render as labeled, colored
 * bars in a dedicated "Mermaid render" track instead of being lost among the
 * generic Timings entries. Requires "Show custom tracks" in the Performance
 * panel's capture settings. Unknown fields are ignored on older Chrome, where
 * the entry just falls back to the Timings track.
 */
const DEVTOOLS_TRACK = 'Mermaid render';
const DEVTOOLS_TRACK_GROUP = 'Mermaid';

/** DevTools palette colour per phase, for at-a-glance separation. */
const PHASE_COLORS: Record<string, string> = {
  parse: 'tertiary',
  prepare: 'secondary',
  measure: 'primary',
  layout: 'primary-dark',
  layoutCore: 'error',
  draw: 'primary-light',
  paint: 'secondary-dark',
  serialize: 'tertiary-dark',
  render: 'primary-light',
};

export interface ProfileRecord {
  /** Label for this render (e.g. the layout name when comparing layouts). */
  label: string;
  /** The completed phase tree for the render. */
  tree: ProfileSpan;
  /**
   * Flat accumulators summed across the render — for sub-operations that run too
   * many times to be tree spans (e.g. per-node `getBBox`). See {@link Profiler.tickSync}.
   */
  buckets: Record<string, number>;
}

class Profiler {
  /** Runtime toggle. Off by default even in profiling builds. */
  public enabled = false;
  /** Log a summary to the console automatically when each root span closes. */
  public autoPrint = true;
  /**
   * Optional label applied to the next completed render's {@link ProfileRecord}.
   * A harness (e.g. the Dev Explorer's Profile tab) sets this before each
   * render to tag the resulting tree, e.g. with the layout name. Consumed and
   * cleared on {@link stop}.
   */
  public runLabel?: string;
  /** Completed render trees, oldest first, capped at {@link maxRecords}. */
  public readonly records: ProfileRecord[] = [];

  private readonly maxRecords = 200;
  private roots: ProfileSpan[] = [];
  private stack: ProfileSpan[] = [];
  private buckets: Record<string, number> = {};

  public enable(): this {
    this.enabled = true;
    return this;
  }

  public disable(): this {
    this.enabled = false;
    return this;
  }

  /** Begin a new top-level measurement (one per diagram render). */
  public start(label: string): void {
    if (!this.enabled) {
      return;
    }
    this.roots = [];
    this.stack = [];
    this.buckets = {};
    this.begin(label);
  }

  /**
   * Accumulate the wall-clock of a synchronous sub-operation into a named bucket,
   * summed over every call within the render — for hot operations that run too
   * often to be individual tree spans (e.g. per-node `getBBox`). Returns the
   * function's result. No-op (just calls `fn`) unless enabled.
   */
  public tickSync<T>(name: string, fn: () => T): T {
    if (!this.enabled) {
      return fn();
    }
    const t0 = now();
    try {
      return fn();
    } finally {
      this.buckets[name] = (this.buckets[name] ?? 0) + (now() - t0);
    }
  }

  /**
   * Async variant of {@link tickSync}. WARNING: only meaningful for operations
   * that run one-at-a-time. Do NOT use it for calls awaited concurrently (e.g.
   * `Promise.all(nodes.map(...))`) — their wall-clocks overlap and the summed
   * bucket balloons far past the real elapsed time. For concurrent CPU
   * attribution use a DevTools CPU profile instead.
   */
  public async tick<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }
    const t0 = now();
    try {
      return await fn();
    } finally {
      this.buckets[name] = (this.buckets[name] ?? 0) + (now() - t0);
    }
  }

  /** End the current top-level measurement and optionally print a summary. */
  public stop(): ProfileSpan | undefined {
    if (!this.enabled) {
      return undefined;
    }
    // Defensive: close any spans a thrown phase may have left open.
    while (this.stack.length > 0) {
      this.end();
    }
    const root = this.roots.at(-1);
    const label = this.runLabel ?? root?.name;
    if (root) {
      this.records.push({ label: label ?? root.name, tree: root, buckets: { ...this.buckets } });
      if (this.records.length > this.maxRecords) {
        this.records.splice(0, this.records.length - this.maxRecords);
      }
      if (this.autoPrint) {
        this.printSummary(root, label);
      }
    }
    this.runLabel = undefined;
    return root;
  }

  /** Open a child span. Pair with {@link end}. No-op unless enabled. */
  public begin(name: string): void {
    if (!this.enabled) {
      return;
    }
    const span: ProfileSpan = { name, start: now(), duration: -1, children: [] };
    const parent = this.stack.at(-1);
    if (parent) {
      parent.children.push(span);
    } else {
      this.roots.push(span);
    }
    this.stack.push(span);
    // DevTools: a labeled point marker at the phase start (Timings track).
    if (hasPerformance && typeof performance.mark === 'function') {
      try {
        performance.mark(`${MEASURE_PREFIX}${name} ▶`);
      } catch {
        // Never let instrumentation break a render.
      }
    }
  }

  /** Close the most recently opened span. No-op unless enabled. */
  public end(): void {
    if (!this.enabled) {
      return;
    }
    const span = this.stack.pop();
    if (!span) {
      return;
    }
    const end = now();
    span.duration = end - span.start;
    if (hasPerformance && typeof performance.measure === 'function') {
      try {
        performance.measure(`${MEASURE_PREFIX}${span.name}`, {
          start: span.start,
          end,
          detail: {
            devtools: {
              dataType: 'track-entry',
              track: DEVTOOLS_TRACK,
              trackGroup: DEVTOOLS_TRACK_GROUP,
              color: PHASE_COLORS[span.name] ?? 'primary',
              tooltipText: `${span.name} — ${span.duration.toFixed(1)} ms`,
            },
          },
        });
      } catch {
        // Some environments reject the options form; never let timing break a render.
      }
    }
  }

  /**
   * Measure an async phase. Returns the wrapped function's result and rethrows
   * any error after closing the span, so instrumentation never swallows
   * failures or leaks an open span. No measurement overhead unless enabled.
   */
  public async span<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }
    this.begin(name);
    try {
      return await fn();
    } finally {
      this.end();
    }
  }

  /** The most recent completed render tree, or `undefined`. */
  public report(): ProfileSpan | undefined {
    return this.records.at(-1)?.tree ?? this.roots.at(-1);
  }

  /** Drop all collected records and any in-progress spans. */
  public clear(): void {
    this.records.length = 0;
    this.roots = [];
    this.stack = [];
    this.runLabel = undefined;
  }

  public reset(): void {
    this.roots = [];
    this.stack = [];
  }

  public printSummary(root = this.report(), label?: string): void {
    if (!root) {
      return;
    }
    const total = root.duration;
    const heading = label && label !== root.name ? `${root.name} [${label}]` : root.name;
    const lines: string[] = ['ms        %    phase'];
    const walk = (span: ProfileSpan, depth: number): void => {
      const indent = '  '.repeat(depth);
      const ms = span.duration.toFixed(1).padStart(8);
      const pct = total > 0 ? `${((span.duration / total) * 100).toFixed(0).padStart(3)}%` : '   -';
      lines.push(`${ms}  ${pct}  ${indent}${span.name}`);
      for (const child of span.children) {
        walk(child, depth + 1);
      }
      // Surface unaccounted self-time when children don't add up to the parent.
      if (span.children.length > 0) {
        const childTotal = span.children.reduce((sum, c) => sum + c.duration, 0);
        const self = span.duration - childTotal;
        if (self > 0.5) {
          const selfMs = self.toFixed(1).padStart(8);
          lines.push(`${selfMs}       ${indent}  (self)`);
        }
      }
    };
    walk(root, 0);
    const bucketNames = Object.keys(this.buckets);
    if (bucketNames.length > 0) {
      lines.push('—— buckets (summed) ——');
      for (const name of bucketNames) {
        lines.push(`${this.buckets[name].toFixed(1).padStart(8)}       ${name}`);
      }
    }
    console.log(`${MEASURE_PREFIX}mermaid render profile · ${heading}\n${lines.join('\n')}`);
  }
}

type GlobalWithProfiler = typeof globalThis & {
  __mermaidProfiler?: Profiler;
  injected?: { includeLargeFeatures: boolean; profiling: boolean; version: string };
};

// `injected.*` are build-time constants that esbuild's `define` replaces with
// literals. In runtimes that execute the source *without* that define — e.g. the
// docs generator running modules through tsx — `injected` is undefined and the
// guarded reads below would throw `ReferenceError: injected is not defined`. Seed a
// production-equivalent default. Bundled builds replace `injected.profiling` with a
// literal and never read this object, so it has no effect there.
(globalThis as GlobalWithProfiler).injected ??= {
  includeLargeFeatures: true,
  profiling: false,
  version: '0.0.0',
};

// A SINGLE profiler instance shared across every mermaid bundle on the page.
//
// External layout packages (e.g. @mermaid-js/layout-elk) are built as separate
// bundles that inline their own copy of mermaid's rendering pipeline — including
// this module and the phase spans inside createCommonLayoutRenderer. Without
// sharing, each bundle gets its own Profiler, so the elk layout's phase spans
// would land in a different instance than the one the rest of the render
// (parse/serialize/start/stop) and the Dev Explorer use — and silently vanish.
// Resolving the instance from globalThis collapses them into one, so spans from
// every bundle nest into the same tree.
//
// It also doubles as the console/Dev-Explorer handle: `__mermaidProfiler.enable()`.
//
// In production `injected.profiling` is `false`, so this folds to a plain,
// unused (pure) instance that tree-shakes away with no global side effect.
export const profiler: Profiler = injected.profiling
  ? ((globalThis as GlobalWithProfiler).__mermaidProfiler ??= new Profiler())
  : /* @__PURE__ */ new Profiler();
