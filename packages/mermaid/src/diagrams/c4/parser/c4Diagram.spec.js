import { C4DB } from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a C4 diagram', function () {
  beforeEach(function () {
    c4.parser.yy = new C4DB();
    c4.parser.yy.clear();
  });

  it('should handle a trailing whitespaces after statements', function () {
    const whitespace = ' ';
    const rendered = c4.parser.parse(`C4Context${whitespace}
title System Context diagram for Internet Banking System${whitespace}
Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")${whitespace}`);

    expect(rendered).toBe(true);
  });

  it('should handle parameter names that are keywords', function () {
    c4.parser.parse(`C4Context
title title
Person(Person, "Person", "Person")`);

    const yy = c4.parser.yy;
    expect(yy.getDiagramTitle()).toBe('title');

    const nodes = yy.getNodes();
    expect(nodes.size).toBe(1);
    const node = nodes.get('Person');

    expect(node.alias).toBe('Person');
    expect(node.descr).toBe('Person');
    expect(node.label).toBe('Person');
  });

  it('should allow default in the parameters', function () {
    c4.parser.parse(`C4Context
Person(default, "default", "default")`);

    const yy = c4.parser.yy;

    const nodes = yy.getNodes();
    expect(nodes.size).toBe(1);
    const node = nodes.get('default');

    expect(node.alias).toBe('default');
    expect(node.descr).toBe('default');
    expect(node.label).toBe('default');
  });

  it('should parse the direction statement', function () {
    c4.parser.parse(`C4Context\ndirection RL\n`);

    expect(c4.parser.yy.getDirection()).toBe('RL');
  });

  it('should parse legend statements', function () {
    c4.parser.parse(`C4Context\nSHOW_LEGEND()\nUPDATE_LEGEND_TITLE("My Legend Title")\n`);

    expect(c4.parser.yy.getLegendData()).toMatchObject({
      title: ['My Legend Title'],
      items: [],
    });

    expect(c4.parser.yy.shouldShowLegend()).toBe(true);
  });
});
