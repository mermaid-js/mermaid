import type { IToken, TokenVocabulary } from 'chevrotain';
import type { Grammar, TokenBuilderOptions } from 'langium';
import { AstUtils, GrammarAST, RegExpUtils } from 'langium';
import { AbstractMermaidTokenBuilder } from '../common/index.js';

// Original greedy inline-data pattern. Chevrotain prefers the longest match, so this
// would swallow a GWT label and a later quoted comment unless it declines that position.
const greedyInline = /{(.*)}|"(.*)"|'(.*)'/y;
const labelContents = /[^\n\r]*/y;
const givenKeyword = /given\b/y;

// A quoted GWT label is preceded by the keyword `gwt` and a frame id.
// Chevrotain leaves hidden tokens (whitespace and %% comments) out of this list, so a
// comment cannot fake that pair or hide a real frame id.
function isGwtLabelQuote(text: string, offset: number, tokens: IToken[]): boolean {
  const start = text[offset];
  if (start !== '"' && start !== "'") {
    return false;
  }
  const [gwt, frameId] = lastNonHidden(tokens, 2);
  return gwt?.tokenType.name === 'gwt' && frameId?.tokenType.name === 'EM_FID';
}

function lastNonHidden(tokens: IToken[], count: number): IToken[] {
  const visible: IToken[] = [];
  for (let index = tokens.length - 1; index >= 0 && visible.length < count; index--) {
    const token = tokens[index];
    if (token.tokenType.GROUP !== undefined) {
      continue;
    }
    visible.push(token);
  }
  visible.reverse();
  return visible;
}

function matchEmDataInline(
  text: string,
  offset: number,
  tokens: IToken[] = []
): RegExpExecArray | null {
  if (isGwtLabelQuote(text, offset, tokens)) {
    return null;
  }
  greedyInline.lastIndex = offset;
  return greedyInline.exec(text);
}

function skipHidden(text: string, offset: number, hiddenPatterns: RegExp[]): number {
  while (true) {
    const trivia = hiddenPatterns.find((pattern) => {
      pattern.lastIndex = offset;
      return pattern.test(text) && pattern.lastIndex > offset;
    });
    if (!trivia) {
      return offset;
    }
    offset = trivia.lastIndex;
  }
}

function matchGwtLabel(
  text: string,
  offset: number,
  tokens: IToken[],
  hiddenPatterns: RegExp[],
  statementType: RegExp
): [string] | null {
  if (!isGwtLabelQuote(text, offset, tokens)) {
    return null;
  }
  const quote = text[offset];
  const contentsStart = offset + 1;
  labelContents.lastIndex = contentsStart;
  const contents = labelContents.exec(text)?.[0] ?? '';
  const firstQuote = contents.indexOf(quote);
  // Pick the first matching quote followed by the start of a given statement.
  for (let index = firstQuote; index !== -1; index = contents.indexOf(quote, index + 1)) {
    const end = contentsStart + index + 1;
    givenKeyword.lastIndex = skipHidden(text, end, hiddenPatterns);
    if (!givenKeyword.test(text)) {
      continue;
    }
    statementType.lastIndex = skipHidden(text, givenKeyword.lastIndex, hiddenPatterns);
    if (statementType.test(text)) {
      return [text.slice(offset, end)];
    }
  }
  // Keep the original token boundary for parser diagnostics on malformed scenarios.
  return firstQuote === -1 ? null : [text.slice(offset, contentsStart + firstQuote + 1)];
}

export class EventModelingTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['eventmodeling']);
  }

  public override buildTokens(grammar: Grammar, options?: TokenBuilderOptions): TokenVocabulary {
    const tokens = super.buildTokens(grammar, options);
    if (!Array.isArray(tokens)) {
      return tokens;
    }
    const inline = tokens.find((token) => token.name === 'EM_DATA_INLINE');
    if (inline) {
      inline.PATTERN = matchEmDataInline;
      inline.START_CHARS_HINT = ['{', '"', "'"];
    }
    const label = tokens.find((token) => token.name === 'EM_GWT_LABEL');
    const entityType = grammar.rules.find((rule) => rule.name === 'EmModelEntityType');
    if (label && entityType) {
      const hiddenPatterns = tokens.flatMap(({ GROUP, PATTERN }) =>
        GROUP !== undefined && PATTERN instanceof RegExp
          ? [new RegExp(PATTERN.source, PATTERN.flags + 'y')]
          : []
      );
      const statementTypes = AstUtils.streamAllContents(entityType)
        .filter(GrammarAST.isKeyword)
        .map(({ value }) => RegExpUtils.escapeRegExp(value))
        .join('|');
      const statementType = new RegExp('(?:' + statementTypes + ')\\b', 'y');
      label.PATTERN = (text, offset, previous) =>
        matchGwtLabel(text, offset, previous, hiddenPatterns, statementType);
      label.START_CHARS_HINT = ['"', "'"];
      label.LINE_BREAKS = false;
    }
    return tokens;
  }
}
