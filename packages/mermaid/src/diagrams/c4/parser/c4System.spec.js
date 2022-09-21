import c4Db from '../c4Db';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict',
});

describe.each([
  ['System', 'system'],
  ['SystemDb', 'system_db'],
  ['SystemQueue', 'system_queue'],
  ['System_Ext', 'external_system'],
  ['SystemDb_Ext', 'external_system_db'],
  ['SystemQueue_Ext', 'external_system_queue'],
])('parsing a C4 %s', function (macroName, elementName) {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one System correctly', function () {
    c4.parser.parse(`C4Context
title System Context diagram for Internet Banking System
${macroName}(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")`);

    const yy = c4.parser.yy;

    const shapes = yy.getC4ShapeArray();
    expect(shapes.length).toBe(1);
    const onlyShape = shapes[0];

    expect(onlyShape).toEqual({
      alias: 'SystemAA',
      descr: {
        text: 'Allows customers to view information about their bank accounts, and make payments.',
      },
      label: {
        text: 'Internet Banking System',
      },
      // TODO: Why are link, sprite, and tags undefined instead of not appearing at all?
      //       Compare to Person where they don't show up.
      link: undefined,
      sprite: undefined,
      tags: undefined,
      parentBoundary: 'global',
      typeC4Shape: {
        text: elementName,
      },
      wrap: false,
    });
  });

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, "Internet Banking System")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      alias: 'SystemAA',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, "Internet Banking System")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: 'Internet Banking System',
      },
    });
  });

  it('should parse the description', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, "", "Allows customers to view information about their bank accounts, and make payments.")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      descr: {
        text: 'Allows customers to view information about their bank accounts, and make payments.',
      },
    });
  });

  it('should parse a sprite', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, $sprite="users")`);

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
${macroName}(SystemAA, $link="https://github.com/mermaidjs")`);

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
${macroName}(SystemAA, $tags="tag1,tag2")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: {
          tags: 'tag1,tag2',
        },
      },
    });
  });
});
