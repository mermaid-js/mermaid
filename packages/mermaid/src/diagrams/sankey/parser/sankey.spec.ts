// @ts-ignore: jison doesn't export types
import diagram from './sankey.jison';
// @ts-ignore: jison doesn't export types
import { parser } from './sankey.jison';
import db from '../sankeyDB.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { prepareTextForParsing } from '../sankeyDiagram.js';

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
      const data = fs.readFileSync(csv, 'utf8');

      // Add \n\n + space to emulate possible possible imperfections
      const graphDefinition = prepareTextForParsing(cleanupComments('sankey\n\n ' + data));
      // const textToParse = graphDefinition
      //   .replaceAll(/^[^\S\r\n]+|[^\S\r\n]+$/g, '')
      //   .replaceAll(/([\n\r])+/g, "\n")
      //   .trim();

      parser.parse(graphDefinition);
    });
  });
});
