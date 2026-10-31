// cspell:ignore allowmixing markerless newpage skinparam

import { CstParser, EOF, tokenMatcher } from 'chevrotain';
import type { CstNode, IToken, TokenType } from 'chevrotain';
import {
  AccDescrBlock,
  AccDescrLine,
  AccTitleLine,
  Actor,
  At,
  BackwardCircle,
  BackwardCross,
  BackwardSolid,
  Bt,
  Class,
  ClassDef,
  ClassSeparator,
  Colon,
  Comma,
  Comment,
  CssEscapedComma,
  CssIdentifier,
  CssPunctuation,
  Dash,
  DependencyArrow,
  Direction,
  Dot,
  End,
  Extend,
  False,
  For,
  ForwardCircle,
  ForwardCross,
  ForwardSolid,
  Generalization,
  HashColor,
  Identifier,
  Include,
  JsonDeclarationStart,
  JsonObjectLiteral,
  LabelText,
  LeftBrace,
  LeftBracket,
  LeftParen,
  Lr,
  MarkdownString,
  MarkerlessSolid,
  MetadataStart,
  NewLine,
  Note,
  NumberLiteral,
  Percent,
  PlainString,
  RightBrace,
  RightBracket,
  RightParen,
  Rl,
  StereotypeEnd,
  StereotypeStart,
  StereotypeText,
  Style,
  SystemBoundary,
  Tb,
  Td,
  True,
  Usecase,
  Word,
  usecaseTokens,
} from './usecase.tokens.js';

const isLabelToken = (token: IToken): boolean =>
  tokenMatcher(token, LabelText) ||
  token.tokenType === PlainString ||
  token.tokenType === MarkdownString;

const forbiddenPlantUmlStatements: Record<string, true> = {
  allowmixing: true,
  newpage: true,
  package: true,
  rectangle: true,
  skinparam: true,
};

class UsecaseParser extends CstParser {
  declare start: () => CstNode;
  declare line: () => CstNode;
  declare statement: () => CstNode;
  declare lineEnd: () => CstNode;
  declare blankLine: () => CstNode;
  declare commentLine: () => CstNode;
  declare accTitleStatement: () => CstNode;
  declare accDescrStatement: () => CstNode;
  declare actorStatement: () => CstNode;
  declare actorItem: () => CstNode;
  declare actorName: () => CstNode;
  declare actorDeclarationOnly: () => CstNode;
  declare entityStatement: () => CstNode;
  declare entityName: () => CstNode;
  declare nodeLabel: () => CstNode;
  declare useCaseMetadata: () => CstNode;
  declare relationTail: () => CstNode;
  declare arrow: () => CstNode;
  declare edgeLabel: () => CstNode;
  declare semanticRelation: () => CstNode;
  declare metadata: () => CstNode;
  declare metadataProperty: () => CstNode;
  declare metadataSeparator: () => CstNode;
  declare systemBoundaryStatement: () => CstNode;
  declare systemBoundaryName: () => CstNode;
  declare systemBoundaryContent: () => CstNode;
  declare boundaryElement: () => CstNode;
  declare metadataAssignmentStatement: () => CstNode;
  declare metadataAssignmentTarget: () => CstNode;
  declare noteStatement: () => CstNode;
  declare stereotype: () => CstNode;
  declare classSuffix: () => CstNode;
  declare jsonStatement: () => CstNode;
  declare directionStatement: () => CstNode;
  declare classDefStatement: () => CstNode;
  declare classStatement: () => CstNode;
  declare styleStatement: () => CstNode;
  declare styles: () => CstNode;
  declare styleValue: () => CstNode;

  declare forwardSolidOperator: () => CstNode;
  declare backwardSolidOperator: () => CstNode;
  declare markerlessSolidOperator: () => CstNode;
  declare forwardCircleOperator: () => CstNode;
  declare backwardCircleOperator: () => CstNode;
  declare forwardCrossOperator: () => CstNode;
  declare backwardCrossOperator: () => CstNode;
  declare styleComponent: () => CstNode;

