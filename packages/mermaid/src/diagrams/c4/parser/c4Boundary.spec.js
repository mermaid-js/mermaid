import c4Db from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.ts';

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
    const boundary = boundaries[1];

    expect(boundary).toEqual({
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

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getBoundarys()[1]).toMatchObject({
      alias: 'b1',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getBoundarys()[1]).toMatchObject({
      label: {
        text: 'BankBoundary',
      },
    });
  });

  it('should parse the type', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "", "company") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getBoundarys()[1]).toMatchObject({
      type: { text: 'company' },
    });
  });

  it('should parse a link', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, $link="https://github.com/mermaidjs") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getBoundarys()[1]).toMatchObject({
      label: {
        text: {
          link: 'https://github.com/mermaidjs',
        },
      },
    });
  });

  it('should parse tags', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, $tags="tag1,tag2") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getBoundarys()[1]).toMatchObject({
      label: {
        text: {
          tags: 'tag1,tag2',
        },
      },
    });
  });
});
