import { CstParser } from 'chevrotain';
import type { CstNode } from 'chevrotain';
import { AccDescr, AccTitle, NewLine, Title } from '../../common/parser/commonTokens.js';
import { Colon, NumberLiteral, Pie, pieTokens, ShowData, StringLiteral } from './pie.tokens.js';

/**
 * Pie chart grammar (CST). Newlines are structural: every statement must be terminated by a
 * newline (the wrapper guarantees a trailing one), so two statements on one line are rejected —
 * matching the langium grammar's `EOL` requirement.
 */
class PieParser extends CstParser {
  // Assigned at runtime by `this.RULE(...)`; declared here for typing only.
  declare pieChart: () => CstNode;
  declare statement: () => CstNode;
  declare section: () => CstNode;

  constructor() {
    super(pieTokens);

    this.RULE('pieChart', () => {
      this.MANY(() => this.CONSUME(NewLine)); // leading blank lines
      this.CONSUME(Pie);
      this.OPTION(() => this.CONSUME(ShowData));
      this.MANY2(() => this.CONSUME2(NewLine)); // blank lines before the first statement
      this.MANY3(() => this.SUBRULE(this.statement));
    });

    this.RULE('statement', () => {
      this.OR([
        { ALT: () => this.CONSUME(Title) },
        { ALT: () => this.CONSUME(AccTitle) },
        { ALT: () => this.CONSUME(AccDescr) },
        { ALT: () => this.SUBRULE(this.section) },
      ]);
      this.AT_LEAST_ONE(() => this.CONSUME(NewLine)); // terminator (EOL)
    });

    this.RULE('section', () => {
      this.CONSUME(StringLiteral);
      this.CONSUME(Colon);
      this.CONSUME(NumberLiteral);
    });

    this.performSelfAnalysis();
  }
}

/** Singleton parser — grammar recording (the expensive init) happens once here. */
export const pieParser = new PieParser();
