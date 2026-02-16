import { fileURLToPath } from 'node:url';
/** @import import { LoadHook } from "node:module"; */
/**
 * @type {LoadHook}
 *
 * Load hook that short circuits the loading of `.schema.yaml` files with `export default {}`.
 * These would normally be loaded using ESBuild, but that doesn't work for these local scripts.
 *
 * @see https://nodejs.org/api/module.html#loadurl-context-nextload
 */
export const load = async (url, context, nextLoad) => {
  const filePath = url.startsWith('file://') ? fileURLToPath(url) : url;
  if (filePath.endsWith('.schema.yaml')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default {}`,
    };
  } else {
    return await nextLoad(url, context);
  }
};
