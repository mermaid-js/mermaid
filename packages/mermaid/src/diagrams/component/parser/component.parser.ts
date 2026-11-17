import { CstParser } from 'chevrotain';
import type { CstNode } from 'chevrotain';
import {
  AccDescrLine,
  ActorKw,
  AccTitleLine,
  AssociationArrow,
  Bt,
  ClassDefLine,
  ClassLine,
  ColonLabel,
  ComponentBeta,
  ComponentKw,
  DependencyArrow,
  Direction,
  Identifier,
  InterfaceKw,
  LeftBrace,
  LeftBracket,
  Lr,
  NewLine,
  NoteLine,
  PackageKw,
  PlainLink,
  PortKw,
  ProvidesArrow,
  QuotedString,
  RequiresArrow,
  Rl,
  RightBrace,
  RightBracket,
  StereotypeEnd,
  StereotypeStart,
  StereotypeText,
  StyleLine,
  Tb,
  Td,
  TitleLine,
  componentTokens,
} from './component.tokens.js';

class ComponentParser extends CstParser {
  declare start: () => CstNode;
  declare statement: () => CstNode;
  declare directionStatement: () => CstNode;
  declare componentStatement: () => CstNode;
  declare componentBodyStatement: () => CstNode;
  declare portStatement: () => CstNode;
  declare interfaceStatement: () => CstNode;
  declare actorStatement: () => CstNode;
  declare packageStatement: () => CstNode;
  declare packageBodyStatement: () => CstNode;
  declare relationStatement: () => CstNode;
  declare relationOperator: () => CstNode;
  declare nodeLabel: () => CstNode;

  constructor() {
    super(componentTokens, { nodeLocationTracking: 'full' });

    this.RULE('start', () => {
      this.CONSUME(ComponentBeta);
      this.MANY(() => this.CONSUME(NewLine));
      this.MANY2(() => {
        this.SUBRULE(this.statement);
        this.MANY3(() => this.CONSUME2(NewLine));
      });
    });

    this.RULE('statement', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.directionStatement) },
        { ALT: () => this.CONSUME(TitleLine) },
        { ALT: () => this.CONSUME(AccTitleLine) },
        { ALT: () => this.CONSUME(AccDescrLine) },
        { ALT: () => this.CONSUME(NoteLine) },
        { ALT: () => this.CONSUME(ClassDefLine) },
        { ALT: () => this.CONSUME(ClassLine) },
        { ALT: () => this.CONSUME(StyleLine) },
        { ALT: () => this.SUBRULE(this.componentStatement) },
        { ALT: () => this.SUBRULE(this.interfaceStatement) },
        { ALT: () => this.SUBRULE(this.actorStatement) },
        { ALT: () => this.SUBRULE(this.packageStatement) },
        { ALT: () => this.SUBRULE(this.relationStatement) },
      ]);
    });

    this.RULE('directionStatement', () => {
      this.CONSUME(Direction);
      this.OR([
        { ALT: () => this.CONSUME(Tb) },
        { ALT: () => this.CONSUME(Td) },
        { ALT: () => this.CONSUME(Bt) },
        { ALT: () => this.CONSUME(Lr) },
        { ALT: () => this.CONSUME(Rl) },
      ]);
    });

    this.RULE('nodeLabel', () => {
      this.CONSUME(LeftBracket);
      this.CONSUME(QuotedString);
      this.CONSUME(RightBracket);
    });

    this.RULE('componentStatement', () => {
      this.CONSUME(ComponentKw);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.nodeLabel));
      this.OPTION2(() => {
        this.CONSUME(StereotypeStart);
        this.CONSUME(StereotypeText);
        this.CONSUME(StereotypeEnd);
      });
      this.OPTION3(() => {
        this.CONSUME(LeftBrace);
        this.MANY(() => this.CONSUME(NewLine));
        this.MANY2(() => {
          this.SUBRULE(this.componentBodyStatement);
          this.MANY3(() => this.CONSUME2(NewLine));
        });
        this.CONSUME(RightBrace);
      });
    });

    this.RULE('componentBodyStatement', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.portStatement) },
        { ALT: () => this.SUBRULE(this.componentStatement) },
      ]);
    });

    this.RULE('portStatement', () => {
      this.CONSUME(PortKw);
      this.CONSUME(Identifier);
    });

    this.RULE('interfaceStatement', () => {
      this.CONSUME(InterfaceKw);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.nodeLabel));
    });

    this.RULE('actorStatement', () => {
      this.CONSUME(ActorKw);
      this.CONSUME(Identifier);
      this.OPTION(() => this.SUBRULE(this.nodeLabel));
      this.OPTION2(() => {
        this.CONSUME(StereotypeStart);
        this.CONSUME(StereotypeText);
        this.CONSUME(StereotypeEnd);
      });
    });

    this.RULE('packageStatement', () => {
      this.CONSUME(PackageKw);
      this.CONSUME(Identifier);
      this.CONSUME(LeftBrace);
      this.MANY(() => this.CONSUME(NewLine));
      this.MANY2(() => {
        this.SUBRULE(this.packageBodyStatement);
        this.MANY3(() => this.CONSUME2(NewLine));
      });
      this.CONSUME(RightBrace);
    });

    this.RULE('packageBodyStatement', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.componentStatement) },
        { ALT: () => this.SUBRULE(this.interfaceStatement) },
        { ALT: () => this.SUBRULE(this.packageStatement) },
      ]);
    });

    this.RULE('relationStatement', () => {
      this.CONSUME(Identifier);
      this.SUBRULE(this.relationOperator);
      this.CONSUME2(Identifier);
      this.OPTION(() => this.CONSUME(ColonLabel));
    });

    this.RULE('relationOperator', () => {
      this.OR([
        { ALT: () => this.CONSUME(ProvidesArrow) },
        { ALT: () => this.CONSUME(RequiresArrow) },
        { ALT: () => this.CONSUME(DependencyArrow) },
        { ALT: () => this.CONSUME(AssociationArrow) },
        { ALT: () => this.CONSUME(PlainLink) },
      ]);
    });

    this.performSelfAnalysis();
  }
}

/** Singleton parser; grammar self-analysis runs once at module load. */
export const componentParser = new ComponentParser();
