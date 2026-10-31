import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

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

    const boundaries = yy.getBoundaries();
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

    expect(c4.parser.yy.getBoundaries()[1]).toMatchObject({
      alias: 'b1',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getBoundaries()[1]).toMatchObject({
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

    expect(c4.parser.yy.getBoundaries()[1]).toMatchObject({
      type: { text: 'company' },
    });
  });

  it('should parse a link', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, $link="https://github.com/mermaidjs") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getBoundaries()[1]).toMatchObject({
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

    expect(c4.parser.yy.getBoundaries()[1]).toMatchObject({
      label: {
        text: {
          tags: 'tag1,tag2',
        },
      },
    });
  });

  // Regression test for #4864: relations may target a boundary, so getC4Shape must resolve
  // boundary aliases as well as shape aliases (the renderer uses it to find rel endpoints).
  it('should resolve a boundary alias as a relation endpoint', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}
Rel(b1, SystemAA, "Contains")`);

    const yy = c4.parser.yy;
    // Identity rather than a matching alias: this proves the endpoint resolved from the
    // boundaries array, not from a shape that happens to carry the same alias.
    const boundary = yy.getBoundaries().find((b: { alias: string }) => b.alias === 'b1');
    expect(boundary).toBeDefined();
    expect(yy.getC4Shape('b1')).toBe(boundary);
    expect(yy.getC4Shape('SystemAA')).toMatchObject({
      alias: 'SystemAA',
      typeC4Shape: { text: 'system' },
    });
    expect(yy.getC4Shape('missing')).toBeUndefined();
  });
});
