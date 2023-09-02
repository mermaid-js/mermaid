import { parser } from './sankeyParser.js';
import { db } from './sankeyDB.js';
import * as fs from 'fs';
import * as path from 'path';

describe('sankey', () => {
  beforeEach(() => db.clear());

  it('should parse csv', () => {
    const csv = path.resolve(__dirname, './parser/energy.csv');
    const data = fs.readFileSync(csv, 'utf8');
    const graphDefinition = 'sankey-beta\n\n ' + data;

    parser.parse(graphDefinition);
  });
});
