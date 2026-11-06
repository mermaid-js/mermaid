import { readFile } from 'node:fs/promises';
import type { Plugin } from 'esbuild';

// chevrotain's toFastProperties ends with `if (1) return toBecomeFast;` followed
// by a never-executed `(0, eval)(toBecomeFast);`. The `if (1)` exists to keep
// Firefox from warning "unreachable code after return statement", but esbuild's
// minifier folds it into a bare `return`, so the warning reappears in our
// minified bundles. The statement is dead code, so drop it before bundling.
// Blanking it in place keeps line numbers intact for the upstream source map.
const deadEval = '(0, eval)(toBecomeFast);';

export const chevrotainDeadEvalPlugin: Plugin = {
  name: 'chevrotain-dead-eval',
  setup(build) {
    build.onLoad(
      { filter: /[/\\]@chevrotain[/\\]utils[/\\]lib[/\\]src[/\\]to-fast-properties\.js$/ },
      async ({ path }) => {
        const source = await readFile(path, 'utf8');
        if (!source.includes(deadEval)) {
          return {
            contents: source,
            loader: 'js',
            warnings: [
              {
                text: `${deadEval} not found in ${path}; chevrotainDeadEvalPlugin may no longer be needed.`,
              },
            ],
          };
        }
        return { contents: source.replace(deadEval, ''), loader: 'js' };
      }
    );
  },
};
