import c4Db from '../c4Db.js';
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
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Component correctly', function () {
    c4.parser.parse(`C4Component
title Component diagram for Internet Banking Component
${macroName}(ComponentAA, "Internet Banking Component", "Technology", "Allows customers to view information about their bank accounts, and make payments.")`);

    const yy = c4.parser.yy;

    const shapes = yy.getC4ShapeArray();
    expect(shapes.length).toBe(1);
    const onlyShape = shapes[0];

    expect(onlyShape).toMatchObject({
      alias: 'ComponentAA',
      descr: {
        text: 'Allows customers to view information about their bank accounts, and make payments.',
      },
      label: {
        text: 'Internet Banking Component',
      },
      techn: {
        text: 'Technology',
      },
      typeC4Shape: {
        text: elementName,
      },
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
