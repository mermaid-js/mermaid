import { describe, expect, it, vi, beforeEach } from 'vitest';
import type * as DiagramApi from '../../../../diagram-api/diagramAPI.js';

// Mocked so the assertion is about the CALL, not the resulting value. Compiled
// into mermaid, the host's config module and this one are the same module, so a
// value-level assertion would pass whether or not the sync runs — the whole
// point of `syncHostConfig` is the standalone `@mermaid-js/layout-elk` bundle,
// where they are two copies, and that duplication cannot be reproduced
// in-process. Asserting the call is what actually pins the behaviour.
const setConfigMock = vi.hoisted(() => vi.fn());
vi.mock('../../../../diagram-api/diagramAPI.js', async (importOriginal) => ({
  ...(await importOriginal<typeof DiagramApi>()),
  setConfig: setConfigMock,
}));

const { prepareLayoutForElk } = await import('../render.js');

const log = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

const HOST_CONFIG = {
  htmlLabels: false,
  securityLevel: 'sandbox',
  arrowMarkerAbsolute: true,
  flowchart: { wrappingWidth: 200 },
  curve: undefined,
};

const contextWithHostConfig = {
  helpers: {
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => HOST_CONFIG,
    interpolateToCurve: (curve: unknown) => curve,
    log,
  },
  options: { algorithm: 'elk.layered' },
} as any;

describe('prepareLayoutForElk host config sync', () => {
  beforeEach(() => {
    setConfigMock.mockReset();
  });

  it("pushes the host's config into this bundle's config module", () => {
    // Without this, the plugin bundle reads schema defaults: a host setting
    // `htmlLabels: false` as hardening still gets HTML labels, and markers are
    // painted without `arrowMarkerAbsolute`.
    prepareLayoutForElk({ nodes: [], edges: [] } as any, contextWithHostConfig);

    expect(setConfigMock).toHaveBeenCalledWith(HOST_CONFIG);
  });

  it('syncs before the layout data is read, not after', () => {
    // Labels are built by `measureLayoutFn` after `prepareLayout` returns, so a
    // sync that ran later would be too late to affect how they are measured.
    const order: string[] = [];
    setConfigMock.mockImplementation(() => order.push('setConfig'));
    const data = {
      nodes: [],
      edges: [],
      get markers() {
        order.push('data-read');
        return [];
      },
    } as any;

    prepareLayoutForElk(data, contextWithHostConfig);

    expect(order[0]).toBe('setConfig');
  });
});
