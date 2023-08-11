// @ts-ignore: jison doesn't export types
import sankey from './sankey.jison';
import db from '../sankeyDB.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { prepareTextForParsing } from '../sankeyUtils.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Sankey diagram', function () {
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      sankey.parser.yy = db;
      sankey.parser.yy.clear();
    });

    it('parses csv', async () => {
      const csv = path.resolve(__dirname, './energy.csv');
      const data = fs.readFileSync(csv, 'utf8');
      const graphDefinition = prepareTextForParsing(cleanupComments('sankey-beta\n\n ' + data));

      sankey.parser.parse(graphDefinition);
    });
  });
});
