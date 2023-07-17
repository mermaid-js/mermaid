import c4Db from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe.each([
  ['Container', 'container'],
  ['ContainerDb', 'container_db'],
  ['ContainerQueue', 'container_queue'],
  ['Container_Ext', 'external_container'],
  ['ContainerDb_Ext', 'external_container_db'],
  ['ContainerQueue_Ext', 'external_container_queue'],
])('parsing a C4 %s', function (macroName, elementName) {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Container correctly', function () {
    c4.parser.parse(`C4Context
title Container diagram for Internet Banking Container
${macroName}(ContainerAA, "Internet Banking Container", "Technology", "Allows customers to view information about their bank accounts, and make payments.")`);

    const yy = c4.parser.yy;

    const shapes = yy.getC4ShapeArray();
    expect(shapes.length).toBe(1);
    const onlyShape = shapes[0];

    expect(onlyShape).toEqual({
      alias: 'ContainerAA',
      descr: {
        text: 'Allows customers to view information about their bank accounts, and make payments.',
      },
      label: {
        text: 'Internet Banking Container',
      },
      link: undefined,
      sprite: undefined,
      tags: undefined,
      parentBoundary: 'global',
      typeC4Shape: {
        text: elementName,
      },
      techn: {
        text: 'Technology',
      },
      wrap: false,
    });
  });

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "Internet Banking Container")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      alias: 'ContainerAA',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "Internet Banking Container")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: 'Internet Banking Container',
      },
    });
  });

  it('should parse the technology', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "", "Java")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      techn: {
        text: 'Java',
      },
    });
  });

  it('should parse the description', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "", "", "Allows customers to view information about their bank accounts, and make payments.")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      descr: {
        text: 'Allows customers to view information about their bank accounts, and make payments.',
      },
    });
  });

  it('should parse a sprite', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, $sprite="users")`);

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
${macroName}(ContainerAA, $link="https://github.com/mermaidjs")`);

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
${macroName}(ContainerAA, $tags="tag1,tag2")`);

    expect(c4.parser.yy.getC4ShapeArray()[0]).toMatchObject({
      label: {
        text: {
          tags: 'tag1,tag2',
        },
      },
    });
  });
});
