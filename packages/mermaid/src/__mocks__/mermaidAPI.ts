/**
 * Mocks for `./mermaidAPI`.
 *
 * We can't easily use `vi.spyOn(mermaidAPI, "function")` since the object is frozen with `Object.freeze()`.
 */
import * as configApi from '../config.ts';
import { vi } from 'vitest';
import { mermaidAPI as mAPI } from '../mermaidAPI.ts';

// original version cannot be modified since it was frozen with `Object.freeze()`
export const mermaidAPI = {
  render: vi.fn().mockResolvedValue({
    svg: '<svg></svg>',
  }),
  parse: mAPI.parse,
  parseDirective: vi.fn(),
  initialize: vi.fn(),
  getConfig: configApi.getConfig,
  setConfig: configApi.setConfig,
  getSiteConfig: configApi.getSiteConfig,
  updateSiteConfig: configApi.updateSiteConfig,
  reset: () => {
    configApi.reset();
  },
  globalReset: () => {
    configApi.reset(configApi.defaultConfig);
  },
  defaultConfig: configApi.defaultConfig,
};

export default mermaidAPI;
