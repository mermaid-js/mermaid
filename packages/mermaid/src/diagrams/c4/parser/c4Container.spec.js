import { C4DB } from '../c4Db.js';
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
    c4.parser.yy = new C4DB();
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Container correctly', function () {
    c4.parser.parse(`C4Context
title Container diagram for Internet Banking Container
${macroName}(ContainerAA, "Internet Banking Container", "Technology", "Allows customers to view information about their bank accounts, and make payments.")`);

    const yy = c4.parser.yy;

    const nodes = yy.getNodes();
    expect(nodes.size).toBe(1);
    const node = nodes.get('ContainerAA');

    expect(node).toEqual({
      alias: 'ContainerAA',
      classes: ['default'],
      cssStyles: [],
      descr: 'Allows customers to view information about their bank accounts, and make payments.',
      isBoundary: false,
      label: 'Internet Banking Container',
      link: undefined,
      sprite: undefined,
      tags: undefined,
      parent: 'global',
      shape: 'rect',
      techn: 'Technology',
      type: elementName,
      wrap: false,
    });
  });

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "Internet Banking Container")`);

    expect(c4.parser.yy.getNodes().get('ContainerAA')).toMatchObject({
      alias: 'ContainerAA',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "Internet Banking Container")`);

    expect(c4.parser.yy.getNodes().get('ContainerAA')).toMatchObject({
      label: 'Internet Banking Container',
    });
  });

  it('should parse the technology', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "", "Java")`);

    expect(c4.parser.yy.getNodes().get('ContainerAA')).toMatchObject({
      techn: 'Java',
    });
  });

  it('should parse the description', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, "", "", "Allows customers to view information about their bank accounts, and make payments.")`);

    expect(c4.parser.yy.getNodes().get('ContainerAA')).toMatchObject({
      descr: 'Allows customers to view information about their bank accounts, and make payments.',
    });
  });

  it('should parse a sprite', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, $sprite="users")`);

    expect(c4.parser.yy.getNodes().get('ContainerAA')).toMatchObject({
      label: {
        sprite: 'users',
      },
    });
  });

  it('should parse a link', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, $link="https://github.com/mermaidjs")`);

    expect(c4.parser.yy.getNodes().get('ContainerAA')).toMatchObject({
      label: {
        link: 'https://github.com/mermaidjs',
      },
    });
  });

  it('should parse tags', function () {
    c4.parser.parse(`C4Context
${macroName}(ContainerAA, $tags="tag1+tag2")`);

    expect(c4.parser.yy.getNodes().get('ContainerAA')).toMatchObject({
      label: {
        tags: 'tag1+tag2',
      },
    });
  });
});
