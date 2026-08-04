import { resolve } from 'node:path';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { assertParserParity, loadParserFixtures } from '../common/parser/parserTestUtils.js';
import { db } from './pieDb.js';
import { parser } from './pieParser.js';

setConfig({
  securityLevel: 'strict',
});

const fixtures = loadParserFixtures(
  resolve(process.cwd(), 'cypress/platform/dev-diagrams/parser-update/pie')
);

// Automated parity gate: every fixture must fill `db` identically under both engines.
assertParserParity({
  diagramId: 'pie',
  parser,
  clear: () => db.clear(),
  snapshot: () => ({
    sections: [...db.getSections().entries()],
    showData: db.getShowData(),
    title: db.getDiagramTitle(),
    accTitle: db.getAccTitle(),
    accDescr: db.getAccDescription(),
  }),
  inputs: fixtures,
});
