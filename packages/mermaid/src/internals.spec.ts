import { beforeEach, describe, expect, it } from 'vitest';
import { getConfig, reset, sanitize, setConfig } from './config.js';
import { internalHelpers } from './internals.js';

describe('internalHelpers.getConfig', () => {
  beforeEach(() => {
    reset();
  });

  it('hands plugins a mutable copy, not the frozen snapshot', () => {
    const config = internalHelpers.getConfig();
    expect(Object.isFrozen(getConfig())).toBe(true);
    expect(Object.isFrozen(config)).toBe(false);
    expect(config).toEqual(getConfig());
  });

  it('survives a published plugin sanitizing it in place', () => {
    // `@mermaid-js/layout-elk` <= 1.0.2 bundles its own pre-snapshot `setConfig`, which runs
    // `sanitize()` on the host config in place (`syncHostConfig`). That deletes `secure` keys.
    const hostConfig = internalHelpers.getConfig();
    expect(() => sanitize(hostConfig)).not.toThrow();
    expect(getConfig().secure).toBeDefined();
  });

  it('does not let a plugin write leak into the host config', () => {
    const config = internalHelpers.getConfig();
    config.flowchart!.htmlLabels = !getConfig().flowchart?.htmlLabels;
    expect(internalHelpers.getConfig().flowchart?.htmlLabels).toBe(
      getConfig().flowchart?.htmlLabels
    );
    setConfig(config);
  });
});
