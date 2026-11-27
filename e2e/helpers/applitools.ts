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

/**
 * Test name of a check. Applitools finds a check's baseline by app name, test name and
 * environment within the branch; the batch only groups results for display. So the name has
 * to identify the test on its own: an mmd fixture's path inside `diagrams/`, or the spec path
 * followed by the test's title path or explicit name. Two fixtures with the same file name in
 * different folders, such as a layered copy and its ELK source, would otherwise share a baseline.
 */
export const applitoolsTestName = (
  name: string,
  specRelPath: string,
  screenshotPath?: string
): string => {
  const segments = screenshotPath?.split('/') ?? [];
  if (segments.length > 1) {
    return (segments[0] === 'diagrams' ? segments.slice(1) : segments).join('/');
  }
  const specPrefix = `${specRelPath.replace(/\s+/g, '-')}-`;
  return name.startsWith(specPrefix) ? name : `${specPrefix}${name}`;
};
