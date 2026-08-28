import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as configApi from '../../config.js';
import { resolveMindmapLayout } from './mindmapRenderer.js';

describe('mindmap layout selection', () => {
  beforeEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
    configApi.saveConfigFromInitialize({});
  });

  it('uses dagre when no layout was requested, despite the elk default', () => {
    const config = configApi.getConfig();
    expect(config.layout).toBe('elk');
    expect(resolveMindmapLayout(config.layout)).toBe('dagre');
  });

  it('uses elk when the diagram explicitly asks for it', () => {
    configApi.addDirective({ layout: 'elk' });
    expect(resolveMindmapLayout(configApi.getConfig().layout)).toBe('elk');
  });

  it('uses cose-bilkent when the diagram explicitly asks for it', () => {
    configApi.addDirective({ layout: 'cose-bilkent' });
    expect(resolveMindmapLayout(configApi.getConfig().layout)).toBe('cose-bilkent');
  });

  it('falls back to cose-bilkent for an explicit but unregistered layout', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    configApi.addDirective({ layout: 'not-a-real-layout' });
    expect(resolveMindmapLayout(configApi.getConfig().layout)).toBe('cose-bilkent');
  });
});
