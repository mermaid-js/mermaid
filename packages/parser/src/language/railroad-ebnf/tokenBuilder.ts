import type { GrammarAST } from 'langium';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';

import { AbstractMermaidTokenBuilder } from '../common/index.js';

/** The notation a `standard` line selects. `iso` lexes like the default; only `w3c` differs. */
export type RailroadEbnfStandard = 'w3c' | 'iso';

/** A pattern that matches nothing, so the terminal stays in the grammar but never lexes. */
const NEVER_MATCHES = /(?!)/;

/** Tokens that may precede a `standard` line; any other token means the rules have begun. */
const HEADER_TOKENS = new Set([
  'railroad-ebnf-beta',
  'TITLE',
  'ACC_TITLE',
  'ACC_DESCR',
  'STANDARD',
]);

/**
 * Lex `pattern` only while the header is being read, so `standard` stays an ordinary
 * name inside a rule (`a = standard b ;`) exactly as before the line existed.
 */
const headerOnly = (pattern: RegExp): CustomPatternMatcherFunc => {
  const sticky = new RegExp(pattern.source, 'y');
  return (text, offset, matchedTokens) => {
    if (!matchedTokens.every((token) => HEADER_TOKENS.has(token.tokenType.name))) {
      return null;
    }
    sticky.lastIndex = offset;
    return sticky.exec(text);
  };
};

export class RailroadEbnfTokenBuilder extends AbstractMermaidTokenBuilder {
  constructor(private readonly standard?: RailroadEbnfStandard) {
    super(['railroad-ebnf-beta']);
  }

  protected override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    const tokenType = super.buildTerminalToken(terminal);
    // In W3C notation `?` is only a postfix operator, so `? ... ?` must not lex as one token.
    if (this.standard === 'w3c' && terminal.name === 'EBNF_SPECIAL_SEQUENCE') {
      tokenType.PATTERN = NEVER_MATCHES;
    }
    if (terminal.name === 'STANDARD' && tokenType.PATTERN instanceof RegExp) {
      tokenType.PATTERN = headerOnly(tokenType.PATTERN);
      tokenType.START_CHARS_HINT = ['s'];
    }
    return tokenType;
  }
}
