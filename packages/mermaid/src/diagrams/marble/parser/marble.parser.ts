import { CstParser, EOF } from 'chevrotain';
import type { CstNode } from 'chevrotain';
import {
  AccDescrBlock,
  AccDescrLine,
  AccTitleLine,
  Axis,
  Comment,
  Identifier,
  Label,
  Marble,
  MarbleBody,
  NewLine,
  QuotedString,
  SymbolChar,
  TitleLine,
  marbleTokens,
} from './marble.tokens.js';

/**
 * ```
 * start       := (NEWLINE | COMMENT)* MARBLE lineEnd line*
 * line        := NEWLINE | COMMENT lineEnd | statement
 * statement   := TITLE_LINE | ACC_TITLE_LINE | ACC_DESCR_LINE | ACC_DESCR_BLOCK
 *              | axis | label | lane            (each followed by lineEnd)
 * axis        := AXIS MARBLE_BODY
 * label       := LABEL (IDENTIFIER | SYMBOL) QUOTED_STRING
 * lane        := (IDENTIFIER | QUOTED_STRING) MARBLE_BODY
 * ```
 */
class MarbleParser extends CstParser {
  declare start: () => CstNode;
  declare line: () => CstNode;
  declare statement: () => CstNode;
  declare lineEnd: () => CstNode;
  declare titleStatement: () => CstNode;
  declare accTitleStatement: () => CstNode;
  declare accDescrStatement: () => CstNode;
  declare axisStatement: () => CstNode;
  declare labelStatement: () => CstNode;
  declare laneStatement: () => CstNode;

  constructor() {
    super(marbleTokens, { nodeLocationTracking: 'full' });

    this.RULE('start', () => {
      // Comments are parsed in place, so blank lines and `%%` lines may precede the header.
      this.MANY1(() =>
        this.OR1([{ ALT: () => this.CONSUME1(NewLine) }, { ALT: () => this.CONSUME1(Comment) }])
      );
      this.CONSUME(Marble);
      this.SUBRULE(this.lineEnd);
      this.MANY2(() => this.SUBRULE(this.line));
    });

    this.RULE('line', () => {
      this.OR([
        { ALT: () => this.CONSUME(NewLine) },
        {
          ALT: () => {
            this.CONSUME(Comment);
            this.SUBRULE(this.lineEnd);
          },
        },
        { ALT: () => this.SUBRULE(this.statement) },
      ]);
    });

    this.RULE('statement', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.titleStatement) },
        { ALT: () => this.SUBRULE(this.accTitleStatement) },
        { ALT: () => this.SUBRULE(this.accDescrStatement) },
        { ALT: () => this.SUBRULE(this.axisStatement) },
        { ALT: () => this.SUBRULE(this.labelStatement) },
        { ALT: () => this.SUBRULE(this.laneStatement) },
      ]);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('lineEnd', () => {
      this.OR([{ ALT: () => this.CONSUME(NewLine) }, { ALT: () => this.CONSUME(EOF) }]);
    });

    this.RULE('titleStatement', () => {
      this.CONSUME(TitleLine);
    });

    this.RULE('accTitleStatement', () => {
      this.CONSUME(AccTitleLine);
    });

    this.RULE('accDescrStatement', () => {
      this.OR([
        { ALT: () => this.CONSUME(AccDescrLine) },
        { ALT: () => this.CONSUME(AccDescrBlock) },
      ]);
    });

    this.RULE('axisStatement', () => {
      this.CONSUME(Axis);
      this.CONSUME(MarbleBody);
    });

    this.RULE('labelStatement', () => {
      this.CONSUME(Label);
      this.OR([{ ALT: () => this.CONSUME(Identifier) }, { ALT: () => this.CONSUME(SymbolChar) }]);
      this.CONSUME(QuotedString);
    });

    this.RULE('laneStatement', () => {
      this.OR([{ ALT: () => this.CONSUME(Identifier) }, { ALT: () => this.CONSUME(QuotedString) }]);
      this.CONSUME(MarbleBody);
    });

    this.performSelfAnalysis();
  }
}

/** Singleton parser; grammar analysis runs once at module load. */
export const marbleParser = new MarbleParser();
