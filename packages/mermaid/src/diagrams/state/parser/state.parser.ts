import { CstParser } from 'chevrotain';
import type { CstNode } from 'chevrotain';
import {
  AccDescr,
  AccTitle,
  allStateTokens,
  Arrow,
  ClassDef,
  ClassStmt,
  Choice,
  Click,
  CompositState,
  Concurrent,
  Descr,
  DirectionBT,
  DirectionLR,
  DirectionRL,
  DirectionTB,
  EdgeState,
  FloatingNote,
  Fork,
  HideEmpty,
  Href,
  Id,
  Join,
  LeftOf,
  NL,
  Note,
  NoteId,
  NoteTextInline,
  NoteTextMultiline,
  RightOf,
  Scale,
  State,
  StateDiagram,
  StateString,
  StateStructStart,
  StringTok,
  StructStop,
  StyleSeparator,
  StyleStmt,
  As,
} from './state.tokens.js';

/**
 * State-diagram grammar (CST). Mirrors `stateDiagram.jison`'s grammar but emits clean keyword tokens
 * (the contract is the `db`'s `rootDoc`, not the token stream). The visitor rebuilds the rootDoc.
 * Iteration 1: covers the common statements; note/floating-note edge cases land while greening specs.
 */
class StateParser extends CstParser {
  declare stateDiagram: () => CstNode;
  declare document: () => CstNode;
  declare statement: () => CstNode;
  declare directionStatement: () => CstNode;
  declare relationStatement: () => CstNode;
  declare idStatement: () => CstNode;
  declare stateStatement: () => CstNode;
  declare noteStatement: () => CstNode;
  declare clickStatement: () => CstNode;

  constructor() {
    super(allStateTokens);

    this.RULE('stateDiagram', () => {
      this.MANY(() => this.CONSUME(NL)); // leading blank lines before the header
      this.CONSUME(StateDiagram);
      this.SUBRULE(this.document);
    });

    this.RULE('document', () => {
      this.MANY(() =>
        this.OR([{ ALT: () => this.CONSUME(NL) }, { ALT: () => this.SUBRULE(this.statement) }])
      );
    });

    this.RULE('statement', () => {
      this.OR([
        { ALT: () => this.CONSUME(ClassDef) },
        { ALT: () => this.CONSUME(StyleStmt) },
        { ALT: () => this.CONSUME(ClassStmt) },
        { ALT: () => this.CONSUME(AccTitle) },
        { ALT: () => this.CONSUME(AccDescr) },
        { ALT: () => this.CONSUME(Scale) },
        { ALT: () => this.CONSUME(HideEmpty) },
        { ALT: () => this.CONSUME(Concurrent) },
        { ALT: () => this.SUBRULE(this.directionStatement) },
        { ALT: () => this.SUBRULE(this.stateStatement) },
        { ALT: () => this.SUBRULE(this.noteStatement) },
        { ALT: () => this.SUBRULE(this.clickStatement) },
        { ALT: () => this.SUBRULE(this.relationStatement) },
      ]);
    });

    this.RULE('directionStatement', () => {
      this.OR([
        { ALT: () => this.CONSUME(DirectionTB) },
        { ALT: () => this.CONSUME(DirectionBT) },
        { ALT: () => this.CONSUME(DirectionRL) },
        { ALT: () => this.CONSUME(DirectionLR) },
      ]);
    });

    // (Id | [*]) optionally classed with `:::class`
    this.RULE('idStatement', () => {
      this.OR([{ ALT: () => this.CONSUME(Id) }, { ALT: () => this.CONSUME(EdgeState) }]);
      this.OPTION(() => {
        this.CONSUME(StyleSeparator);
        this.CONSUME2(Id);
      });
    });

    // idStatement, optional `--> idStatement`, optional `: description`
    this.RULE('relationStatement', () => {
      this.SUBRULE(this.idStatement);
      this.OPTION(() => {
        this.CONSUME(Arrow);
        this.SUBRULE2(this.idStatement);
      });
      this.OPTION2(() => this.CONSUME(Descr));
    });

    this.RULE('stateStatement', () => {
      this.CONSUME(State);
      this.OR([
        { ALT: () => this.CONSUME(Fork) },
        { ALT: () => this.CONSUME(Join) },
        { ALT: () => this.CONSUME(Choice) },
        {
          // `state [ "description" as ] id [ { … } ]`
          ALT: () => {
            this.OPTION(() => {
              this.CONSUME(StateString);
              this.CONSUME(As);
            });
            this.CONSUME(CompositState);
            this.MANY(() => this.CONSUME2(CompositState)); // extra words — invalid before a `{`
            this.OPTION2(() => {
              this.CONSUME(StateStructStart);
              this.SUBRULE(this.document);
              this.CONSUME(StructStop);
            });
          },
        },
      ]);
    });

    this.RULE('noteStatement', () => {
      this.CONSUME(Note);
      this.OR([
        { ALT: () => this.CONSUME(FloatingNote) },
        {
          ALT: () => {
            this.OR2([{ ALT: () => this.CONSUME(LeftOf) }, { ALT: () => this.CONSUME(RightOf) }]);
            this.CONSUME(NoteId);
            this.OR3([
              { ALT: () => this.CONSUME(NoteTextInline) },
              { ALT: () => this.CONSUME(NoteTextMultiline) },
            ]);
          },
        },
      ]);
    });

    this.RULE('clickStatement', () => {
      this.CONSUME(Click);
      this.SUBRULE(this.idStatement);
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Href);
            this.CONSUME(StringTok);
          },
        },
        {
          ALT: () => {
            this.CONSUME2(StringTok);
            this.CONSUME3(StringTok);
          },
        },
      ]);
    });

    this.performSelfAnalysis();
  }
}

/** Singleton parser — grammar recording happens once. */
export const stateParser = new StateParser();
