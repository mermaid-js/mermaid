// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Only allowed to import `fastdom` in this file
import fastdomModule from 'fastdom';

/**
 * Promisified version of {@link fastdom} that uses `queueMicrotask` instead of `requestAnimationFrame` for faster execution.
 *
 * @example
 * ```
 * const bbox = await fastdom.measure(() => div.node()!.getBoundingClientRect());
 * ```
 */

interface FastDomTask {
  cancelled?: boolean;
}

interface FastDomCore {
  extend(extension: Record<string, unknown>): FastDomCore;
  measure<T>(fn: () => T, ctx?: unknown): FastDomTask | T;
  mutate<T>(fn: () => T, ctx?: unknown): FastDomTask | T;
  clear(task: FastDomTask): void;
}

/** The public API mermaid consumes: every scheduling call returns a promise. */
export interface FastDomPromised {
  measure<T>(fn: () => T, ctx?: unknown): Promise<T>;
  mutate<T>(fn: () => T, ctx?: unknown): Promise<T>;
  clear(promise: Promise<unknown>): void;
}

// Minimal drop-in replacement for fastdom's core singleton: batches measures
// before mutates within one microtask and supports cancellation.
const createFallbackCore = (): FastDomCore => {
  let batches: { measure: (() => void)[]; mutate: (() => void)[] } | null = null;
  const schedule = () => {
    if (batches) {
      return;
    }
    batches = { measure: [], mutate: [] };
    queueMicrotask(() => {
      const current = batches!;
      batches = null;
      for (const fn of current.measure) {
        fn();
      }
      for (const fn of current.mutate) {
        fn();
      }
    });
  };
  const run =
    (type: 'measure' | 'mutate') =>
    (fn: () => void, ctx?: unknown): FastDomTask => {
      const task: { cancelled: boolean } = { cancelled: false };
      schedule();
      batches![type].push(() => {
        if (!task.cancelled) {
          if (ctx) {
            (fn as (this: unknown) => void).call(ctx);
          } else {
            fn();
          }
        }
      });
      return task;
    };
  const core: FastDomCore = {
    extend(extension: Record<string, unknown>): FastDomCore {
      Object.assign(core, extension);
      (extension as { initialize?: () => void }).initialize?.call(core);
      return core;
    },
    measure: run('measure'),
    mutate: run('mutate'),
    clear(task: FastDomTask) {
      task.cancelled = true;
    },
  };
  return core;
};

// fastdom ships only a UMD build whose export tail prefers an AMD `define`
// over CommonJS `module.exports`. When the host page defines a global
// `define` function (legacy AMD loaders, analytics snippets, ...), the
// bundled copy takes the AMD branch, never assigns `module.exports`, and the
// bundler's interop default export comes through empty - crashing on
// `.extend` (https://github.com/mermaid-js/mermaid/issues/8095).
// fastdom always publishes its singleton on the global scope *before* that
// branch (`window.fastdom`), so fall back to it when the module default does
// not look like a FastDom instance, and to a locally built core as a last
// resort (e.g. Node SSR, where neither export shape carries the singleton).
const resolveBase = (module: unknown, globalScope: Record<string, unknown>): FastDomCore => {
  const candidates = [
    module,
    (module as { default?: unknown } | undefined)?.default,
    ((module as { default?: { default?: unknown } } | undefined)?.default as { default?: unknown })
      ?.default,
  ];
  for (const candidate of candidates) {
    if (candidate && typeof (candidate as FastDomCore).extend === 'function') {
      return candidate as FastDomCore;
    }
  }
  const fromGlobal = globalScope.fastdom as FastDomCore | undefined;
  if (fromGlobal && typeof fromGlobal.extend === 'function') {
    return fromGlobal;
  }
  return createFallbackCore();
};

// The `fastdom/extensions/fastdom-promised.js` file has the same UMD problem,
// and unlike the core it publishes its export only on the final `else`
// branch, so it cannot be recovered from the global scope either. It is a
// small, stable piece of MIT-licensed code from the fastdom project, vendored
// here so mermaid does not depend on either UMD tail at all.
const createPromisedExtension = () => ({
  initialize(this: { _tasks?: Map<Promise<unknown>, FastDomTask> }) {
    this._tasks = new Map();
  },

  mutate<T>(
    this: { _tasks: Map<Promise<T>, FastDomTask>; fastdom: FastDomCore },
    fn: () => T,
    ctx?: unknown
  ): Promise<T> {
    return createPromisedTask(this, 'mutate', fn, ctx);
  },

  measure<T>(
    this: { _tasks: Map<Promise<T>, FastDomTask>; fastdom: FastDomCore },
    fn: () => T,
    ctx?: unknown
  ): Promise<T> {
    return createPromisedTask(this, 'measure', fn, ctx);
  },

  clear<T>(
    this: { _tasks: Map<Promise<T>, FastDomTask>; fastdom: FastDomCore },
    promise: Promise<T>
  ) {
    const tasks = this._tasks;
    const task = tasks.get(promise);
    this.fastdom.clear(task!);
    tasks.delete(promise);
  },
});

function createPromisedTask<T>(
  promised: { _tasks: Map<Promise<T>, FastDomTask>; fastdom: FastDomCore },
  type: 'measure' | 'mutate',
  fn: () => T,
  ctx?: unknown
): Promise<T> {
  const tasks = promised._tasks;
  let task!: FastDomTask;

  const promise = new Promise<T>((resolve, reject) => {
    task = promised.fastdom[type](() => {
      tasks.delete(promise);
      try {
        resolve(ctx ? (fn as (this: unknown) => T).call(ctx) : fn());
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, ctx) as FastDomTask;
  });

  tasks.set(promise, task);
  return promise;
}

export const createFastdomWrapper = (
  module: unknown = fastdomModule,
  globalScope: Record<string, unknown> = (typeof window !== 'undefined'
    ? window
    : globalThis) as unknown as Record<string, unknown>
): FastDomPromised => {
  return resolveBase(module, globalScope)
    .extend({
      /**
       * `requestAnimationFrame` is too slow compared to `queueMicrotask`.
       */
      raf(cb: () => void) {
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(cb);
        } else {
          setTimeout(cb, 0);
        }
      },
    })
    .extend(createPromisedExtension()) as unknown as FastDomPromised;
};

const fastdom: FastDomPromised = createFastdomWrapper();

export default fastdom;
