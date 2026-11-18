import { readFile } from 'node:fs/promises';
import type { Plugin } from 'esbuild';

/** Keep Chevrotain's deliberate dead eval syntactically reachable in Firefox. */
export const deadCodePlugin: Plugin = {
  name: 'dead-code-after-return',
  setup(build) {
    build.onLoad({ filter: /to-fast-properties\.js$/ }, async (args) => {
      if (!args.path.replaceAll('\\', '/').includes('/@chevrotain/utils/')) {
        return;
      }
      const source = await readFile(args.path, 'utf8');
      // `typeof fakeInstance.bar` always returns a nonempty string. Move the
      // second existing access into the guard rather than adding another call:
      // the object may have a getter, so the number of accesses must not change.
      // esbuild can fold `if (1)` into an unconditional return, but cannot fold
      // this call. The dependency's optimization barrier stays in the bundle.
      const knownHelper = /function fakeAccess\(\)\s*{\s*return typeof fakeInstance\.bar;\s*}/.test(
        source
      );
      const contents = knownHelper
        ? source.replace(
            /fakeAccess\(\);(\s*(?:\/\/[^\n\r]*\r?\n\s*)*)if \(1\)/,
            '$1if (fakeAccess())'
          )
        : source;
      return {
        contents,
        warnings:
          contents === source
            ? [
                {
                  text: 'deadCodePlugin: expected guard not found in @chevrotain/utils to-fast-properties; upstream may have fixed or removed it',
                },
              ]
            : [],
      };
    });
  },
};
