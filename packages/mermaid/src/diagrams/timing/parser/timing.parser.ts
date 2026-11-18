import { CstParser, EOF } from 'chevrotain';
import type { CstNode } from 'chevrotain';
import {
  AccDescrBlock,
  AccDescrLine,
  AccTitleLine,
  Analog,
  As,
  At,
  Binary,
  Bus,
  Clock,
  Colon,
  Comma,
  Comment,
  Duty,
  Identifier,
  Interpolation,
  Is,
  Linear,
  Max,
  Min,
  NewLine,
  NumberLiteral,
  Offset,
  Percent,
  Period,
  Repeat,
  State,
  Step,
  StringLiteral,
  TimeUnit,
  TimingDiagram,
  TitleLine,
  Word,
  timingTokens,
} from './timing.tokens.js';

class TimingParser extends CstParser {
  declare start: () => CstNode;
  declare line: () => CstNode;
  declare lineEnd: () => CstNode;
  declare blankLine: () => CstNode;
  declare commentLine: () => CstNode;
  declare titleStatement: () => CstNode;
  declare accTitleStatement: () => CstNode;
  declare accDescrStatement: () => CstNode;
  declare declaration: () => CstNode;
  declare clockDeclaration: () => CstNode;
  declare binaryDeclaration: () => CstNode;
  declare stateDeclaration: () => CstNode;
  declare busDeclaration: () => CstNode;
  declare analogDeclaration: () => CstNode;
  declare signalAlias: () => CstNode;
  declare clockParameter: () => CstNode;
  declare analogParameter: () => CstNode;
  declare valueList: () => CstNode;
  declare timeUnitStatement: () => CstNode;
  declare sequenceStatement: () => CstNode;
  declare segment: () => CstNode;
  declare value: () => CstNode;
  declare atStatement: () => CstNode;
  declare atBodyLine: () => CstNode;
  declare timeAssignment: () => CstNode;

