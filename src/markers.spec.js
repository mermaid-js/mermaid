// mocks the mermaidAPI.render function (see `./__mocks__/mermaidAPI`)
jest.mock('./mermaidAPI');
// jest.mock only works well with CJS, see https://github.com/facebook/jest/issues/9430
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: mermaid } = require('./mermaid');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { mermaidAPI } = require('./mermaidAPI');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: flowDb } = require('./diagrams/flowchart/flowDb');

import flowParser from './diagrams/flowchart/parser/flow';

const spyOn = jest.spyOn;
import { markerUrl } from './markers';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('markers', function () {
  describe('#markerUrl', function () {
    it('should return #<name> if no parent SVG', function () {
      expect(markerUrl('_', 'foo')).toBe('url(#foo)');
    });

    it('should return #null if no name provided', function () {
      expect(markerUrl('_', undefined)).toBe('url(#null)');
      expect(markerUrl('_', null)).toBe('url(#null)');
    });
  });
});
