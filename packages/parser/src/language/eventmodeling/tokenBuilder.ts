import type { IToken, TokenVocabulary } from 'chevrotain';
import type { Grammar, TokenBuilderOptions } from 'langium';
import { AbstractMermaidTokenBuilder } from '../common/index.js';

// Original greedy inline-data pattern. Chevrotain prefers the longest match, so this
// would swallow a GWT label and a later quoted comment unless it declines that position.
const greedyInline = /{(.*)}|"(.*)"|'(.*)'/y;

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
    return tokens;
  }
}