  constructor() {
    super(timingTokens, { nodeLocationTracking: 'full' });

    this.RULE('start', () => {
      this.CONSUME(TimingDiagram);
      this.SUBRULE(this.lineEnd);
      this.MANY(() => this.SUBRULE(this.line));
    });

    this.RULE('line', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.blankLine) },
        { ALT: () => this.SUBRULE(this.commentLine) },
        { ALT: () => this.SUBRULE(this.titleStatement) },
        { ALT: () => this.SUBRULE(this.accTitleStatement) },
        { ALT: () => this.SUBRULE(this.accDescrStatement) },
        { ALT: () => this.SUBRULE(this.declaration) },
        { ALT: () => this.SUBRULE(this.timeUnitStatement) },
        { ALT: () => this.SUBRULE(this.atStatement) },
        { ALT: () => this.SUBRULE(this.sequenceStatement) },
      ]);
    });

    this.RULE('lineEnd', () => {
      this.OR([{ ALT: () => this.CONSUME(NewLine) }, { ALT: () => this.CONSUME(EOF) }]);
    });

    this.RULE('blankLine', () => {
      this.CONSUME(NewLine);
    });

    this.RULE('commentLine', () => {
      this.CONSUME(Comment);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('titleStatement', () => {
      this.CONSUME(TitleLine);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('accTitleStatement', () => {
      this.CONSUME(AccTitleLine);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('accDescrStatement', () => {
      this.OR([
        { ALT: () => this.CONSUME(AccDescrLine) },
        { ALT: () => this.CONSUME(AccDescrBlock) },
      ]);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('declaration', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.clockDeclaration) },
        { ALT: () => this.SUBRULE(this.binaryDeclaration) },
        { ALT: () => this.SUBRULE(this.stateDeclaration) },
        { ALT: () => this.SUBRULE(this.busDeclaration) },
        { ALT: () => this.SUBRULE(this.analogDeclaration) },
      ]);
    });

    this.RULE('signalAlias', () => {
      this.CONSUME(As);
      this.CONSUME(StringLiteral);
    });

    this.RULE('clockDeclaration', () => {
      this.CONSUME(Clock);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.signalAlias));
      this.CONSUME(Colon);
      this.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => this.SUBRULE(this.clockParameter),
      });
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('clockParameter', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Period);
            this.CONSUME(NumberLiteral);
          },
        },
        {
          ALT: () => {
            this.CONSUME(Duty);
            this.CONSUME2(NumberLiteral);
            this.OPTION(() => this.CONSUME(Percent));
          },
        },
        {
          ALT: () => {
            this.CONSUME(Offset);
            this.CONSUME3(NumberLiteral);
          },
        },
      ]);
    });

    this.RULE('binaryDeclaration', () => {
      this.CONSUME(Binary);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.signalAlias));
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('stateDeclaration', () => {
      this.CONSUME(State);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.signalAlias));
      this.OPTION2(() => {
        this.CONSUME(Colon);
        this.SUBRULE(this.valueList);
      });
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('busDeclaration', () => {
      this.CONSUME(Bus);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.signalAlias));
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('analogDeclaration', () => {
      this.CONSUME(Analog);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.signalAlias));
      this.OPTION2(() => {
        this.CONSUME(Colon);
        this.AT_LEAST_ONE_SEP({
          SEP: Comma,
          DEF: () => this.SUBRULE(this.analogParameter),
        });
      });
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('analogParameter', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Min);
            this.CONSUME(NumberLiteral);
          },
        },
        {
          ALT: () => {
            this.CONSUME(Max);
            this.CONSUME2(NumberLiteral);
          },
        },
        {
          ALT: () => {
            this.CONSUME(Interpolation);
            this.OR2([{ ALT: () => this.CONSUME(Linear) }, { ALT: () => this.CONSUME(Step) }]);
          },
        },
      ]);
    });

    this.RULE('valueList', () => {
      this.AT_LEAST_ONE_SEP({ SEP: Comma, DEF: () => this.SUBRULE(this.value) });
    });

    this.RULE('timeUnitStatement', () => {
      this.CONSUME(TimeUnit);
      this.CONSUME(Word);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('sequenceStatement', () => {
      this.CONSUME(Identifier);
      this.CONSUME(Colon);
      this.AT_LEAST_ONE_SEP({ SEP: Comma, DEF: () => this.SUBRULE(this.segment) });
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('segment', () => {
      this.SUBRULE(this.value);
      this.OPTION(() => {
        this.CONSUME(Repeat);
        this.CONSUME(NumberLiteral);
      });
    });

    this.RULE('value', () => {
      this.OR([
        { ALT: () => this.CONSUME(NumberLiteral) },
        { ALT: () => this.CONSUME(StringLiteral) },
        { ALT: () => this.CONSUME(Word) },
      ]);
    });

    this.RULE('atStatement', () => {
      this.CONSUME(At);
      this.CONSUME(NumberLiteral);
      this.SUBRULE(this.lineEnd);
      this.MANY({
        GATE: () => this.isAtBodyLine(),
        DEF: () => this.SUBRULE(this.atBodyLine),
      });
    });

    this.RULE('atBodyLine', () => {
      this.OR([
        {
          GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === Is,
          ALT: () => this.SUBRULE(this.timeAssignment),
        },
        { ALT: () => this.SUBRULE(this.blankLine) },
        { ALT: () => this.SUBRULE(this.commentLine) },
      ]);
    });

    this.RULE('timeAssignment', () => {
      this.CONSUME(Identifier);
      this.CONSUME(Is);
      this.SUBRULE(this.value);
      this.SUBRULE(this.lineEnd);
    });

    this.performSelfAnalysis();
  }

  private isAtBodyLine(): boolean {
    return (
      this.LA(1).tokenType === NewLine ||
      this.LA(1).tokenType === Comment ||
      (this.LA(1).tokenType === Identifier && this.LA(2).tokenType === Is)
    );
  }
}

export const timingParser = new TimingParser();
