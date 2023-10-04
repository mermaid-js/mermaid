import { accessibilityDescrRegex, accessibilityTitleRegex, titleRegex } from '../common/matcher.js';

import type {
  CustomPatternMatcherFunc,
  CustomPatternMatcherReturn,
  IToken,
} from '../chevrotainWrapper.js';

/**
 * Matches sankey link source and target node
 */
export const sankeyLinkNodeRegex = /(?:"((?:""|[^"])+)")|([^\n\r,]+(?=%%)|[^\n\r,]+)/;

/**
 * Matches sankey link value
 */
export const sankeyLinkValueRegex = /("(?:0|[1-9]\d*)(?:\.\d+)?"|[\t ]*(?:0|[1-9]\d*)(?:\.\d+)?)/;

type CustomMatchResult = CustomPatternMatcherReturn | RegExpExecArray | null;

const STICKY_FLAG = 'y';

/**
 * Try to match the text with a SankeyNodeLink.
 *
 * These have to be checked first because they take precedence.
 * Langium does not provide any way to specify precedence for grammars (or parts thereof)
 * that are `imported` into another grammar definition file (e.g. sankey.langium).
 * Specifically, the order of _tokens_ defined in the imported file (e.g. common.langium)
 * may or may not come before (or after) the _tokens_ defined in the including file (e.g. sankey.langium).
 *
 * Thus, we have to manually handle this by first checking for matches that should take precedence
 * (in this case title, accessibility title, and accessibility description)
 * over matching this token.
 *
 * First check if the text matches a title, accessibility title, or accessibility description.
 * If it matches one of those, return null (no match with a SankeyNodeLink).
 *
 * If it does not match one of those, then check to see if the text matches the
 * SankeyNodeLink Regexp.
 *
 * Note that _all_ regular expressions have the sticky flag set.
 *
 * @param text - text to check for matches
 * @param startingOffset - offset to start at
 * @param _tokens - ITokens previously matched (unused)
 * @param _groups - named grammar groups (unused)
 *
 * @returns  Null if there is no match, else return the RegExpExecArray with the match.
 */
export const matchSankeyLinkNode: CustomPatternMatcherFunc = (
  text: string,
  startingOffset = 0,
  _tokens: IToken[],
  _groups
): CustomMatchResult => {
  const regexpsToFail: RegExp[] = [accessibilityDescrRegex, accessibilityTitleRegex, titleRegex];
  const targetRegexp: RegExp = sankeyLinkNodeRegex;

  const matchedOtherPatterns = matchAnyRegexps(text, startingOffset, regexpsToFail);
  if (matchedOtherPatterns) {
    return null;
  }
  const stickyTargetRegexp = new RegExp(targetRegexp, targetRegexp.flags + 'y');
  stickyTargetRegexp.lastIndex = startingOffset;
  return stickyTargetRegexp.exec(text);
};

/**
 * Check to see if text matches any of the given RegExps. Return true as soon
 * as there is a match. Use the sticky flag on all RegExps.
 *
 * @param text - the string to try to match
 * @param startingOffset - offset to start at
 * @param regexps - a list of RegExps to check for matches
 * @internal
 *
 * @returns true if the text matches any of the RegExps (with the sticky flag set),
 *    else returns false.
 */
export function matchAnyRegexps(text: string, startingOffset = 0, regexps: RegExp[] = []): boolean {
  const notFound = false;
  for (const regexp of regexps) {
    const currentRegexp = new RegExp(regexp, regexp.flags + STICKY_FLAG);
    currentRegexp.lastIndex = startingOffset;
    if (currentRegexp.exec(text) !== null) {
      return true;
    }
  }
  return notFound;
}
