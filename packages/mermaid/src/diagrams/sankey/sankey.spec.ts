import { parser } from './sankeyParser.js';
import { db } from './sankeyDB.js';
import * as fs from 'fs';
import * as path from 'path';

describe('sankey', () => {
  beforeEach(() => db.clear());

  it('should parse csv', async () => {
    const csv = path.resolve(__dirname, './parser/energy.csv');
    const data = fs.readFileSync(csv, 'utf8');
    const graphDefinition = 'sankey-beta\n\n ' + data;

    void parser.parse(graphDefinition);
  });

  it('allows __proto__ as id', async () => {
    void parser.parse(
      `sankey-beta
      __proto__,A,0.597
      A,__proto__,0.403
      `
    );
  });
});
