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
      const fs = await import('fs');
      const path = await import('path');
      const csv = path.resolve(__dirname, './energy.csv');
      fs.readFile(csv, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          throw err;
        }

        const str = `sankey\\n${data}`;

        parser.parse(str);
      });
    });
  });
});
