import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a C4 direction statement', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should default to TB when no direction statement is given', function () {
    c4.parser.parse(`C4Context
Person(customerA, "Banking Customer A")`);

    expect(c4.parser.yy.getDirection()).toBe('TB');
  });

  it.each(['TB', 'BT', 'LR', 'RL'])('should parse direction %s', function (dir) {
    c4.parser.parse(`C4Context
direction ${dir}
Person(customerA, "Banking Customer A")`);

    expect(c4.parser.yy.getDirection()).toBe(dir);
  });

  it('should parse a direction statement after other statements', function () {
    c4.parser.parse(`C4Context
title Banking System
Person(customerA, "Banking Customer A")
direction LR
System(SystemAA, "Internet Banking System")`);

    expect(c4.parser.yy.getDirection()).toBe('LR');
    expect(c4.parser.yy.getC4ShapeArray()).toHaveLength(2);
  });

  it('should reset the direction on clear', function () {
    c4.parser.parse(`C4Context
direction RL
Person(customerA, "Banking Customer A")`);

    c4.parser.yy.clear();
    expect(c4.parser.yy.getDirection()).toBe('TB');
  });
});