  constructor() {
    super(usecaseTokens, { nodeLocationTracking: 'full' });

    this.RULE('start', () => {
      this.CONSUME(Usecase);
      this.SUBRULE(this.lineEnd);
      this.MANY(() => this.SUBRULE(this.line));
    });

    this.RULE('line', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.blankLine) },
        { ALT: () => this.SUBRULE(this.commentLine) },
        {
          GATE: () => this.isStatementStart(),
          ALT: () => this.SUBRULE(this.statement),
        },
      ]);
    });

    this.RULE('statement', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.accTitleStatement) },
        { ALT: () => this.SUBRULE(this.accDescrStatement) },
        { ALT: () => this.SUBRULE(this.directionStatement) },
        { ALT: () => this.SUBRULE(this.actorStatement) },
        { ALT: () => this.SUBRULE(this.systemBoundaryStatement) },
        { ALT: () => this.SUBRULE(this.noteStatement) },
        { ALT: () => this.SUBRULE(this.jsonStatement) },
        { ALT: () => this.SUBRULE(this.classDefStatement) },
        { ALT: () => this.SUBRULE(this.classStatement) },
        { ALT: () => this.SUBRULE(this.styleStatement) },
        {
          GATE: () => this.isMetadataAssignment(),
          ALT: () => this.SUBRULE(this.metadataAssignmentStatement),
        },
        {
          GATE: () => !this.isForbiddenPlantUmlStatement(),
          ALT: () => this.SUBRULE(this.entityStatement),
        },
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

    this.RULE('actorStatement', () => {
      this.CONSUME(Actor);
      this.SUBRULE(this.actorItem);
      this.OPTION(() => {
        this.OR([
          {
            ALT: () =>
              this.AT_LEAST_ONE(() => {
                this.CONSUME(Comma);
                this.SUBRULE2(this.actorItem);
              }),
          },
          { ALT: () => this.SUBRULE(this.relationTail) },
        ]);
      });
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('actorItem', () => {
      this.SUBRULE(this.actorName);
      this.OPTION(() => this.SUBRULE(this.metadata));
      this.OPTION2(() => this.SUBRULE(this.stereotype));
      this.OPTION3(() => this.SUBRULE(this.classSuffix));
    });

    this.RULE('actorName', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Identifier);
            this.OPTION(() => {
              this.CONSUME(LeftParen);
              this.SUBRULE(this.nodeLabel);
              this.CONSUME(RightParen);
            });
          },
        },
        { ALT: () => this.CONSUME(PlainString) },
        { ALT: () => this.CONSUME(MarkdownString) },
      ]);
    });

    this.RULE('actorDeclarationOnly', () => {
      this.CONSUME(Actor);
      this.SUBRULE(this.actorItem);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.actorItem);
      });
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('entityStatement', () => {
      this.SUBRULE(this.entityName);
      this.OPTION(() => this.SUBRULE(this.relationTail));
      this.SUBRULE(this.lineEnd);
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
                    this.CONSUME(LeftParen);
                    this.SUBRULE(this.nodeLabel);
                    this.CONSUME(RightParen);
                  },
                },
                {
                  ALT: () => {
                    this.CONSUME(LeftBracket);
                    this.SUBRULE2(this.nodeLabel);
                    this.CONSUME(RightBracket);
                  },
                },
              ]);
            });
          },
        },
        { ALT: () => this.CONSUME(PlainString) },
        { ALT: () => this.CONSUME(MarkdownString) },
      ]);
      this.OPTION2(() => this.SUBRULE(this.useCaseMetadata));
      this.OPTION3(() => this.SUBRULE(this.stereotype));
      this.OPTION4(() => this.SUBRULE(this.classSuffix));
    });

    this.RULE('nodeLabel', () => {
      this.OR([
        { ALT: () => this.CONSUME(PlainString) },
        { ALT: () => this.CONSUME(MarkdownString) },
        // Unquoted labels run until a delimiter, operator, or suffix marker, none of
        // which belong to `LabelText`. The visitor rebuilds the text from the source
        // slice, so the internal token split never reaches the model.
        { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(LabelText)) },
      ]);
    });

    this.RULE('useCaseMetadata', () => {
      this.SUBRULE(this.metadata);
    });

    this.RULE('relationTail', () => {
      this.OPTION({
        GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === At,
        DEF: () => {
          this.CONSUME(Identifier);
          this.CONSUME(At);
        },
      });
      this.SUBRULE(this.arrow);
      this.SUBRULE(this.entityName);
    });

    this.RULE('arrow', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.semanticRelation) },
        { ALT: () => this.SUBRULE(this.forwardSolidOperator) },
        { ALT: () => this.SUBRULE(this.backwardSolidOperator) },
        { ALT: () => this.SUBRULE(this.markerlessSolidOperator) },
        { ALT: () => this.SUBRULE(this.forwardCircleOperator) },
        { ALT: () => this.SUBRULE(this.backwardCircleOperator) },
        { ALT: () => this.SUBRULE(this.forwardCrossOperator) },
        { ALT: () => this.SUBRULE(this.backwardCrossOperator) },
      ]);
    });

    this.RULE('forwardSolidOperator', () => {
      this.CONSUME(ForwardSolid);
    });

    this.RULE('backwardSolidOperator', () => {
      this.CONSUME(BackwardSolid);
      this.OPTION({
        GATE: () => this.LA(0).image === '<--' && this.hasLabeledRight([MarkerlessSolid]),
        DEF: () => {
          this.SUBRULE(this.edgeLabel);
          this.CONSUME(MarkerlessSolid);
        },
      });
    });

    this.RULE('markerlessSolidOperator', () => {
      this.CONSUME(MarkerlessSolid);
      this.OPTION({
        GATE: () =>
          this.LA(0).image === '--' &&
          this.hasLabeledRight([ForwardSolid, MarkerlessSolid, ForwardCircle, ForwardCross]),
        DEF: () => {
          this.SUBRULE(this.edgeLabel);
          this.OR([
            { ALT: () => this.CONSUME(ForwardSolid) },
            { ALT: () => this.CONSUME2(MarkerlessSolid) },
            { ALT: () => this.CONSUME(ForwardCircle) },
            { ALT: () => this.CONSUME(ForwardCross) },
          ]);
        },
      });
    });

    this.RULE('forwardCircleOperator', () => {
      this.CONSUME(ForwardCircle);
    });

    this.RULE('backwardCircleOperator', () => {
      this.CONSUME(BackwardCircle);
      this.OPTION({
        GATE: () => this.hasLabeledRight([MarkerlessSolid]),
        DEF: () => {
          this.SUBRULE(this.edgeLabel);
          this.CONSUME(MarkerlessSolid);
        },
      });
    });

    this.RULE('forwardCrossOperator', () => {
      this.CONSUME(ForwardCross);
    });

    this.RULE('backwardCrossOperator', () => {
      this.CONSUME(BackwardCross);
      this.OPTION({
        GATE: () => this.hasLabeledRight([MarkerlessSolid]),
        DEF: () => {
          this.SUBRULE(this.edgeLabel);
          this.CONSUME(MarkerlessSolid);
        },
      });
    });

    this.RULE('edgeLabel', () => {
      this.OR([
        { ALT: () => this.CONSUME(PlainString) },
        { ALT: () => this.CONSUME(MarkdownString) },
        { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(LabelText)) },
      ]);
    });

    this.RULE('semanticRelation', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(DependencyArrow);
            this.CONSUME(Colon);
            this.OR2([{ ALT: () => this.CONSUME(Include) }, { ALT: () => this.CONSUME(Extend) }]);
          },
        },
        { ALT: () => this.CONSUME(Generalization) },
      ]);
    });

    this.RULE('metadata', () => {
      this.CONSUME(MetadataStart);
      this.MANY(() => this.CONSUME(NewLine));
      this.OPTION(() => {
        this.SUBRULE(this.metadataProperty);
        this.MANY2(() => {
          this.SUBRULE(this.metadataSeparator);
          this.SUBRULE2(this.metadataProperty);
        });
        this.OPTION2(() => this.CONSUME(Comma));
        this.MANY3(() => this.CONSUME2(NewLine));
      });
      this.CONSUME(RightBrace);
    });

    this.RULE('metadataProperty', () => {
      this.OR([{ ALT: () => this.CONSUME(Identifier) }, { ALT: () => this.CONSUME(PlainString) }]);
      this.CONSUME(Colon);
      this.OR2([
        { ALT: () => this.CONSUME2(Identifier) },
        { ALT: () => this.CONSUME2(PlainString) },
        { ALT: () => this.CONSUME(True) },
        { ALT: () => this.CONSUME(False) },
      ]);
    });

    this.RULE('metadataSeparator', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Comma);
            this.MANY(() => this.CONSUME(NewLine));
          },
        },
        {
          ALT: () => {
            this.AT_LEAST_ONE(() => this.CONSUME2(NewLine));
            this.OPTION(() => this.CONSUME2(Comma));
            this.MANY2(() => this.CONSUME3(NewLine));
          },
        },
      ]);
    });

    this.RULE('systemBoundaryStatement', () => {
      this.CONSUME(SystemBoundary);
      this.SUBRULE(this.systemBoundaryName);
      // Same suffix order as actor and use case declarations: metadata, then classes.
      this.OPTION(() => this.SUBRULE(this.metadata));
      this.OPTION2(() => this.SUBRULE(this.classSuffix));
      this.SUBRULE(this.lineEnd);
      this.SUBRULE(this.systemBoundaryContent);
      this.CONSUME(End);
      this.SUBRULE2(this.lineEnd);
    });

    this.RULE('systemBoundaryName', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Identifier);
            // Mirrors `entityName`, so a short id can carry a long title. Unlike a use
            // case, the bracket form does not select a shape; boundary geometry comes
            // from `type` metadata only.
            this.OPTION(() => {
              this.OR2([
                {
                  ALT: () => {
                    this.CONSUME(LeftParen);
                    this.SUBRULE(this.nodeLabel);
                    this.CONSUME(RightParen);
                  },
                },
                {
                  ALT: () => {
                    this.CONSUME(LeftBracket);
                    this.SUBRULE2(this.nodeLabel);
                    this.CONSUME(RightBracket);
                  },
                },
              ]);
            });
          },
        },
        { ALT: () => this.CONSUME(PlainString) },
        { ALT: () => this.CONSUME(MarkdownString) },
      ]);
    });

    this.RULE('systemBoundaryContent', () => {
      this.MANY(() => {
        this.OR([
          { ALT: () => this.SUBRULE(this.blankLine) },
          { ALT: () => this.SUBRULE(this.commentLine) },
          { ALT: () => this.SUBRULE(this.boundaryElement) },
        ]);
      });
    });

    this.RULE('boundaryElement', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.actorDeclarationOnly) },
        {
          ALT: () => {
            this.SUBRULE(this.entityName);
            this.SUBRULE(this.lineEnd);
          },
        },
      ]);
    });

    this.RULE('metadataAssignmentStatement', () => {
      this.SUBRULE(this.metadataAssignmentTarget);
      this.SUBRULE(this.metadata);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('metadataAssignmentTarget', () => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(PlainString) },
        { ALT: () => this.CONSUME(MarkdownString) },
      ]);
    });

    this.RULE('noteStatement', () => {
      this.CONSUME(Note);
      this.CONSUME(For);
      this.CONSUME(Identifier);
      this.SUBRULE(this.nodeLabel);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('stereotype', () => {
      this.CONSUME(StereotypeStart);
      this.CONSUME(StereotypeText);
      this.CONSUME(StereotypeEnd);
    });

    this.RULE('classSuffix', () => {
      this.CONSUME(ClassSeparator);
      this.CONSUME(Identifier);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.CONSUME2(Identifier);
      });
    });

    this.RULE('jsonStatement', () => {
      this.CONSUME(JsonDeclarationStart);
      this.CONSUME(JsonObjectLiteral);
      this.OPTION(() => this.SUBRULE(this.classSuffix));
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('directionStatement', () => {
      this.CONSUME(Direction);
      this.OR([
        { ALT: () => this.CONSUME(Td) },
        { ALT: () => this.CONSUME(Tb) },
        { ALT: () => this.CONSUME(Bt) },
        { ALT: () => this.CONSUME(Lr) },
        { ALT: () => this.CONSUME(Rl) },
      ]);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('classDefStatement', () => {
      this.CONSUME(ClassDef);
      this.CONSUME(Identifier);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.CONSUME2(Identifier);
      });
      this.SUBRULE(this.styles);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('classStatement', () => {
      this.CONSUME(Class);
      this.CONSUME(Identifier);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.CONSUME2(Identifier);
      });
      this.CONSUME3(Identifier);
      this.MANY2(() => {
        this.CONSUME2(Comma);
        this.CONSUME4(Identifier);
      });
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('styleStatement', () => {
      this.CONSUME(Style);
      this.CONSUME(Identifier);
      this.SUBRULE(this.styles);
      this.SUBRULE(this.lineEnd);
    });

    this.RULE('styles', () => {
      this.SUBRULE(this.styleValue);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.styleValue);
      });
    });

    this.RULE('styleValue', () => {
      this.OR([
        { ALT: () => this.CONSUME(Word) },
        { ALT: () => this.CONSUME(CssIdentifier) },
        {
          ALT: () => {
            this.CONSUME(MarkerlessSolid);
            this.CONSUME2(Word);
          },
        },
      ]);
      this.CONSUME(Colon);
      this.AT_LEAST_ONE(() => this.SUBRULE(this.styleComponent));
    });

    this.RULE('styleComponent', () => {
      this.OR([
        { ALT: () => this.CONSUME(Word) },
        { ALT: () => this.CONSUME(PlainString) },
        { ALT: () => this.CONSUME(NumberLiteral) },
        { ALT: () => this.CONSUME(HashColor) },
        { ALT: () => this.CONSUME(CssIdentifier) },
        { ALT: () => this.CONSUME(CssEscapedComma) },
        { ALT: () => this.CONSUME(Dash) },
        { ALT: () => this.CONSUME(Dot) },
        { ALT: () => this.CONSUME(Percent) },
        { ALT: () => this.CONSUME(CssPunctuation) },
        { ALT: () => this.CONSUME(Colon) },
        { ALT: () => this.CONSUME(LeftParen) },
        { ALT: () => this.CONSUME(RightParen) },
        { ALT: () => this.CONSUME(LeftBracket) },
        { ALT: () => this.CONSUME(RightBracket) },
        { ALT: () => this.CONSUME(LeftBrace) },
        { ALT: () => this.CONSUME(RightBrace) },
        { ALT: () => this.CONSUME(At) },
        { ALT: () => this.CONSUME(MarkerlessSolid) },
      ]);
    });

    this.performSelfAnalysis();
  }

  private isMetadataAssignment(): boolean {
    const target = this.LA(1).tokenType;
    return (
      (target === Identifier || target === PlainString || target === MarkdownString) &&
      this.LA(2).tokenType === MetadataStart
    );
  }

  private isStatementStart(): boolean {
    const tokenType = this.LA(1).tokenType;
    return tokenType !== EOF && tokenType !== NewLine && tokenType !== Comment;
  }

  private isForbiddenPlantUmlStatement(): boolean {
    return (
      this.LA(1).tokenType === Identifier &&
      forbiddenPlantUmlStatements[this.LA(1).image.toLowerCase()] === true
    );
  }

  private hasLabeledRight(allowed: TokenType[]): boolean {
    if (!isLabelToken(this.LA(1))) {
      return false;
    }
    for (let index = 2; ; index++) {
      const token = this.LA(index);
      if (allowed.includes(token.tokenType)) {
        return true;
      }
      if (!isLabelToken(token)) {
        return false;
      }
    }
  }
}

/** Singleton parser; grammar self-analysis runs once at module load. */
export const usecaseParser = new UsecaseParser();
