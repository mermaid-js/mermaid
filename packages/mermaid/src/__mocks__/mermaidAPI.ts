/**
 * Mocks for `./mermaidAPI`.
 *
 * We can't easily use `vi.spyOn(mermaidAPI, "function")` since the object is frozen with `Object.freeze()`.
 */
import * as configApi from '../config';
import { vi } from 'vitest';
import { addDiagrams } from '../diagram-api/diagram-orchestration';
import Diagram from '../Diagram';

// Normally, we could just do the following to get the original `parse()`
// implementation, however, requireActual returns a promise and it's not documented how to use withing mock file.

/**
 * @param text
 * @param parseError
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function parse(text: string, parseError?: Function): boolean {
  addDiagrams();
  const diagram = new Diagram(text, parseError);
  return diagram.parse(text, parseError);
}

// original version cannot be modified since it was frozen with `Object.freeze()`
export const mermaidAPI = {
  render: vi.fn(),
  renderAsync: vi.fn(),
  parse,
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
