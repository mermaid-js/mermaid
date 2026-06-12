import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing C4 AddElementTag and AddRelTag', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should parse AddElementTag with positional arguments', function () {
    c4.parser.parse(`C4Context
AddElementTag(v1.0, "#d73027", "#ffffff", "#a50026")`);

    expect(c4.parser.yy.getElementTags()).toEqual([
      {
        tagName: 'v1.0',
        bgColor: '#d73027',
        fontColor: '#ffffff',
        borderColor: '#a50026',
      },
    ]);
  });

  it('should parse AddElementTag with named arguments', function () {
    c4.parser.parse(`C4Context
AddElementTag(deprecated, $bgColor="grey", $borderColor="red", $shape="RoundedBoxShape")`);

    expect(c4.parser.yy.getElementTags()).toEqual([
      {
        tagName: 'deprecated',
        bgColor: 'grey',
        borderColor: 'red',
        shape: 'RoundedBoxShape',
      },
    ]);
  });

  it('should merge repeated AddElementTag definitions for the same tag', function () {
    c4.parser.parse(`C4Context
AddElementTag(v1.0, $bgColor="grey")
AddElementTag(v1.0, $fontColor="red")`);

    expect(c4.parser.yy.getElementTags()).toEqual([
      {
        tagName: 'v1.0',
        bgColor: 'grey',
        fontColor: 'red',
      },
    ]);
  });

  it('should parse AddRelTag with positional arguments', function () {
    c4.parser.parse(`C4Context
AddRelTag(async, "blue", "green")`);

    expect(c4.parser.yy.getRelTags()).toEqual([
      {
        tagName: 'async',
        textColor: 'blue',
        lineColor: 'green',
      },
    ]);
  });

  it('should parse AddRelTag with named arguments', function () {
    c4.parser.parse(`C4Context
AddRelTag(async, $lineColor="green")`);

    expect(c4.parser.yy.getRelTags()).toEqual([
      {
        tagName: 'async',
        lineColor: 'green',
      },
    ]);
  });

  it('should reset defined tags on clear', function () {
    c4.parser.parse(`C4Context
AddElementTag(v1.0, $bgColor="grey")
AddRelTag(async, $lineColor="green")`);

    c4.parser.yy.clear();
    expect(c4.parser.yy.getElementTags()).toEqual([]);
    expect(c4.parser.yy.getRelTags()).toEqual([]);
  });
});
