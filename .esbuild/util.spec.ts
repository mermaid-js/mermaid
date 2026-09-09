// @vitest-environment node
// util.ts resolves paths from `import.meta.url`, which is not a file:// URL
// under the default jsdom environment.
import { describe, expect, it } from 'vitest';
import { packageOptions } from '../.build/common.js';
import { defaultOptions, getBuildConfig } from './util.js';

const buildFor = (packageName: keyof typeof packageOptions, core: boolean) =>
  getBuildConfig({
    ...defaultOptions,
    core,
    format: 'esm',
    options: packageOptions[packageName],
  });

describe('getBuildConfig externals', () => {
  it('externalizes peerDependencies in the core build', () => {
    // The layout plugins peer-depend on mermaid. If it is not external, a
    // runtime import of it resolves through `exports` to dist/mermaid.core.mjs
    // and esbuild inlines the whole bundle — shipping a second mermaid, with
    // its own module-level singletons, inside the plugin. The plugin then
    // renders against its own stale copy instead of the host's, so mermaid
    // fixes silently fail to reach it until the plugin is republished.
    const external = buildFor('mermaid-layout-elk', true).external ?? [];
    expect(external).toContain('mermaid');
  });

  it('externalizes dependencies in the core build', () => {
    const external = buildFor('mermaid-layout-elk', true).external ?? [];
    expect(external).toContain('elkjs');
    expect(external).toContain('d3');
  });

  it('bundles everything in the non-core build', () => {
    // The esm entry is the self-contained one (standalone + dev server), so it
    // must keep inlining mermaid rather than emitting a bare import. Only the
    // node built-ins stay external there.
    const external = buildFor('mermaid-layout-elk', false).external ?? [];
    expect(external).not.toContain('mermaid');
    expect(external).not.toContain('elkjs');
  });

  it('leaves mermaid itself unaffected — it has no peerDependencies', () => {
    const external = buildFor('mermaid', true).external ?? [];
    expect(external).not.toContain('mermaid');
  });
});
