import { CstParser } from 'chevrotain';
import * as tokens from './flowLexer.js';

export class FlowchartParser extends CstParser {
  constructor() {
    super(tokens.allTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: 'full',
    });

    this.performSelfAnalysis();
  }

  // Root rule
  public flowchart = this.RULE('flowchart', () => {
    this.SUBRULE(this.graphDeclaration);
    // Handle statements and separators more flexibly
    this.MANY(() => {
      this.SUBRULE(this.statement);
      // Optional separator after statement
      this.OPTION(() => {
        this.SUBRULE(this.statementSeparator);
      });
    });
  });

  // Graph declaration
  private graphDeclaration = this.RULE('graphDeclaration', () => {
    this.CONSUME(tokens.Graph);
    this.OPTION(() => {
      this.CONSUME(tokens.DirectionValue);
    });
    this.OPTION2(() => {
      this.SUBRULE(this.statementSeparator);
    });
  });

  // Statement separator
  private statementSeparator = this.RULE('statementSeparator', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.Newline) },
      { ALT: () => this.CONSUME(tokens.Semicolon) },
      { ALT: () => this.CONSUME(tokens.WhiteSpace) }, // Allow whitespace as separator
    ]);
    // Allow trailing whitespace and newlines after separators
    this.MANY(() => {
      this.OR2([
        { ALT: () => this.CONSUME2(tokens.WhiteSpace) },
        { ALT: () => this.CONSUME2(tokens.Newline) },
      ]);
    });
  });

  // Statement - following JISON structure
  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.vertexStatement) },
      // Standalone link statement only when pattern is exactly nodeId link nodeId (no continuation)
      {
        ALT: () => this.SUBRULE(this.standaloneLinkStatement),
        GATE: () => {
          // Look ahead to see if this is a simple nodeId link nodeId pattern
          // without any continuation (like more links or ampersands)
          const la1 = this.LA(1); // First token (should be nodeId)
          const la2 = this.LA(2); // Second token (should be link)
          const la3 = this.LA(3); // Third token (should be nodeId)
          const la4 = this.LA(4); // Fourth token (should be separator or EOF)

          // Check if we have the exact pattern: nodeId link nodeId separator/EOF
          return (
            (la1.tokenType === tokens.NODE_STRING || la1.tokenType === tokens.NumberToken) &&
            (la2.tokenType === tokens.LINK ||
              la2.tokenType === tokens.THICK_LINK ||
              la2.tokenType === tokens.DOTTED_LINK ||
              la2.tokenType === tokens.START_LINK ||
              la2.tokenType === tokens.START_THICK_LINK ||
              la2.tokenType === tokens.START_DOTTED_LINK) &&
            (la3.tokenType === tokens.NODE_STRING || la3.tokenType === tokens.NumberToken) &&
            (la4 === undefined ||
              la4.tokenType === tokens.Semicolon ||
              la4.tokenType === tokens.Newline ||
              la4.tokenType === tokens.WhiteSpace)
          );
        },
      },
      { ALT: () => this.SUBRULE(this.styleStatement) },
      { ALT: () => this.SUBRULE(this.linkStyleStatement) },
      { ALT: () => this.SUBRULE(this.classDefStatement) },
      { ALT: () => this.SUBRULE(this.classStatement) },
      { ALT: () => this.SUBRULE(this.clickStatement) },
      { ALT: () => this.SUBRULE(this.subgraphStatement) },
      // Direction statement only when DirectionValue is followed by separator
      {
        ALT: () => this.SUBRULE(this.directionStatement),
        GATE: () =>
          this.LA(1).tokenType === tokens.DirectionValue &&
          (this.LA(2).tokenType === tokens.Semicolon ||
            this.LA(2).tokenType === tokens.Newline ||
            this.LA(2).tokenType === tokens.WhiteSpace ||
            this.LA(2) === undefined), // EOF
      },
      { ALT: () => this.SUBRULE(this.accStatement) }, // Re-enabled
    ]);
  });

  // Vertex statement - avoiding left recursion
  private vertexStatement = this.RULE('vertexStatement', () => {
    this.SUBRULE(this.node);
    this.MANY(() => {
      this.SUBRULE(this.link);
      this.SUBRULE2(this.node);
    });
  });

  // Node - avoiding left recursion
  private node = this.RULE('node', () => {
    this.SUBRULE(this.styledVertex);
    this.MANY(() => {
      this.CONSUME(tokens.Ampersand);
      this.SUBRULE2(this.styledVertex);
    });
  });

  // Styled vertex
  private styledVertex = this.RULE('styledVertex', () => {
    this.SUBRULE(this.vertex);
    // TODO: Add style separator support when implementing styling
  });

  // Vertex - following JISON pattern
  private vertex = this.RULE('vertex', () => {
    this.OR([
      // idString SQS text SQE
      {
        ALT: () => {
          this.SUBRULE(this.nodeId);
          this.CONSUME(tokens.SquareStart);
          this.SUBRULE(this.nodeText);
          this.CONSUME(tokens.SquareEnd);
        },
      },
      // idString DoubleCircleStart text DoubleCircleEnd
      {
        ALT: () => {
          this.SUBRULE2(this.nodeId);
          this.CONSUME(tokens.DoubleCircleStart);
          this.SUBRULE2(this.nodeText);
          this.CONSUME(tokens.DoubleCircleEnd);
        },
      },
      // idString CircleStart text CircleEnd
      {
        ALT: () => {
          this.SUBRULE3(this.nodeId);
          this.CONSUME(tokens.CircleStart);
          this.SUBRULE3(this.nodeText);
          this.CONSUME(tokens.CircleEnd);
        },
      },
      // idString PS text PE
      {
        ALT: () => {
          this.SUBRULE4(this.nodeId);
          this.CONSUME(tokens.PS);
          this.SUBRULE4(this.nodeText);
          this.CONSUME(tokens.PE);
        },
      },
      // idString HexagonStart text HexagonEnd
      {
        ALT: () => {
          this.SUBRULE5(this.nodeId);
          this.CONSUME(tokens.HexagonStart);
          this.SUBRULE5(this.nodeText);
          this.CONSUME(tokens.HexagonEnd);
        },
      },
      // idString DIAMOND_START text DIAMOND_STOP
      {
        ALT: () => {
          this.SUBRULE6(this.nodeId);
          this.CONSUME(tokens.DiamondStart);
          this.SUBRULE6(this.nodeText);
          this.CONSUME(tokens.DiamondEnd);
        },
      },
      // idString (plain node)
      { ALT: () => this.SUBRULE7(this.nodeId) },
    ]);
  });

  // Node definition (legacy)
  private nodeDefinition = this.RULE('nodeDefinition', () => {
    this.SUBRULE(this.nodeId);
    this.OPTION(() => {
      this.SUBRULE(this.nodeShape);
    });
    // TODO: Add style separator support when implementing styling
  });

  // Node ID - handles both simple and special character node IDs
  private nodeId = this.RULE('nodeId', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.NODE_STRING) },
      { ALT: () => this.CONSUME(tokens.NumberToken) },

      // Allow special characters as standalone node IDs (matching JISON parser behavior)
      { ALT: () => this.CONSUME2(tokens.Ampersand) },
      { ALT: () => this.CONSUME2(tokens.Minus) },
      { ALT: () => this.CONSUME2(tokens.DirectionValue) },
      { ALT: () => this.CONSUME(tokens.Colon) },
      { ALT: () => this.CONSUME(tokens.Comma) },
      // Only allow 'default' as node ID when not followed by statement patterns
      {
        ALT: () => this.CONSUME(tokens.Default),
        GATE: () => this.LA(2).tokenType !== tokens.DirectionValue,
      },
    ]);
  });

  // Node shape
  private nodeShape = this.RULE('nodeShape', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.squareShape) },
      { ALT: () => this.SUBRULE(this.circleShape) },
      { ALT: () => this.SUBRULE(this.diamondShape) },
    ]);
  });

  // Shape definitions
  private squareShape = this.RULE('squareShape', () => {
    this.CONSUME(tokens.SquareStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
  });

  private circleShape = this.RULE('circleShape', () => {
    this.CONSUME(tokens.PS);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.PE);
  });

  private diamondShape = this.RULE('diamondShape', () => {
    this.CONSUME(tokens.DiamondStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.DiamondEnd);
  });

  // Node text
  private nodeText = this.RULE('nodeText', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.TextContent) },
      { ALT: () => this.CONSUME(tokens.NODE_STRING) },
      { ALT: () => this.CONSUME(tokens.QuotedString) },
      { ALT: () => this.CONSUME(tokens.NumberToken) },
    ]);
  });

  // Link chain
  private linkChain = this.RULE('linkChain', () => {
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.link);
      this.SUBRULE(this.nodeDefinition);
    });
  });

  // Link - following JISON structure
  private link = this.RULE('link', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.linkWithEdgeText) },
      { ALT: () => this.SUBRULE(this.linkWithArrowText) },
      { ALT: () => this.SUBRULE(this.linkStatement) },
    ]);
  });

  // Link with arrow text - LINK arrowText
  private linkWithArrowText = this.RULE('linkWithArrowText', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.LINK) },
      { ALT: () => this.CONSUME(tokens.THICK_LINK) },
      { ALT: () => this.CONSUME(tokens.DOTTED_LINK) },
    ]);
    this.SUBRULE(this.arrowText);
  });

  // Link statement
  private linkStatement = this.RULE('linkStatement', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.LINK) },
      { ALT: () => this.CONSUME(tokens.THICK_LINK) },
      { ALT: () => this.CONSUME(tokens.DOTTED_LINK) },
    ]);
  });

  // Link with edge text - START_LINK/START_DOTTED_LINK/START_THICK_LINK edgeText EdgeTextEnd
  private linkWithEdgeText = this.RULE('linkWithEdgeText', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.START_LINK) },
      { ALT: () => this.CONSUME(tokens.START_DOTTED_LINK) },
      { ALT: () => this.CONSUME(tokens.START_THICK_LINK) },
    ]);
    this.SUBRULE(this.edgeText);
    this.CONSUME(tokens.EdgeTextEnd);
  });

  // Edge text
  private edgeText = this.RULE('edgeText', () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.EdgeTextContent) },
        { ALT: () => this.CONSUME(tokens.EdgeTextPipe) },
        { ALT: () => this.CONSUME(tokens.NODE_STRING) },
        { ALT: () => this.CONSUME(tokens.QuotedString) },
      ]);
    });
  });

  // Arrow text - PIPE text PipeEnd
  private arrowText = this.RULE('arrowText', () => {
    this.CONSUME(tokens.Pipe);
    this.SUBRULE(this.text);
    this.CONSUME(tokens.PipeEnd);
  });

  // Text rule - following JISON pattern
  private text = this.RULE('text', () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.TextContent) },
        { ALT: () => this.CONSUME(tokens.NODE_STRING) },
        { ALT: () => this.CONSUME(tokens.NumberToken) },
        { ALT: () => this.CONSUME(tokens.WhiteSpace) },
        { ALT: () => this.CONSUME(tokens.Colon) },
        { ALT: () => this.CONSUME(tokens.Minus) },
        { ALT: () => this.CONSUME(tokens.Ampersand) },
        { ALT: () => this.CONSUME(tokens.QuotedString) },
      ]);
    });
  });

  // Link text
  private linkText = this.RULE('linkText', () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.TextContent) },
        { ALT: () => this.CONSUME(tokens.NODE_STRING) },
      ]);
    });
  });

  // Style statement
  private styleStatement = this.RULE('styleStatement', () => {
    this.CONSUME(tokens.Style);
    this.SUBRULE(this.nodeId);
    this.SUBRULE(this.styleList);
    this.SUBRULE(this.statementSeparator);
  });

  // Link style statement
  private linkStyleStatement = this.RULE('linkStyleStatement', () => {
    this.CONSUME(tokens.LinkStyle);
    this.SUBRULE(this.linkIndexList);
    this.SUBRULE(this.styleList);
    this.SUBRULE(this.statementSeparator);
  });

  // Class definition statement
  private classDefStatement = this.RULE('classDefStatement', () => {
    this.CONSUME(tokens.ClassDef);
    this.SUBRULE(this.className);
    this.SUBRULE(this.styleList);
    this.SUBRULE(this.statementSeparator);
  });

  // Class statement
  private classStatement = this.RULE('classStatement', () => {
    this.CONSUME(tokens.Class);
    this.SUBRULE(this.nodeIdList);
    this.SUBRULE(this.className);
    this.SUBRULE(this.statementSeparator);
  });

  // Click statement
  private clickStatement = this.RULE('clickStatement', () => {
    this.CONSUME(tokens.Click);
    this.SUBRULE(this.nodeId);
    this.OR([
      { ALT: () => this.SUBRULE(this.clickHref) },
      { ALT: () => this.SUBRULE(this.clickCall) },
    ]);
    this.OPTION(() => {
      this.OR2([
        { ALT: () => this.CONSUME(tokens.NODE_STRING) },
        { ALT: () => this.CONSUME(tokens.QuotedString) },
      ]);
    });
    this.OPTION2(() => {
      this.SUBRULE(this.statementSeparator);
    });
  });

  // Click href
  private clickHref = this.RULE('clickHref', () => {
    this.CONSUME(tokens.Href);
    this.OR([
      { ALT: () => this.CONSUME(tokens.NODE_STRING) },
      { ALT: () => this.CONSUME(tokens.QuotedString) },
    ]);
  });

  // Click call
  private clickCall = this.RULE('clickCall', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(tokens.Call);
          this.OR2([
            { ALT: () => this.CONSUME(tokens.NODE_STRING) },
            { ALT: () => this.CONSUME(tokens.QuotedString) },
          ]);
          this.OPTION(() => {
            this.CONSUME(tokens.Pipe);
            // Parse arguments
            this.CONSUME2(tokens.Pipe);
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(tokens.Callback);
          this.OR3([
            { ALT: () => this.CONSUME2(tokens.NODE_STRING) },
            { ALT: () => this.CONSUME2(tokens.QuotedString) },
            {
              ALT: () => {
                this.CONSUME(tokens.StringStart);
                this.CONSUME(tokens.StringContent);
                this.CONSUME(tokens.StringEnd);
              },
            },
          ]);
        },
      },
    ]);
  });

  // Subgraph statement
  private subgraphStatement = this.RULE('subgraphStatement', () => {
    this.CONSUME(tokens.Subgraph);
    this.OPTION(() => {
      this.SUBRULE(this.subgraphId);
    });
    this.OPTION2(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(tokens.SquareStart);
            this.SUBRULE(this.nodeText);
            this.CONSUME(tokens.SquareEnd);
          },
        },
        {
          ALT: () => {
            this.CONSUME(tokens.QuotedString);
          },
        },
      ]);
    });
    this.OPTION3(() => {
      this.SUBRULE(this.statementSeparator);
    });
    this.MANY(() => {
      this.OR2([
        { ALT: () => this.SUBRULE2(this.statement) },
        { ALT: () => this.SUBRULE2(this.statementSeparator) },
      ]);
    });
    this.CONSUME(tokens.End);
    this.OPTION4(() => {
      this.SUBRULE3(this.statementSeparator);
    });
  });

  // Direction statement
  private directionStatement = this.RULE('directionStatement', () => {
    // TODO: Add direction keyword token
    this.CONSUME(tokens.DirectionValue);
    this.SUBRULE(this.statementSeparator);
  });

  // Helper rules
  private className = this.RULE('className', () => {
    this.CONSUME(tokens.NODE_STRING);
  });

  private subgraphId = this.RULE('subgraphId', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.NODE_STRING) },
      { ALT: () => this.CONSUME(tokens.QuotedString) },
      {
        ALT: () => {
          this.CONSUME(tokens.StringStart);
          this.CONSUME(tokens.StringContent);
          this.CONSUME(tokens.StringEnd);
        },
      },
    ]);
  });

  private nodeIdList = this.RULE('nodeIdList', () => {
    this.SUBRULE(this.nodeId);
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      this.SUBRULE2(this.nodeId);
    });
  });

  private linkIndexList = this.RULE('linkIndexList', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.NODE_STRING) }, // "default"
      { ALT: () => this.SUBRULE(this.numberList) },
    ]);
  });

  private numberList = this.RULE('numberList', () => {
    this.CONSUME(tokens.NumberToken);
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      this.CONSUME2(tokens.NumberToken);
    });
  });

  private styleList = this.RULE('styleList', () => {
    this.SUBRULE(this.style);
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      this.SUBRULE2(this.style);
    });
  });

  private style = this.RULE('style', () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.NODE_STRING) },
        { ALT: () => this.CONSUME(tokens.NumberToken) },
        { ALT: () => this.CONSUME(tokens.Colon) },
        { ALT: () => this.CONSUME(tokens.Semicolon) },
        { ALT: () => this.CONSUME(tokens.Minus) },
      ]);
    });
  });

  // Standalone link statement
  private standaloneLinkStatement = this.RULE('standaloneLinkStatement', () => {
    this.SUBRULE(this.nodeId);
    this.SUBRULE(this.link);
    this.SUBRULE2(this.nodeId);
  });

  // Accessibility statement
  private accStatement = this.RULE('accStatement', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(tokens.AccTitle);
          this.CONSUME(tokens.AccTitleValue);
        },
      },
      {
        ALT: () => {
          this.CONSUME(tokens.AccDescr);
          this.CONSUME(tokens.AccDescrValue);
        },
      },
      {
        ALT: () => {
          this.CONSUME(tokens.AccDescrMultiline);
          this.CONSUME(tokens.AccDescrMultilineValue);
          this.CONSUME(tokens.AccDescrMultilineEnd);
        },
      },
    ]);
  });
}
