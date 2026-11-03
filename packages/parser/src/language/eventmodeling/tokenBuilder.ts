import type { TokenVocabulary } from 'chevrotain';
import type { Grammar, TokenBuilderOptions } from 'langium';
import { AbstractMermaidTokenBuilder } from '../common/index.js';

// Original greedy inline-data pattern. Chevrotain prefers the longest match, so this
// would swallow a GWT label and a later quoted comment unless it declines that position.
const greedyInline = /{(.*)}|"(.*)"|'(.*)'/y;

// `gwt`, a frame id, then whitespace, ending where the label quote starts.
const gwtLabelPrefix = /(?:^|\W)gwt\s+\d{1,3}\s*$/;

function isGwtLabelQuote(text: string, offset: number): boolean {
  const start = text[offset];
  if (start !== '"' && start !== "'") {
    return false;
  }
  return gwtLabelPrefix.test(text.slice(0, offset));
}

function matchEmDataInline(text: string, offset: number): RegExpExecArray | null {
  if (isGwtLabelQuote(text, offset)) {
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
