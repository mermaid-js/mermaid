import { CstParser, EOF } from 'chevrotain';
import type { CstNode, TokenType } from 'chevrotain';
import {
  Actor,
  At,
  BackArrow,
  Bt,
  CircleArrow,
  CircleArrowReversed,
  Class,
  ClassDef,
  ClassSeparator,
  Colon,
  Comma,
  CrossArrow,
  CrossArrowReversed,
  Dash,
  Direction,
  Dot,
  End,
  HashColor,
  Identifier,
  LeftBrace,
  LeftParen,
  LineSolid,
  Lr,
  NewLine,
  NumberLiteral,
  Package,
  Percent,
  Rect,
  RightBrace,
  RightParen,
  Rl,
  SolidArrow,
  StringLiteral,
  Style,
  Tb,
  Td,
  SystemBoundary,
  Type,
  Usecase,
  usecaseTokens,
} from './usecase.tokens.js';

const isLabel = (tokenType: TokenType): boolean =>
  tokenType === Identifier || tokenType === StringLiteral;

class UsecaseParser extends CstParser {
  declare start: () => CstNode;
  declare statement: () => CstNode;
  declare actorStatement: () => CstNode;
  declare actorName: () => CstNode;
  declare metadata: () => CstNode;
  declare metadataProperty: () => CstNode;
  declare entityStatement: () => CstNode;
  declare entityName: () => CstNode;
  declare nodeLabel: () => CstNode;
  declare arrow: () => CstNode;
  declare edgeLabel: () => CstNode;
  declare systemBoundaryStatement: () => CstNode;
  declare systemBoundaryName: () => CstNode;
  declare systemBoundaryContent: () => CstNode;
  declare boundaryUsecase: () => CstNode;
  declare systemBoundaryType: () => CstNode;
  declare directionStatement: () => CstNode;
  declare classDefStatement: () => CstNode;
  declare styles: () => CstNode;
  declare styleValue: () => CstNode;
  declare styleComponent: () => CstNode;
  declare classStatement: () => CstNode;
  declare styleStatement: () => CstNode;

