// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Only allowed to import `fastdom` in this file
import fastdomModule from 'fastdom';
import fastdomPromised from 'fastdom/extensions/fastdom-promised.js';

/**
 * Promisified version of {@link fastdom} that uses `queueMicrotask` instead of `requestAnimationFrame` for faster execution.
 *
 * @example
 * ```
 * const bbox = await fastdom.measure(() => div.node()!.getBoundingClientRect());
 * ```
 */
const fastdom = // @ts-expect-error -- fastdom types aren't yet ESM-compatible, we need this hack
  (fastdomModule as typeof fastdomModule.default)
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
    .extend(fastdomPromised);

export default fastdom;
