/**
 * Minimal typings for the madge API surface used by checkCircle.mts
 * (madge does not ship its own type declarations).
 */
declare module 'madge' {
  interface MadgeConfig {
    fileExtensions?: string[];
    excludeRegExp?: string[];
    detectiveOptions?: Record<string, { skipTypeImports?: boolean }>;
    tsConfig?: string;
    dependencyFilter?: (
      dependencyFilePath: string,
      traversedFilePath?: string,
      baseDir?: string
    ) => boolean;
  }

  interface MadgeResult {
    circular: () => string[][];
  }

  function madge(path: string | string[], config?: MadgeConfig): Promise<MadgeResult>;

  export default madge;
}