  constructor() {
    super(usecaseTokens);

    this.RULE('start', () => {
      this.CONSUME(Usecase);
      this.MANY(() => this.CONSUME(NewLine));
      this.MANY2(() => this.SUBRULE(this.statement));
      this.CONSUME(EOF);
    });

    this.RULE('statement', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.actorStatement) },
        { ALT: () => this.SUBRULE(this.systemBoundaryStatement) },
        { ALT: () => this.SUBRULE(this.directionStatement) },
        { ALT: () => this.SUBRULE(this.classDefStatement) },
        { ALT: () => this.SUBRULE(this.classStatement) },
        { ALT: () => this.SUBRULE(this.styleStatement) },
        { ALT: () => this.SUBRULE(this.entityStatement) },
        { ALT: () => this.CONSUME(NewLine) },
      ]);
    });

    this.RULE('actorStatement', () => {
      this.CONSUME(Actor);
      this.SUBRULE(this.actorName);
      this.OPTION(() => {
        this.OR([
          {
            ALT: () =>
              this.AT_LEAST_ONE(() => {
                this.CONSUME(Comma);
                this.SUBRULE2(this.actorName);
              }),
          },
          {
            ALT: () => {
              this.SUBRULE(this.arrow);
              this.SUBRULE(this.entityName);
            },
          },
        ]);
      });
      this.MANY(() => this.CONSUME(NewLine));
    });

    this.RULE('actorName', () => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(StringLiteral) },
      ]);
      this.OPTION(() => this.SUBRULE(this.metadata));
    });

    this.RULE('metadata', () => {
      this.CONSUME(At);
      this.CONSUME(LeftBrace);
      this.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => this.SUBRULE(this.metadataProperty),
      });
      this.CONSUME(RightBrace);
    });

    this.RULE('metadataProperty', () => {
      this.CONSUME(StringLiteral);
      this.CONSUME(Colon);
      this.CONSUME2(StringLiteral);
    });

    this.RULE('entityStatement', () => {
      this.SUBRULE(this.entityName);
      this.OPTION(() => {
        this.OR([
          {
            ALT: () => {
              this.SUBRULE(this.arrow);
              this.SUBRULE2(this.entityName);
            },
          },
          { ALT: () => this.SUBRULE(this.systemBoundaryType) },
        ]);
      });
      this.MANY(() => this.CONSUME(NewLine));
    });

    this.RULE('entityName', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Identifier);
            this.OPTION(() => {
              this.OR2([
                {
                  ALT: () => {
                    this.CONSUME(ClassSeparator);
                    this.CONSUME2(Identifier);
                  },
                },
                {
                  ALT: () => {
                    this.CONSUME(LeftParen);
                    this.SUBRULE(this.nodeLabel);
                    this.CONSUME(RightParen);
                  },
                },
              ]);
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(StringLiteral);
            this.OPTION2(() => {
              this.CONSUME2(ClassSeparator);
              this.CONSUME3(Identifier);
            });
          },
        },
      ]);
    });

    this.RULE('nodeLabel', () => {
      this.AT_LEAST_ONE(() => {
        this.OR([
          { ALT: () => this.CONSUME(Identifier) },
          { ALT: () => this.CONSUME(StringLiteral) },
        ]);
      });
    });

    this.RULE('arrow', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(LineSolid);
            this.OPTION({
              GATE: () =>
                isLabel(this.LA(1).tokenType) &&
                [SolidArrow, LineSolid, CircleArrow, CrossArrow].includes(this.LA(2).tokenType),
              DEF: () => {
                this.SUBRULE(this.edgeLabel);
                this.OR2([
                  { ALT: () => this.CONSUME(SolidArrow) },
                  { ALT: () => this.CONSUME2(LineSolid) },
                  { ALT: () => this.CONSUME(CircleArrow) },
                  { ALT: () => this.CONSUME(CrossArrow) },
                ]);
              },
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(BackArrow);
            this.OPTION2({
              GATE: () => isLabel(this.LA(1).tokenType) && this.LA(2).tokenType === LineSolid,
              DEF: () => {
                this.SUBRULE2(this.edgeLabel);
                this.CONSUME3(LineSolid);
              },
            });
          },
        },
        { ALT: () => this.CONSUME2(SolidArrow) },
        { ALT: () => this.CONSUME2(CircleArrow) },
        { ALT: () => this.CONSUME2(CrossArrow) },
        {
          ALT: () => {
            this.CONSUME(CircleArrowReversed);
            this.OPTION3({
              GATE: () => isLabel(this.LA(1).tokenType) && this.LA(2).tokenType === LineSolid,
              DEF: () => {
                this.SUBRULE3(this.edgeLabel);
                this.CONSUME4(LineSolid);
              },
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(CrossArrowReversed);
            this.OPTION4({
              GATE: () => isLabel(this.LA(1).tokenType) && this.LA(2).tokenType === LineSolid,
              DEF: () => {
                this.SUBRULE4(this.edgeLabel);
                this.CONSUME5(LineSolid);
              },
            });
          },
        },
      ]);
    });

    this.RULE('edgeLabel', () => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(StringLiteral) },
      ]);
    });

    this.RULE('systemBoundaryStatement', () => {
      this.CONSUME(SystemBoundary);
      this.SUBRULE(this.systemBoundaryName);
      this.MANY(() => this.CONSUME(NewLine));
      this.MANY2(() => this.SUBRULE(this.systemBoundaryContent));
      this.CONSUME(End);
      this.MANY3(() => this.CONSUME2(NewLine));
    });

    this.RULE('systemBoundaryName', () => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(StringLiteral) },
      ]);
    });

    this.RULE('systemBoundaryContent', () => {
      this.OR([
        {
          ALT: () => {
            this.SUBRULE(this.boundaryUsecase);
            this.MANY(() => this.CONSUME(NewLine));
          },
        },
        { ALT: () => this.CONSUME2(NewLine) },
      ]);
    });

    this.RULE('boundaryUsecase', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Identifier);
            this.OPTION(() => {
              this.CONSUME(ClassSeparator);
              this.CONSUME2(Identifier);
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(StringLiteral);
            this.OPTION2(() => {
              this.CONSUME2(ClassSeparator);
              this.CONSUME3(Identifier);
            });
          },
        },
      ]);
    });

    this.RULE('systemBoundaryType', () => {
      this.CONSUME(At);
      this.CONSUME(LeftBrace);
      this.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          this.CONSUME(Type);
          this.CONSUME(Colon);
          this.OR([{ ALT: () => this.CONSUME(Package) }, { ALT: () => this.CONSUME(Rect) }]);
        },
      });
      this.CONSUME(RightBrace);
    });

    this.RULE('directionStatement', () => {
      this.CONSUME(Direction);
      this.OR([
        { ALT: () => this.CONSUME(Tb) },
        { ALT: () => this.CONSUME(Td) },
        { ALT: () => this.CONSUME(Bt) },
        { ALT: () => this.CONSUME(Rl) },
        { ALT: () => this.CONSUME(Lr) },
      ]);
      this.MANY(() => this.CONSUME(NewLine));
    });

    this.RULE('classDefStatement', () => {
      this.CONSUME(ClassDef);
      this.CONSUME(Identifier);
      this.SUBRULE(this.styles);
      this.MANY(() => this.CONSUME(NewLine));
    });

    this.RULE('styles', () => {
      this.SUBRULE(this.styleValue);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.styleValue);
      });
    });

    this.RULE('styleValue', () => {
      this.AT_LEAST_ONE(() => this.SUBRULE(this.styleComponent));
    });

    this.RULE('styleComponent', () => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(NumberLiteral) },
        { ALT: () => this.CONSUME(HashColor) },
        { ALT: () => this.CONSUME(Colon) },
        { ALT: () => this.CONSUME(StringLiteral) },
        { ALT: () => this.CONSUME(Dash) },
        { ALT: () => this.CONSUME(Dot) },
        { ALT: () => this.CONSUME(Percent) },
      ]);
    });

    this.RULE('classStatement', () => {
      this.CONSUME(Class);
      this.CONSUME(Identifier);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.CONSUME2(Identifier);
      });
      this.CONSUME3(Identifier);
      this.MANY2(() => this.CONSUME(NewLine));
    });

    this.RULE('styleStatement', () => {
      this.CONSUME(Style);
      this.CONSUME(Identifier);
      this.SUBRULE(this.styles);
      this.MANY(() => this.CONSUME(NewLine));
    });

    this.performSelfAnalysis();
  }
}

/** Singleton parser; grammar self-analysis runs once at module load. */
export const usecaseParser = new UsecaseParser();
