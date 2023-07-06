// @ts-ignore: jison doesn't export types
import railroad from './railroad.jison';
// import { prepareTextForParsing } from '../railroadUtils.js';
import * as fs from 'fs';
import * as path from 'path';
import { cleanupComments } from '../../diagram-api/comments.js';
import { db } from './railroadDB.js';

describe('Railroad diagram', function () {
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      railroad.parser.yy = db;
      railroad.parser.yy.clear();
    });

    it('parses csv', async () => {
      const csv = path.resolve(__dirname, './energy.csv');
      const data = fs.readFileSync(csv, 'utf8');
      // const graphDefinition = prepareTextForParsing(cleanupComments('railroad-beta\n\n ' + data));
      const graphDefinition = cleanupComments('railroad-beta\n\n ' + data);

      railroad.parser.parse(graphDefinition);
    });
  });
});
