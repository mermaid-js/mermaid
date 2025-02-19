import { C4DB } from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

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
    c4.parser.yy = new C4DB();
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one System correctly', function () {
    c4.parser.parse(`C4Context
title System Context diagram for Internet Banking System
${macroName}(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")`);

    const yy = c4.parser.yy;

    const nodes = yy.getNodes();
    expect(nodes.size).toBe(1);
    const node = nodes.get('SystemAA');

    expect(node).toEqual({
      alias: 'SystemAA',
      classes: ['default'],
      cssStyles: [],
      isBoundary: false,
      link: '',
      shape: 'rect',
      descr: 'Allows customers to view information about their bank accounts, and make payments.',
      label: 'Internet Banking System',
      parent: 'global',
      type: elementName,
      wrap: false,
    });
  });

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, "Internet Banking System")`);

    expect(c4.parser.yy.getNodes().get('SystemAA')).toMatchObject({
      alias: 'SystemAA',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, "Internet Banking System")`);

    expect(c4.parser.yy.getNodes().get('SystemAA')).toMatchObject({
      label: 'Internet Banking System',
    });
  });

  it('should parse the description', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, "", "Allows customers to view information about their bank accounts, and make payments.")`);

    expect(c4.parser.yy.getNodes().get('SystemAA')).toMatchObject({
      descr: 'Allows customers to view information about their bank accounts, and make payments.',
    });
  });

  it('should parse a sprite', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, $sprite="users")`);

    expect(c4.parser.yy.getNodes().get('SystemAA')).toMatchObject({
      label: {
        sprite: 'users',
      },
    });
  });

  it('should parse a link', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, $link="https://github.com/mermaidjs")`);

    expect(c4.parser.yy.getNodes().get('SystemAA')).toMatchObject({
      label: {
        link: 'https://github.com/mermaidjs',
      },
    });
  });

  it('should parse tags', function () {
    c4.parser.parse(`C4Context
${macroName}(SystemAA, $tags="tag1+tag2")`);

    expect(c4.parser.yy.getNodes().get('SystemAA')).toMatchObject({
      label: {
        tags: 'tag1+tag2',
      },
    });
  });
});
