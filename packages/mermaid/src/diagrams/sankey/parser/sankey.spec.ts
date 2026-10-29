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

    // Non-ASCII labels used to fail with "Expecting 'DQUOTE', got 'ESCAPED_TEXT'",
    // because the TEXTDATA lexer rule only covered U+0020-U+007E.
    // Built as a line array rather than an indented template literal so that no
    // leading whitespace is introduced: leading indentation before a quoted field
    // is a separate, pre-existing limitation (the indent lexes as an empty field).
    const nonAsciiDiagram = [
      '网站,注册,40',
      '"注册","免费试用",30',
      '"Café","Départ",20',
      'Дом,Уход,10',
      '"网站,主站","跳出",5',
      'b😀,c,1', // astral plane: a surrogate pair, matched one half at a time
    ].join('\n');

    const nonAsciiNodes = [
      '网站',
      '注册',
      '免费试用',
      'Café',
      'Départ',
      'Дом',
      'Уход',
      '网站,主站',
      '跳出',
      'b😀',
      'c',
    ];

    for (const syntax of ['sankey-beta', 'sankey'] as const) {
      it(`parses non-ASCII labels with ${syntax} syntax`, function () {
        sankey.parser.parse(prepareTextForParsing(`${syntax}\n${nonAsciiDiagram}`));

        const graph = sankey.parser.yy.getGraph();
        expect(graph.links).toHaveLength(6);
        expect(graph.nodes).toEqual(expect.arrayContaining(nonAsciiNodes.map((id) => ({ id }))));
      });
    }

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
