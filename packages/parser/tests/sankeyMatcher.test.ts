import { matchAnyRegexps, matchSankeyLinkNode } from '../src/language/sankey/sankeyMatcher.js';
import type { IToken } from '../src/language/chevrotainWrapper.js';

type ChevGroups = {
  [groupName: string]: IToken[];
};

describe('matchAnyRegexps', () => {
  const textToMatch = 'abcdecde';
  const regexp_abc = /abc/;
  const regexp_b = /b/;
  const regexp_cde = /cde/;

  it('false if given an empty list of RegExps', () => {
    expect(matchAnyRegexps(textToMatch, 0, [])).toBeFalsy();
  });

  it('true if there is a match with the STICKY flag set', () => {
    expect(matchAnyRegexps(textToMatch, 0, [regexp_abc, regexp_cde])).toBeTruthy();
    expect(matchAnyRegexps(textToMatch, 2, [regexp_b, regexp_cde])).toBeTruthy();
  });

  it('sets sticky flag; global flag has no effect', () => {
    const regexp_cde_global = new RegExp(regexp_cde, 'g');
    expect(matchAnyRegexps(textToMatch, 3, [regexp_cde_global])).toBeFalsy();
  });
});

describe('matchSankeyLinkNode', () => {
  const validLinkNodeText = '"this is a link node", blah';
  const emptyGroups: ChevGroups = { g: [] };

  it('null if any of the "RegExps to fail" DO match at the starting offset', () => {
    const diagramTitle = 'title: This is the title\n';
    const accTitle = 'accTitle: this is the a11y title\n';
    const accDesc = 'accDesc "this is the a11y desc"\n';
    const shouldMatchOtherRegexps = [accTitle, accDesc, diagramTitle];
    for (const shouldMatchOtherRegexp of shouldMatchOtherRegexps) {
      expect(matchSankeyLinkNode(shouldMatchOtherRegexp, 0, [], emptyGroups)).toBeNull;
    }
  });

  it('targetRegexp is sankeyLinkNodeRegex', () => {
    expect(matchSankeyLinkNode(validLinkNodeText, 2, [], emptyGroups)).toBeTruthy();
  });

  describe('none of the regExpsToFail match', () => {
    it('null if it does not match the target regexp', () => {
      expect(matchSankeyLinkNode('\n', 0, [], emptyGroups)).toBeNull();
    });

    it('returns a RegExpExecArray with the match if the textToMatch matches the target RegExp', () => {
      const result = matchSankeyLinkNode(validLinkNodeText, 0, [], emptyGroups);
      expect(result).toBeInstanceOf(Array);
      // @ts-ignore We know this is an array because the above line is true
      expect(result[0]).toEqual('"this is a link node"');
    });
  });
});
