// @ts-ignore: jison doesn't export types
import diagram from './sankey.jison';
// @ts-ignore: jison doesn't export types
import { parser } from './sankey.jison';
import db from '../sankeyDB.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { prepareTextForParsing } from '../sankeyUtils.js';

describe('Sankey diagram', function () {
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
      const data = fs.readFileSync(csv, 'utf8');
      const graphDefinition = prepareTextForParsing(cleanupComments('sankey\n\n ' + data));

      parser.parse(graphDefinition);
    });
  });
});
