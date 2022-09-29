import c4Db from '../c4Db';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a C4 Person_Ext', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Person_Ext correctly', function () {
    c4.parser.parse(`C4Context
title System Context diagram for Internet Banking System
Person_Ext(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")`);

    const yy = c4.parser.yy;

    const shapes = yy.getC4ShapeArray();
    expect(shapes.length).toBe(1);
    const onlyShape = shapes[0];

    expect(onlyShape).toEqual({
      alias: 'customerA',
      descr: {
        text: 'A customer of the bank, with personal bank accounts.',
      },
      label: {
        text: 'Banking Customer A',
      },
      // TODO: Why are link, sprite, and tags undefined instead of not appearing at all?
      //       Compare to Person where they don't show up.
      link: undefined,
      sprite: undefined,
      tags: undefined,
      parentBoundary: 'global',
      typeC4Shape: {
        text: 'external_person',
      },
      wrap: false,
    });
  });

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, "Banking Customer A")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      alias: 'customerA',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, "Banking Customer A")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: 'Banking Customer A',
      },
    });
  });

  it('should parse the description', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, "", "A customer of the bank, with personal bank accounts.")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      descr: {
        text: 'A customer of the bank, with personal bank accounts.',
      },
    });
  });

  it('should parse a sprite', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, $sprite="users")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: {
          sprite: 'users',
        },
      },
    });
  });

  it('should parse a link', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, $link="https://github.com/mermaidjs")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: {
          link: 'https://github.com/mermaidjs',
        },
      },
    });
  });

  it('should parse tags', function () {
    c4.parser.parse(`C4Context
Person_Ext(customerA, $tags="tag1,tag2")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: {
          tags: 'tag1,tag2',
        },
      },
    });
  });
});
