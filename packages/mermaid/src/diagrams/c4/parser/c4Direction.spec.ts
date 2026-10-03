import { describe, it, expect, beforeEach } from 'vitest';
import c4Db from '../c4Db.js';
// @ts-ignore: jison parser
import c4 from './c4Diagram.jison';

describe('c4 direction statement', () => {
  beforeEach(() => {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it.each(['TB', 'BT', 'LR', 'RL'])('accepts %s and stores it', (direction) => {
    c4.parser.parse(`C4Context\ndirection ${direction}\nSystem(a, "A")`);
    expect(c4Db.getDirection()).toBe(direction);
  });

  it('defaults to TB when the diagram does not say', () => {
    c4.parser.parse('C4Context\nSystem(a, "A")');
    expect(c4Db.getDirection()).toBe('TB');
  });
});
