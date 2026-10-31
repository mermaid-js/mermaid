import type { TokenType } from 'chevrotain';
import type { GrammarAST } from 'langium';
import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class RadarTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['radar-beta']);
  }

  protected override buildTerminalToken(terminal: GrammarAST.TerminalRule): TokenType {
    const token = super.buildTerminalToken(terminal);
    if (terminal.name === 'TITLE') {
      // A bare title must not consume the beginning of an identifier.
      token.PATTERN = /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|(?![\w-]*\w))/;
    }

    const option =
      terminal.name === 'BOOLEAN'
        ? 'showLegend'
        : terminal.name === 'GRATICULE'
          ? 'graticule'
          : undefined;
    if (option && token.PATTERN instanceof RegExp) {
      const pattern = new RegExp(token.PATTERN.source, 'y');
      token.PATTERN = (text, offset, tokens) => {
        pattern.lastIndex = offset;
        const match = pattern.exec(text);
        if (
          match &&
          tokens.at(-1)?.tokenType.name !== option &&
          /^[\w-]*\w/.test(text.slice(offset + match[0].length))
        ) {
          return null;
        }
        // Option values may be glued to the next statement, such as false followed by curve.
        return match;
      };
      token.LINE_BREAKS = false;
      token.START_CHARS_HINT = option === 'showLegend' ? ['t', 'f'] : ['c', 'p'];
    }
    return token;
  }
}
