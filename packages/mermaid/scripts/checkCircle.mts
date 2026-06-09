/* eslint-disable no-console */
/**
 * Checks for circular dependencies in `src` using madge.
 *
 * This replaces the previous `npx madge --circular ./src` + madge config file
 * setup because madge's `excludeRegExp` only filters the *output* tree, not the file
 * scan/traversal itself. madge would therefore still traverse into the
 * VitePress docs sources under `src/docs`, where following imports inside
 * `.vue` SFCs crashes filing-cabinet's resolver (it re-parses the raw SFC as
 * JavaScript). The madge API's `dependencyFilter` lets us skip those paths
 * during traversal, which the CLI does not expose.
 */
import madge from 'madge';
import { fileURLToPath } from 'url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

// Paths that must not be traversed: documentation sources (VitePress site,
// including .vue SFCs) and the generated vitepress build directory.
const skippedPathRegex = /docs|vitepress/;

const result = await madge(new URL('../src', import.meta.url).pathname, {
  fileExtensions: ['js', 'ts'],
  excludeRegExp: ['node_modules', 'docs', 'vitepress', 'detector', 'Detector'],
  detectiveOptions: {
    ts: { skipTypeImports: true },
    es6: { skipTypeImports: true },
  },
  tsConfig: `${packageRoot}/tsconfig.json`,
  dependencyFilter: (dependencyFilePath: string) => !skippedPathRegex.test(dependencyFilePath),
});

const circular = result.circular();

if (circular.length > 0) {
  console.error(`✖ Found ${circular.length} circular dependencies:`);
  for (const [index, cycle] of circular.entries()) {
    console.error(`${index + 1}) ${cycle.join(' > ')}`);
  }
  process.exit(1);
}

console.log('✔ No circular dependency found!');
