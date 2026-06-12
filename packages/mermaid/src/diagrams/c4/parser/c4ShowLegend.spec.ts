import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a C4 SHOW_LEGEND statement', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should default to no legend', function () {
    c4.parser.parse(`C4Context
Person(customerA, "Banking Customer A")`);

    expect(c4.parser.yy.getShowLegend()).toBe(false);
  });

  it('should enable the legend with SHOW_LEGEND()', function () {
    c4.parser.parse(`C4Context
Person(customerA, "Banking Customer A")
SHOW_LEGEND()`);

    expect(c4.parser.yy.getShowLegend()).toBe(true);
  });

  it('should reset the legend flag on clear', function () {
    c4.parser.parse(`C4Context
Person(customerA, "Banking Customer A")
SHOW_LEGEND()`);

    c4.parser.yy.clear();
    expect(c4.parser.yy.getShowLegend()).toBe(false);
  });
});
