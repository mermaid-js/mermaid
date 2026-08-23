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

type FastDomTask = { cancel(): void };

type FastDomCore = {
  extend(extension: Record<string, unknown>): FastDomCore;
  measure<T>(fn: () => T, ctx?: unknown): FastDomTask | T;
  mutate<T>(fn: () => T, ctx?: unknown): FastDomTask | T;
  clear(task: FastDomTask): void;
};

// fastdom ships only a UMD build whose export tail prefers an AMD `define`
// over CommonJS `module.exports`. When the host page defines a global
// `define` function (legacy AMD loaders, analytics snippets, ...), the
// bundled copy takes the AMD branch, never assigns `module.exports`, and the
// bundler's interop default export comes through empty - crashing on
// `.extend` (https://github.com/mermaid-js/mermaid/issues/8095).
// fastdom always publishes its singleton on the global scope *before* that
// branch (`window.fastdom`), so fall back to it when the module default does
// not look like a FastDom instance.
const resolveBase = (
  module: unknown,
  globalScope: Record<string, FastDomCore | undefined>,
): FastDomCore => {
  const fromModule = (module as { default?: FastDomCore } | undefined)?.default;
  if (fromModule && typeof fromModule.extend === 'function') {
    return fromModule;
  }
  const fromGlobal = globalScope.fastdom;
  if (fromGlobal && typeof fromGlobal.extend === 'function') {
    return fromGlobal;
  }
  throw new Error('Unable to initialize fastdom');
};

// The `fastdom/extensions/fastdom-promised.js` file has the same UMD problem,
// and unlike the core it publishes its export only on the final `else`
// branch, so it cannot be recovered from the global scope either. It is a
// small, stable piece of MIT-licensed code (wilsonpage/fastdom), vendored
// here so mermaid does not depend on either UMD tail at all.
const createPromisedExtension = () => ({
  initialize(this: { _tasks?: Map<Promise<unknown>, FastDomTask> }) {
    this._tasks = new Map();
  },

  mutate<T>(
    this: { _tasks: Map<Promise<T>, FastDomTask>; fastdom: FastDomCore },
    fn: () => T,
    ctx?: unknown,
  ): Promise<T> {
    return createPromisedTask(this, 'mutate', fn, ctx);
  },

  measure<T>(
    this: { _tasks: Map<Promise<T>, FastDomTask>; fastdom: FastDomCore },
    fn: () => T,
    ctx?: unknown,
  ): Promise<T> {
    return createPromisedTask(this, 'measure', fn, ctx);
  },

  clear<T>(this: { _tasks: Map<Promise<T>, FastDomTask>; fastdom: FastDomCore }, promise: Promise<T>) {
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
  ctx?: unknown,
): Promise<T> {
  const tasks = promised._tasks;
  let task!: FastDomTask;

  const promise = new Promise<T>((resolve, reject) => {
    task = promised.fastdom[type](() => {
      tasks.delete(promise);
      try {
        resolve(ctx ? (fn as (this: unknown) => T).call(ctx) : fn());
      } catch (error) {
        reject(error);
      }
    }, ctx) as FastDomTask;
  });

  tasks.set(promise, task);
  return promise;
}

export const createFastdomWrapper = (
  module: unknown = fastdomModule,
  globalScope: Record<string, FastDomCore | undefined> = (typeof window !== 'undefined'
    ? window
    : globalThis) as unknown as Record<string, FastDomCore | undefined>,
): FastDomCore & { clear(promise: Promise<unknown>): void } => {
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
    .extend(createPromisedExtension()) as FastDomCore & {
    clear(promise: Promise<unknown>): void;
  };
};

const fastdom = createFastdomWrapper();

export default fastdom;