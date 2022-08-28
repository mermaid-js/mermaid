import c4Db from '../c4Db';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict',
});

describe.each(['Boundary'])('parsing a C4 %s', function (macroName) {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Boundary correctly', function () {
    c4.parser.parse(`C4Context
title System Context diagram for Internet Banking System
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}`);

    const yy = c4.parser.yy;

    const boundaries = yy.getBoundarys();
    expect(boundaries.length).toBe(2);
    const onlyShape = boundaries[1];

    expect(onlyShape).toEqual({
      alias: 'b1',
      label: {
        text: 'BankBoundary',
      },
      // TODO: Why are link, and tags undefined instead of not appearing at all?
      //       Compare to Person where they don't show up.
      link: undefined,
      tags: undefined,
      parentBoundary: 'global',
      type: {
        // TODO: Why is this `system` instead of `boundary`?
        text: 'system',
      },
      wrap: false,
    });
  });
});
