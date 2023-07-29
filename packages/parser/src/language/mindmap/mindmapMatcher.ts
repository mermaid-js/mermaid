import { CustomPatternMatcherFunc, IToken, createTokenInstance } from 'chevrotain';
import { indentStack } from './mindmapLexer.js';
import { isRegExpAhead, t } from './mindmapUtil.js';
import {
  accessibilityDescrRegex,
  accessibilityTitleRegex,
  titleRegex,
} from '../common/commonMatcher.js';
import { MINDMAP_OUTDENT } from './mindmapTokenBuilder.js';

export const mindmapAccessibilityDescrRegex = new RegExp(
  '[\t ]+' + accessibilityDescrRegex.source,
  accessibilityDescrRegex.flags
);
export const matchMindmapAccessibilityDescr: CustomPatternMatcherFunc = (text, startOffset) => {
  mindmapAccessibilityDescrRegex.lastIndex = startOffset;
  return mindmapAccessibilityDescrRegex.exec(text);
};

export const mindmapAccessibilityTitleRegex = new RegExp(
  '[\t ]+' + accessibilityTitleRegex.source,
  accessibilityTitleRegex.flags
);
export const matchMindmapAccessibilityTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  mindmapAccessibilityTitleRegex.lastIndex = startOffset;
  return mindmapAccessibilityTitleRegex.exec(text);
};

export const mindmapTitleRegex = new RegExp(
  '[\t ]+' + titleRegex.source,
  accessibilityDescrRegex.flags
);
export const matchMindmapTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  mindmapTitleRegex.lastIndex = startOffset;
  return mindmapTitleRegex.exec(text);
};

/**
 *
 */
export const matchMindmapOutdent: CustomPatternMatcherFunc = (text, startOffset, matchedTokens) => {
  const { isFirstLine, isStartOfLine } = t(startOffset, matchedTokens);

  // indentation can only be matched at the start of a line.
  if (isFirstLine || isStartOfLine) {
    let currIndentLevel: number;

    const whitespaceRegex = /[\t ]+/y;
    whitespaceRegex.lastIndex = startOffset;
    const match = whitespaceRegex.exec(text);
    // possible non-empty indentation
    if (match !== null) {
      currIndentLevel = match[0].length;
    }
    // "empty" indentation means indentLevel of 0.
    else {
      currIndentLevel = 0;
    }

    const prevIndentLevel: number = indentStack[indentStack.length - 1];
    // shallower indentation
    if (currIndentLevel < prevIndentLevel) {
      const matchIndentIndex: number = indentStack.reverse().indexOf(currIndentLevel);

      // any outdent must match some previous indentation level.
      if (matchIndentIndex === -1) {
        throw new Error(`invalid outdent at offset: ${startOffset}`);
      }

      const numberOfDedents: number = indentStack.length - matchIndentIndex - 1;

      // This is a little tricky
      // 1. If there is no match (0 level indent) than this custom token
      //    matcher would return "null" and so we need to add all the required outdents ourselves.
      // 2. If there was match (> 0 level indent) than we need to add minus one number of outdents
      //    because the lexer would create one due to returning a none null result.
      const iStart: 0 | 1 = match !== null ? 1 : 0;
      const lastMatchedToken: IToken = matchedTokens[matchedTokens.length - 1];
      for (let i = iStart; i < numberOfDedents; i++) {
        indentStack.pop();
        matchedTokens.push(
          createTokenInstance(
            MINDMAP_OUTDENT,
            '',
            lastMatchedToken.startOffset,
            lastMatchedToken.endOffset ?? NaN,
            lastMatchedToken.startLine ?? NaN,
            lastMatchedToken.endLine ?? NaN,
            lastMatchedToken.startColumn ?? NaN,
            lastMatchedToken.endColumn ?? NaN
          )
        );
      }

      // even though we are adding fewer outdents directly we still need to update the indent stack fully.
      if (iStart === 1) {
        indentStack.pop();
      }
      return match;
    } else {
      // same indent, this should be lexed as simple whitespace and ignored
      return null;
    }
  } else {
    // indentation cannot be matched under other circumstances
    return null;
  }
};

/**
 *
 */
