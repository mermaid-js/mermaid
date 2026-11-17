import { existsSync, readdirSync, readFileSync } from 'node:fs';

export interface PackageOptions {
  name: string;
  packageName: string;
  file: string;
  /**
   * Publish every source module as its own entry point, so that dependents can
   * deep-import it (e.g. `@mermaid-js/core/config.js`).
   */
  allModules?: boolean;
  /**
   * Only build `X.core.mjs`, since the package is only used through `mermaid`,
   * which bundles it from source.
   */
  coreOnly?: boolean;
}

/**
 * Custom export condition that resolves workspace packages to their source, so
 * every bundle shares one copy of each module instead of their prebuilt `dist/`.
 */
export const sourceCondition = 'mermaid-source';

const packageJsonUrl = (packageName: string) =>
  new URL(`../packages/${packageName}/package.json`, import.meta.url);

/** Every `packages/diagram-*`, built from its `mermaid-source` entry. */
export const diagramPackageOptions: Record<string, PackageOptions> = Object.fromEntries(
  readdirSync(new URL('../packages/', import.meta.url))
    .filter((packageName) => packageName.startsWith('diagram-'))
    .filter((packageName) => existsSync(packageJsonUrl(packageName)))
    .map((packageName) => {
      const { exports } = JSON.parse(readFileSync(packageJsonUrl(packageName), 'utf8'));
      const file = exports['.'][sourceCondition].replace('./src/', '');
      return [packageName, { name: `mermaid-${packageName}`, packageName, file, coreOnly: true }];
    })
);

/**
 * Shared common options for both ESBuild and Vite
 */
export const packageOptions = {
  parser: {
    name: 'mermaid-parser',
    packageName: 'parser',
    file: 'index.ts',
  },
  core: {
    name: 'mermaid-core',
    packageName: 'core',
    file: 'mermaid.ts',
    allModules: true,
    coreOnly: true,
  },
  'mermaid-layout-elk': {
    name: 'mermaid-layout-elk',
    packageName: 'mermaid-layout-elk',
    file: 'plugin.ts',
  },
  'mermaid-layout-cose-bilkent': {
    name: 'mermaid-layout-cose-bilkent',
    packageName: 'mermaid-layout-cose-bilkent',
    file: 'plugin.ts',
  },
  'plugin-katex': {
    name: 'mermaid-plugin-katex',
    packageName: 'plugin-katex',
    file: 'index.ts',
  },
  ...diagramPackageOptions,
  mermaid: {
    name: 'mermaid',
    packageName: 'mermaid',
    file: 'mermaid.ts',
  },
  'mermaid-example-diagram': {
    name: 'mermaid-example-diagram',
    packageName: 'mermaid-example-diagram',
    file: 'detector.ts',
  },
  'mermaid-zenuml': {
    name: 'mermaid-zenuml',
    packageName: 'mermaid-zenuml',
    file: 'detector.ts',
  },
  'mermaid-layout-tidy-tree': {
    name: 'mermaid-layout-tidy-tree',
    packageName: 'mermaid-layout-tidy-tree',
    file: 'index.ts',
  },
  examples: {
    name: 'mermaid-examples',
    packageName: 'examples',
    file: 'index.ts',
  },
} as const satisfies Record<string, PackageOptions>;

/**
 * Minimum runtimes the published bundles support.
 *
 * Keep in sync with the `browserslist` and `engines` fields in the root
 * package.json and with `packages/mermaid/src/docs/config/usage.md`.
 */
export const buildTarget = [
  'es2024',
  'safari17.4',
  'ios17.4',
  'chrome121',
  'edge121',
  'firefox123',
  'node22.12',
] as const;
