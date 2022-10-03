// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

import { LALRGenerator } from 'jison';

describe('class diagram grammar', function () {
  it('should introduce no new conflicts', function () {
    const file = require.resolve('./parser/classDiagram.jison');
    const grammarSource = fs.readFileSync(file, 'utf8');
    const grammarParser = new LALRGenerator(grammarSource, {});
    expect(grammarParser.conflicts < 16).toBe(true);
  });
});
