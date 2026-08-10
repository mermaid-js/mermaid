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