export const matchMindmapIndent: CustomPatternMatcherFunc = (text, startOffset, matchedTokens) => {
  const { isFirstLine, isStartOfLine } = t(startOffset, matchedTokens);
  const isNodeAhead = !isRegExpAhead(text, startOffset, lookahead);

  // indentation can only be matched at the start of a line.
  if (isNodeAhead && (isFirstLine || isStartOfLine)) {
    let currIndentLevel: number;

    const whitespaceRegex = /[\t ]+/y;
    whitespaceRegex.lastIndex = startOffset;
    const match = whitespaceRegex.exec(text);
    // possible non-empty indentation
    if (match !== null) {
      currIndentLevel = match[0].length;
    }
    // "empty" indentation means indentLevel of 0.
    else {
      currIndentLevel = 0;
    }

    const prevIndentLevel = indentStack[indentStack.length - 1];
    // deeper indentation
    if (currIndentLevel > prevIndentLevel) {
      indentStack.push(currIndentLevel);
      return match;
    } else {
      // same indent, this should be lexed as simple whitespace and ignored
      return null;
    }
  } else {
    // indentation cannot be matched under other circumstances
    return null;
  }
};

/**
 * Matches a mindmap class
 */
export const mindmapClassRegex = /[\t ]*:::([^\n\r)]+)/;

/**
 * Matches a mindmap icon
 */
export const mindmapIconRegex = /[\t ]*::icon\(([^\n\r)]+)\)[\t ]*/;

/**
 * Matches a mindmap node id
 */
export const mindmapNodeIdRegex = /([^\n\r()[{]+)/y;
export const matchMindmapNodeId: CustomPatternMatcherFunc = (text, startOffset) => {
  const isNodeShapeAhead = isRegExpAhead(text, startOffset, nodeShapeTitles);

  // if it's a shape node, then it has an id
  if (isNodeShapeAhead) {
    mindmapNodeIdRegex.lastIndex = startOffset;
    return mindmapNodeIdRegex.exec(text);
  } else {
    return null;
  }
};

/**
 * Matches a mindmap node square
 */
export const mindmapNodeSquareTitleRegex = /\[([^\n\r\]]+)][\t ]*/;

/**
 * Matches a mindmap node circle
 */
export const mindmapNodeCircleTitleRegex = /\(\(([^\n\r]+)\)\)[\t ]*/;

/**
 * Matches a mindmap node rounded square
 */
export const mindmapNodeRoundedSquareTitleRegex = /\(([^\n\r)]+)\)[\t ]*/;

/**
 * Matches a mindmap node bang
 */
export const mindmapNodeBangTitleRegex = /\)\)([^\n\r(]+)\(\([\t ]*/;

/**
 * Matches a mindmap node cloud
 */
export const mindmapNodeCloudTitleRegex = /\)([^\n\r(]+)\([\t ]*/;

/**
 * Matches a mindmap node hexagon
 */
export const mindmapNodeHexagonTitleRegex = /{{([^\n\r}]+)}}[\t ]*/;

/**
 * Matches a mindmap default node
 */
export const mindmapNodeDefault = /([^\n\r]+)(?=%%)|([^\n\r]+)/y;
export const matchMindmapNodeDefault: CustomPatternMatcherFunc = (text, startOffset) => {
  mindmapNodeDefault.lastIndex = startOffset;
  return mindmapNodeDefault.exec(text);
};

const lookahead = {
  class: mindmapClassRegex,
  icon: mindmapIconRegex,
  title: mindmapTitleRegex,
  accTItle: mindmapAccessibilityTitleRegex,
  accDescr: mindmapAccessibilityDescrRegex,
};

const nodeShapeTitles: Record<string, RegExp> = {
  squareTitle: new RegExp('[^\n\r[]*' + mindmapNodeSquareTitleRegex.source),
  circleTitle: new RegExp('[^\n\r(]*' + mindmapNodeCircleTitleRegex.source),
  roundedSquareTitle: new RegExp('[^\n\r(]*' + mindmapNodeRoundedSquareTitleRegex.source),
  bangTitle: new RegExp('[^\n\r)]*' + mindmapNodeBangTitleRegex.source),
  cloudTitle: new RegExp('[^\n\r)]*' + mindmapNodeCloudTitleRegex.source),
  hexagonTitle: new RegExp('[^\n\r{]*' + mindmapNodeHexagonTitleRegex.source),
};
