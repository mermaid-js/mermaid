/**
 * Mocks for `./mermaidAPI`.
 *
 * We can't easily use `jest.spyOn(mermaidAPI, "function")` since the object is frozen with `Object.freeze()`.
 */
import * as configApi from '../config';

import { addDiagrams } from '../diagram-api/diagram-orchestration';
import Diagram from '../Diagram';

// Normally, we could just do the following to get the original `parse()`
// implementation, however, requireActual isn't currently supported in Jest
// for ESM, see https://github.com/facebook/jest/issues/9430
// and https://github.com/facebook/jest/pull/10976
// const {parse} = jest.requireActual("./mermaidAPI");

let hasLoadedDiagrams = false;
function parse(text: string, parseError?: Function): boolean {
  if (!hasLoadedDiagrams) {
    addDiagrams();
    hasLoadedDiagrams = true;
  }
  const diagram = new Diagram(text, parseError);
  return diagram.parse(text, parseError);
}

// original version cannot be modified since it was frozen with `Object.freeze()`
export const mermaidAPI = {
  render: jest.fn(),
  parse,
  parseDirective: jest.fn(),
  initialize: jest.fn(),
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
