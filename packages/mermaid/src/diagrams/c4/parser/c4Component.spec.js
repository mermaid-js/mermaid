import { C4DB } from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe.each([
  ['Component', 'component'],
  ['ComponentDb', 'component_db'],
  ['ComponentQueue', 'component_queue'],
  ['Component_Ext', 'external_component'],
  ['ComponentDb_Ext', 'external_component_db'],
  ['ComponentQueue_Ext', 'external_component_queue'],
])('parsing a C4 %s', function (macroName, elementName) {
  beforeEach(function () {
    c4.parser.yy = new C4DB();
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Component correctly', function () {
    c4.parser.parse(`C4Component
title Component diagram for Internet Banking Component
${macroName}(ComponentAA, "Internet Banking Component", "Technology", "Allows customers to view information about their bank accounts, and make payments.")`);

    const yy = c4.parser.yy;

    const nodes = yy.getNodes();
    expect(nodes.size).toBe(1);
    const node = nodes.get('ComponentAA');

    expect(node).toMatchObject({
      alias: 'ComponentAA',
      descr: 'Allows customers to view information about their bank accounts, and make payments.',
      label: 'Internet Banking Component',
      techn: 'Technology',
      type: elementName,
    });
  });

  it('should handle a trailing whitespaces after Component', function () {
    const whitespace = ' ';
    const rendered = c4.parser.parse(`C4Component${whitespace}
title Component diagram for Internet Banking Component${whitespace}
${macroName}(ComponentAA, "Internet Banking Component", "Technology", "Allows customers to view information about their bank accounts, and make payments.")${whitespace}`);

    expect(rendered).toBe(true);
  });
});
