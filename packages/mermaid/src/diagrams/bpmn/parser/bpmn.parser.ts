import { CstParser } from 'chevrotain';
import {
  Association,
  Bpmn,
  bpmnTokens,
  Colon,
  DashStart,
  DirBT,
  DirLR,
  DirRL,
  DirTB,
  Identifier,
  KwAnd,
  KwData,
  KwDataStore,
  KwEnd,
  KwEvent,
  KwIntermediate,
  KwLane,
  KwMessage,
  KwOr,
  KwPool,
  KwScriptTask,
  KwServiceTask,
  KwStart,
  KwTask,
  KwTimer,
  KwUserTask,
  KwXor,
  LabelText,
  MessageArrow,
  NewLine,
  Pipe,
  PlainString,
  SeqArrow,
} from './bpmn.tokens.js';

/**
 * Line-oriented BPMN grammar. Element declarations start with a type keyword;
 * flow statements start with a node identifier. That first-token split keeps the
 * top-level choice unambiguous. Containment (pool/lane) is resolved by statement
 * order in the model builder, not by the grammar, which keeps the parser tolerant
 * of indentation style.
 */
class BpmnParser extends CstParser {
  constructor() {
    super(bpmnTokens, { recoveryEnabled: false, maxLookahead: 3 });
    this.performSelfAnalysis();
  }

  public document = this.RULE('document', () => {
    this.MANY(() => this.CONSUME(NewLine));
    this.SUBRULE(this.header);
    this.MANY2(() => this.SUBRULE(this.statement));
  });

  private header = this.RULE('header', () => {
    this.CONSUME(Bpmn);
    this.OPTION(() => this.SUBRULE(this.direction));
    this.MANY(() => this.CONSUME(NewLine));
  });

  private direction = this.RULE('direction', () => {
    this.OR([
      { ALT: () => this.CONSUME(DirLR) },
      { ALT: () => this.CONSUME(DirRL) },
      { ALT: () => this.CONSUME(DirTB) },
      { ALT: () => this.CONSUME(DirBT) },
    ]);
  });

  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.poolDecl) },
      { ALT: () => this.SUBRULE(this.laneDecl) },
      { ALT: () => this.SUBRULE(this.element) },
      { ALT: () => this.SUBRULE(this.flow) },
    ]);
    this.MANY(() => this.CONSUME(NewLine));
  });

  private poolDecl = this.RULE('poolDecl', () => {
    this.CONSUME(KwPool);
    this.SUBRULE(this.nameOrId);
  });

  private laneDecl = this.RULE('laneDecl', () => {
    this.CONSUME(KwLane);
    this.SUBRULE(this.nameOrId);
  });

  /** A pool/lane name: a quoted string, or a bare identifier. */
  private nameOrId = this.RULE('nameOrId', () => {
    this.OR([
      { ALT: () => this.CONSUME(PlainString) },
      { ALT: () => this.SUBRULE(this.labelPhrase) },
    ]);
  });

  private element = this.RULE('element', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.eventDecl) },
      { ALT: () => this.SUBRULE(this.taskDecl) },
      { ALT: () => this.SUBRULE(this.gatewayDecl) },
      { ALT: () => this.SUBRULE(this.dataDecl) },
    ]);
  });

  private eventDecl = this.RULE('eventDecl', () => {
    this.OR([
      { ALT: () => this.CONSUME(KwStart) },
      { ALT: () => this.CONSUME(KwIntermediate) },
      { ALT: () => this.CONSUME(KwEnd) },
    ]);
    this.OPTION(() => {
      this.OR2([{ ALT: () => this.CONSUME(KwMessage) }, { ALT: () => this.CONSUME(KwTimer) }]);
    });
    this.CONSUME(Identifier);
    this.OPTION2(() => this.SUBRULE(this.label));
  });

  private taskDecl = this.RULE('taskDecl', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(KwTask);
          this.OPTION(() => {
            this.CONSUME(Colon);
            this.CONSUME(Identifier, { LABEL: 'subtype' });
          });
        },
      },
      { ALT: () => this.CONSUME(KwUserTask) },
      { ALT: () => this.CONSUME(KwServiceTask) },
      { ALT: () => this.CONSUME(KwScriptTask) },
    ]);
    this.CONSUME2(Identifier, { LABEL: 'id' });
    this.OPTION2(() => this.SUBRULE(this.label));
  });

  private gatewayDecl = this.RULE('gatewayDecl', () => {
    this.OR([
      { ALT: () => this.CONSUME(KwXor) },
      { ALT: () => this.CONSUME(KwAnd) },
      { ALT: () => this.CONSUME(KwOr) },
      { ALT: () => this.CONSUME(KwEvent) },
    ]);
    this.CONSUME(Identifier);
    this.OPTION(() => this.SUBRULE(this.label));
  });

  private dataDecl = this.RULE('dataDecl', () => {
    this.OR([{ ALT: () => this.CONSUME(KwDataStore) }, { ALT: () => this.CONSUME(KwData) }]);
    this.CONSUME(Identifier);
    this.OPTION(() => this.SUBRULE(this.label));
  });

  private flow = this.RULE('flow', () => {
    this.CONSUME(Identifier);
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.connector);
      this.CONSUME2(Identifier, { LABEL: 'target' });
    });
  });

  private connector = this.RULE('connector', () => {
    this.OR([
      {
        // -- label -->
        ALT: () => {
          this.CONSUME(DashStart);
          this.SUBRULE(this.flowLabel);
          this.CONSUME(SeqArrow);
        },
      },
      {
        // --> or -->|label|
        ALT: () => {
          this.CONSUME2(SeqArrow);
          this.OPTION(() => {
            this.CONSUME(Pipe);
            this.SUBRULE2(this.flowLabel);
            this.CONSUME2(Pipe);
          });
        },
      },
      {
        // ==> or ==>|label|
        ALT: () => {
          this.CONSUME(MessageArrow);
          this.OPTION2(() => {
            this.CONSUME3(Pipe);
            this.SUBRULE3(this.flowLabel);
            this.CONSUME4(Pipe);
          });
        },
      },
      // -.- association
      { ALT: () => this.CONSUME(Association) },
    ]);
  });

  /** A declaration label: a quoted string or a run of bare words. */
  private label = this.RULE('label', () => {
    this.OR([
      { ALT: () => this.CONSUME(PlainString) },
      { ALT: () => this.SUBRULE(this.labelPhrase) },
    ]);
  });

  /**
   * A flow-condition label: a quoted string or a run of bare words. The word
   * `default` is recognised in the visitor (it lexes as a `LabelText` word).
   */
  private flowLabel = this.RULE('flowLabel', () => {
    this.OR([
      { ALT: () => this.CONSUME(PlainString) },
      { ALT: () => this.SUBRULE(this.labelPhrase) },
    ]);
  });

  /** One or more bare label words (identifiers, keywords, numbers). */
  private labelPhrase = this.RULE('labelPhrase', () => {
    this.AT_LEAST_ONE(() => this.CONSUME(LabelText));
  });
}

export const bpmnParser = new BpmnParser();
