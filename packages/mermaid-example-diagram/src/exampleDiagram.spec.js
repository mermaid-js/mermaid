import { parser } from './parser/exampleDiagram.jison';
import * as db from './exampleDiagramDb.js';
import { injectUtils } from './mermaidUtils.js';
// Todo fix utils functions for tests
import {
  log,
  setLogLevel,
  getConfig,
  sanitizeText,
  setupGraphViewBox,
} from '../../mermaid/src/diagram-api/diagramAPI.js';

injectUtils(log, setLogLevel, getConfig, sanitizeText, setupGraphViewBox);

describe('when parsing an info graph it', function () {
  let ex;
  beforeEach(function () {
    ex = parser;
    ex.yy = db;
  });

  it('should handle an example-diagram definition', function () {
    let str = `example-diagram
    showInfo`;

    ex.parse(str);
  });
});
