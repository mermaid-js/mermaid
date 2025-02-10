import { C4DB } from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a C4 Person_Ext', function () {
  beforeEach(function () {
    c4.parser.yy = new C4DB();
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Person_Ext correctly', function () {
    c4.parser.parse(`C4Context
title System Context diagram for Internet Banking System
Person_Ext(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")`);

    const yy = c4.parser.yy;

    const nodes = yy.getNodes();
    expect(nodes.size).toBe(1);
    const node = nodes.get('customerA');

    expect(node).toEqual({
      alias: 'customerA',
      classes: ['default'],
      cssStyles: [],
      isBoundary: false,
      descr: 'A customer of the bank, with personal bank accounts.',
      label: 'Banking Customer A',
      link: '',
      shape: 'rect',
      parent: 'global',
      type: 'external_person',
      wrap: false,
    });
  });

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, "Banking Customer A")`);

    expect(c4.parser.yy.getNodes().get('customerA')).toMatchObject({
      alias: 'customerA',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, "Banking Customer A")`);

    expect(c4.parser.yy.getNodes().get('customerA')).toMatchObject({
      label: 'Banking Customer A',
    });
  });

  it('should parse the description', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, "", "A customer of the bank, with personal bank accounts.")`);

    expect(c4.parser.yy.getNodes().get('customerA')).toMatchObject({
      descr: 'A customer of the bank, with personal bank accounts.',
    });
  });

  it('should parse a sprite', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, $sprite="users")`);

    expect(c4.parser.yy.getNodes().get('customerA')).toMatchObject({
      label: {
        sprite: 'users',
      },
    });
  });

  it('should parse a link', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, $link="https://github.com/mermaidjs")`);

    expect(c4.parser.yy.getNodes().get('customerA')).toMatchObject({
      label: {
        link: 'https://github.com/mermaidjs',
      },
    });
  });

  it('should parse tags', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, $tags="tag1,tag2")`);

    expect(c4.parser.yy.getNodes().get('customerA')).toMatchObject({
      label: {
        tags: 'tag1,tag2',
      },
    });
  });
});
