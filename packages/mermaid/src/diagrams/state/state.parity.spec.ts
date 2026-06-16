import { resolve } from 'node:path';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { loadParserFixtures } from '../common/parser/parserTestUtils.js';
import { StateDB } from './stateDb.js';
import { parser } from './stateParser.js';

setConfig({ securityLevel: 'strict' });

const fixtures = loadParserFixtures(
  resolve(process.cwd(), 'cypress/platform/dev-diagrams/parser-update/state')
);

/** A plain, comparable view of the populated `StateDB`. */
const snapshot = (db: StateDB) => ({
  states: Object.fromEntries(
    [...db.getStates()].map(([id, state]) => [
      id,
      {
        type: state.type,
        descriptions: state.descriptions,
        classes: state.classes,
        note: state.note,
        hasDoc: Boolean(state.doc),
      },
    ])
  ),
  relations: db
    .getRelations()
    .map((rel) => ({ id1: rel.id1, id2: rel.id2, title: rel.relationTitle })),
  classes: [...db.getClasses().keys()],
});

// Automated parity gate: every fixture must fill `StateDB` identically under both engines.
describe('state parser parity (legacy ↔ chevrotain)', () => {
  it.each(fixtures)('produces identical db for $name', ({ source }) => {
    const runWith = (engine: 'legacy' | 'chevrotain') => {
      setConfig({ parser: { state: engine } });
      const db = new StateDB(2);
      parser.yy = db;
      parser.parse(source);
      return snapshot(db);
    };
    const legacy = runWith('legacy');
    const chevrotain = runWith('chevrotain');
    expect(chevrotain).toStrictEqual(legacy);
  });
});
