// eslint-disable-next-line no-var
declare var injected: {
  version: string;
  includeLargeFeatures: boolean;
  /**
   * Compile-time flag that gates the render profiler (see `src/profiler.ts`).
   * `false` in production builds so the profiler is tree-shaken out entirely;
   * `true` in dev/profiling builds where it can be toggled on at runtime.
   */
  profiling: boolean;
};

/**
 * Vite's `?raw` suffix, which yields a module's own source as a string. Used by specs that
 * assert the *shape* of a source file rather than its behaviour -- see
 * `diagrams/sequence/palettePicking.spec.ts`.
 */
declare module '*?raw' {
  const content: string;
  export default content;
}
