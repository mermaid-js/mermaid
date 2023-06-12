import { setConfig } from '../../config.js';
import classParser from './classParser.js';
// @ts-ignore - no types in jison
import classDiagram from './parser/classDiagram.jison';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing class diagram', function () {
  beforeEach(function () {
    classDiagram.parser.yy = classParser;
    classDiagram.parser.yy.clear();
  });
});
