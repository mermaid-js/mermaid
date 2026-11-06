export interface ApplitoolsBatch {
  id: string;
  name: string;
}

/** One batch per diagram folder (mmd fixtures) or spec file, like the Argos sheets. */
export const applitoolsBatch = (
  runId: string,
  specRelPath: string,
  screenshotPath?: string
): ApplitoolsBatch => {
  const segments = screenshotPath?.split('/') ?? [];
  const name = segments.length > 1 ? segments.slice(0, -1).join('/') : specRelPath;
  return { id: `mermaid-batch-${runId}-${name}`, name };
};

/** Test name within the batch: fixture base name, or the title path without the spec-file prefix. */
export const applitoolsTestName = (
  name: string,
  specRelPath: string,
  screenshotPath?: string
): string => {
  const segments = screenshotPath?.split('/') ?? [];
  if (segments.length > 1) {
    return segments[segments.length - 1];
  }
  const specPrefix = `${specRelPath.replace(/\s+/g, '-')}-`;
  return name.startsWith(specPrefix) ? name.slice(specPrefix.length) : name;
};
