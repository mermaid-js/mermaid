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

    it('parses csv with sankey-beta syntax', () => {
      const csv = path.resolve(__dirname, './energy.csv');
      const data = fs.readFileSync(csv, 'utf8');
      const graphDefinition = prepareTextForParsing(cleanupComments('sankey-beta\n\n ' + data));

      sankey.parser.parse(graphDefinition);
    });

    it('parses csv with sankey syntax', () => {
      const csv = path.resolve(__dirname, './energy.csv');
      const data = fs.readFileSync(csv, 'utf8');
      const graphDefinition = prepareTextForParsing(cleanupComments('sankey\n\n ' + data));

      sankey.parser.parse(graphDefinition);
    });

    it('allows __proto__ as id with sankey-beta syntax', function () {
      sankey.parser.parse(
        prepareTextForParsing(`sankey-beta
      __proto__,A,0.597
      A,__proto__,0.403
      `)
      );
    });

    it('allows __proto__ as id with sankey syntax', function () {
      sankey.parser.parse(
        prepareTextForParsing(`sankey
      __proto__,A,0.597
      A,__proto__,0.403
      `)
      );
    });

    describe.each(['sankey-beta', 'sankey'])('%s record whitespace', (syntax) => {
      describe.each([
        ['LF', '\n'],
        ['CRLF', '\r\n'],
      ])('with %s line endings', (_name, newline) => {
        it.each([
          {
            description: 'trailing whitespace after the header',
            text: ' \t\na,b,1',
            links: [{ source: 'a', target: 'b', value: 1 }],
          },
          {
            description: 'tab indentation',
            text: '\n\ta,b,1\nc,d,2',
            links: [
              { source: 'a', target: 'b', value: 1 },
              { source: 'c', target: 'd', value: 2 },
            ],
          },
          {
            description: 'whitespace-only rows',
            text: '\na,b,1\n \t \n\nc,d,2',
            links: [
              { source: 'a', target: 'b', value: 1 },
              { source: 'c', target: 'd', value: 2 },
            ],
          },
          {
            description: 'whitespace before a quoted source',
            text: '\na,b,1\n \t"c d",e,2',
            links: [
              { source: 'a', target: 'b', value: 1 },
              { source: 'c d', target: 'e', value: 2 },
            ],
          },
          {
            description: 'whitespace after a quoted value',
            text: '\nd,e,"2" \t\ng,h,3',
            links: [
              { source: 'd', target: 'e', value: 2 },
              { source: 'g', target: 'h', value: 3 },
            ],
          },
        ])('ignores $description', ({ text, links }) => {
          sankey.parser.parse(prepareTextForParsing(`${syntax}${text.replaceAll('\n', newline)}`));

          expect(db.getGraph().links).toEqual(links);
        });

        it('preserves whitespace, blank lines, commas and escaped quotes inside quoted fields', () => {
          const source = `a  ${newline}  b, "quoted"${newline}${newline}c`;
          const text = `${syntax}${newline}"a  ${newline}  b, ""quoted""${newline}${newline}c",target,2`;

          sankey.parser.parse(prepareTextForParsing(text));

          expect(db.getGraph().links).toEqual([{ source, target: 'target', value: 2 }]);
        });

        it.each(['"a,b,1', '"a"x,b,1', 'a,b,1,extra', 'a,b', 'a,"b" x,1', 'a,\tb,1'])(
          'still rejects malformed CSV: %j',
          (record) => {
            expect(() =>
              sankey.parser.parse(prepareTextForParsing(`${syntax}${newline}${record}`))
            ).toThrow();
          }
        );
      });
    });

    it.each(['\n', '\r\n'])('preserves Unicode and quoted content when preparing %j', (newline) => {
      const record = `"能源  ${newline}  café, ""🌊""${newline}${newline}fin",目标,2`;
      const text = ` \tsankey \t${newline} \t${record} \t${newline} \t${newline}`;

      // Unicode tokenization is independent of whitespace preprocessing.
      expect(prepareTextForParsing(text)).toBe(`sankey\n${record}`);
    });

    const issue7528PerformanceDiagram = `
      Agricultural 'waste',Bio-conversion,124.729
      Bio-conversion,Liquid,0.597
      Bio-conversion,Losses,26.862
      Bio-conversion,Solid,280.322
      Bio-conversion,Gas,81.144
      Biofuel imports,Liquid,35
      Biomass imports,Solid,35
      Coal imports,Coal,11.606
      Coal reserves,Coal,63.965
      Coal,Solid,75.571
      District heating,Industry,10.639
      District heating,Heating and cooling - homes,22.505
      District heating,Heating and cooling - commercial,46.184
      Electricity grid,Over generation / exports,104.453
      Electricity grid,Lighting & appliances - commercial,113.726
      Electricity grid,Lighting & appliances - homes,27.14
      `;

    const issue7528SpecialCharacterNodes = [
      "Agricultural 'waste'",
      'Heating and cooling - homes',
      'Heating and cooling - commercial',
      'Over generation / exports',
      'Lighting & appliances - commercial',
      'Lighting & appliances - homes',
    ];

    for (const syntax of ['sankey-beta', 'sankey'] as const) {
      it(`parses the issue #7528 sample with ${syntax} syntax`, function () {
        sankey.parser.parse(prepareTextForParsing(`${syntax}${issue7528PerformanceDiagram}`));

        const graph = sankey.parser.yy.getGraph();
        expect(graph.nodes).toHaveLength(19);
        expect(graph.links).toHaveLength(16);
        expect(graph.nodes).toEqual(
          expect.arrayContaining(issue7528SpecialCharacterNodes.map((id) => ({ id })))
        );
      });
    }
  });
});
