import { C4DB } from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe.each(['Boundary'])('parsing a C4 %s', function (macroName) {
  beforeEach(function () {
    c4.parser.yy = new C4DB();
    c4.parser.yy.clear();
  });

  it('should parse a C4 diagram with one Boundary correctly', function () {
    c4.parser.parse(`C4Context
title System Context diagram for Internet Banking System
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}`);

    const yy = c4.parser.yy;

    const nodes = yy.getNodes();
    expect(nodes.size).toBe(2);
    const boundary = nodes.get('b1');

    expect(boundary).toMatchObject({
      isBoundary: true,
      alias: 'b1',
      label: 'BankBoundary',
    });
  });

  it('should parse the alias', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getNodes().get('b1')).toMatchObject({
      alias: 'b1',
    });
  });

  it('should parse the label', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getNodes().get('b1')).toMatchObject({
      label: 'BankBoundary',
    });
  });

  it('should parse the type', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, "", "company") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getNodes().get('b1')).toMatchObject({
      type: 'company',
    });
  });

  it('should parse a link', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, $link="https://github.com/mermaidjs") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getNodes().get('b1')).toMatchObject({
      label: {
        link: 'https://github.com/mermaidjs',
      },
    });
  });

  it('should parse tags', function () {
    c4.parser.parse(`C4Context
${macroName}(b1, $tags="tag1+tag2") {
System(SystemAA, "Internet Banking System")
}`);

    expect(c4.parser.yy.getNodes().get('b1')).toMatchObject({
      label: {
        tags: 'tag1+tag2',
      },
    });
  });
});
