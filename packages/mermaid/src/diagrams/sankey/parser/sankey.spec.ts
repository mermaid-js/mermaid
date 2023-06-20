// @ts-ignore: jison doesn't export types
import diagram from './sankey.jison';
// @ts-ignore: jison doesn't export types
import { parser } from './sankey.jison';
import db from '../sankeyDB.js';
// import { fail } from 'assert';

describe('Sankey diagram', function () {
  // TODO - these examples should be put into ./parser/stateDiagram.spec.js
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = db;
      diagram.parser.yy = db;
      diagram.parser.yy.clear();
    });

    it('parses csv', async () => {
      const fs = require('fs');
      const path = require('path').resolve(__dirname, './energy.csv');
      await fs.readFile(path, 'utf8', (err: Error, data: string) => {
        if (err) throw err;

        const str = `sankey\\n${data}`;

        parser.parse(str);
      });
    });
  });
});
