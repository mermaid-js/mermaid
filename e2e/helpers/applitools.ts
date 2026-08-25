export interface ApplitoolsBatch {
  id: string;
  name: string;
}

/**
 * Applitools batch for a screenshot, grouped the same way the Argos sheets are
 * (see `deriveGroupKey` in scripts/screenshot-sheets.ts): mmd fixtures batch by
 * their diagram folder (e.g. `diagrams/flowchart`, `diagrams/flowchart/elk`)
 * rather than the single runner spec they all execute from; spec-based tests
 * batch by the spec's path relative to the e2e dir.
 *
 * `runId` must be identical across every Playwright worker of one run — the
 * batch id is what Applitools keys on, so a per-worker seed splits one spec or
 * folder into as many batches as workers touched it.
 */
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
 * Applitools test name for a screenshot. `name` is the snapshot name util.ts
 * derives for every backend (explicit `options.name`, or the whitespace-collapsed
 * Playwright title path, which starts with the spec file). Since the batch
 * already names the folder or spec, the test name only needs to identify the
 * test within it: mmd fixtures use their base name, spec-based tests drop the
 * spec-file prefix (restoring the Cypress-era `describe title` names). Explicit
 * names carry no such prefix and pass through unchanged.
 */
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
