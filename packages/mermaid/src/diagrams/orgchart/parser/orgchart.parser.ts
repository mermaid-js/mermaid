import { CstParser, EOF, Lexer } from 'chevrotain';
import type { CstNode, IToken } from 'chevrotain';
import {
  AccDescrBlock,
  AccDescrLine,
  AccTitleLine,
  Header,
  IdWithLabel,
  Newline,
  QuotedString,
  Staff,
  TitleLine,
  Word,
  orgchartTokens,
} from './orgchart.tokens.js';

/** Singleton lexer and parser; construction and validation happen once at module load. */
export const orgchartLexer = new Lexer(orgchartTokens);

class OrgChartCstParser extends CstParser {
  constructor() {
    super(orgchartTokens, { recoveryEnabled: false });
    this.performSelfAnalysis();
  }

  public start = this.RULE('start', () => {
    this.OPTION(() => this.CONSUME(Newline));
    this.CONSUME(Header);
    this.MANY(() => this.SUBRULE(this.nodeLine));
    this.OPTION2(() => this.CONSUME2(Newline));
    this.CONSUME(EOF);
  });

  private nodeLine = this.RULE('nodeLine', () => {
    this.CONSUME(Newline);
    this.OR([
      { ALT: () => this.CONSUME(TitleLine) },
      { ALT: () => this.CONSUME(AccTitleLine) },
      { ALT: () => this.CONSUME(AccDescrLine) },
      { ALT: () => this.CONSUME(AccDescrBlock) },
      {
        ALT: () => {
          this.OPTION(() => this.CONSUME(Staff));
          this.SUBRULE(this.label);
          this.OPTION2(() => this.CONSUME(QuotedString, { LABEL: 'secondary' }));
        },
      },
    ]);
  });

  private label = this.RULE('label', () => {
    this.OR([
      { ALT: () => this.CONSUME(QuotedString) },
      { ALT: () => this.CONSUME(IdWithLabel) },
      { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(Word)) },
    ]);
  });
}

export const orgchartParser = new OrgChartCstParser();

export type { CstNode, IToken };
