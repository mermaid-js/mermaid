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
    // Handle optional leading whitespace/newlines
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.WhiteSpace) },
      ]);
    });
    this.SUBRULE(this.graphDeclaration);
    // Handle statements and separators more flexibly
    this.MANY2(() => {
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
      // Direction statement when Direction keyword is followed by DirectionValue
      {
        ALT: () => this.SUBRULE(this.directionStatement),
        GATE: () =>
          this.LA(1).tokenType === tokens.Direction &&
          this.LA(2).tokenType === tokens.DirectionValue,
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
    // Support direct class application with ::: syntax
    this.OPTION(() => {
      this.CONSUME(tokens.StyleSeparator);
      this.SUBRULE(this.className);
    });
  });

  // Vertex - following JISON pattern
  private vertex = this.RULE('vertex', () => {
    this.OR([
      // Vertices with both labels and node data (use lookahead to resolve ambiguity)
      {
        ALT: () => this.SUBRULE(this.vertexWithSquareAndNodeData),
        GATE: () => this.hasShapeDataAfterSquare(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithDoubleCircleAndNodeData),
        GATE: () => this.hasShapeDataAfterDoubleCircle(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithCircleAndNodeData),
        GATE: () => this.hasShapeDataAfterCircle(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithRoundAndNodeData),
        GATE: () => this.hasShapeDataAfterRound(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithHexagonAndNodeData),
        GATE: () => this.hasShapeDataAfterHexagon(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithDiamondAndNodeData),
        GATE: () => this.hasShapeDataAfterDiamond(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithSubroutineAndNodeData),
        GATE: () => this.hasShapeDataAfterSubroutine(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithStadiumAndNodeData),
        GATE: () => this.hasShapeDataAfterStadium(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithEllipseAndNodeData),
        GATE: () => this.hasShapeDataAfterEllipse(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithCylinderAndNodeData),
        GATE: () => this.hasShapeDataAfterCylinder(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithOddAndNodeData),
        GATE: () => this.hasShapeDataAfterOdd(),
      },
      {
        ALT: () => this.SUBRULE(this.vertexWithRectAndNodeData),
        GATE: () => this.hasShapeDataAfterRect(),
      },
      // Basic shapes (without node data)
      { ALT: () => this.SUBRULE(this.vertexWithSquare) },
      { ALT: () => this.SUBRULE(this.vertexWithDoubleCircle) },
      { ALT: () => this.SUBRULE(this.vertexWithCircle) },
      { ALT: () => this.SUBRULE(this.vertexWithRound) },
      { ALT: () => this.SUBRULE(this.vertexWithHexagon) },
      { ALT: () => this.SUBRULE(this.vertexWithDiamond) },
      // Extended shapes (without node data)
      { ALT: () => this.SUBRULE(this.vertexWithSubroutine) },
      { ALT: () => this.SUBRULE(this.vertexWithTrapezoidVariant) },
      { ALT: () => this.SUBRULE2(this.vertexWithStadium) },
      { ALT: () => this.SUBRULE2(this.vertexWithEllipse) },
      { ALT: () => this.SUBRULE2(this.vertexWithCylinder) },
      { ALT: () => this.SUBRULE(this.vertexWithOdd) },
      { ALT: () => this.SUBRULE(this.vertexWithNodeIdOdd) },
      { ALT: () => this.SUBRULE(this.vertexWithRect) },
      // Node with data syntax only
      { ALT: () => this.SUBRULE(this.vertexWithNodeData) },
      // Plain node
      { ALT: () => this.SUBRULE(this.nodeId) },
    ]);
  });

  // Individual vertex shape rules
  private vertexWithSquare = this.RULE('vertexWithSquare', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.SquareStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
  });

  private vertexWithDoubleCircle = this.RULE('vertexWithDoubleCircle', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.DoubleCircleStart);
    this.OPTION(() => {
      this.SUBRULE(this.nodeText);
    });
    this.CONSUME(tokens.DoubleCircleEnd);
  });

  private vertexWithCircle = this.RULE('vertexWithCircle', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.CircleStart);
    this.OPTION(() => {
      this.SUBRULE(this.nodeText);
    });
    this.CONSUME(tokens.CircleEnd);
  });

  private vertexWithRound = this.RULE('vertexWithRound', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.PS);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.PE);
  });

  private vertexWithHexagon = this.RULE('vertexWithHexagon', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.HexagonStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.HexagonEnd);
  });

  private vertexWithDiamond = this.RULE('vertexWithDiamond', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.DiamondStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.DiamondEnd);
  });

  private vertexWithSubroutine = this.RULE('vertexWithSubroutine', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.SubroutineStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SubroutineEnd);
  });

  private vertexWithTrapezoidVariant = this.RULE('vertexWithTrapezoidVariant', () => {
    this.SUBRULE(this.nodeId);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(tokens.TrapezoidStart);
          this.SUBRULE(this.nodeText);
          this.CONSUME(tokens.TrapezoidEnd);
        },
      },
      {
        ALT: () => {
          this.CONSUME(tokens.InvTrapezoidStart);
          this.SUBRULE2(this.nodeText);
          this.CONSUME(tokens.InvTrapezoidEnd);
        },
      },
      {
        ALT: () => {
          this.CONSUME2(tokens.TrapezoidStart);
          this.SUBRULE3(this.nodeText);
          this.CONSUME2(tokens.InvTrapezoidEnd);
        },
      },
      {
        ALT: () => {
          this.CONSUME2(tokens.InvTrapezoidStart);
          this.SUBRULE4(this.nodeText);
          this.CONSUME2(tokens.TrapezoidEnd);
        },
      },
    ]);
  });

  private vertexWithStadium = this.RULE('vertexWithStadium', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.StadiumStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.StadiumEnd);
  });

  private vertexWithEllipse = this.RULE('vertexWithEllipse', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.EllipseStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.EllipseEnd);
  });

  private vertexWithCylinder = this.RULE('vertexWithCylinder', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.CylinderStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.CylinderEnd);
  });

  private vertexWithOdd = this.RULE('vertexWithOdd', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.OddStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
  });

  // Special rule for node IDs ending with minus followed by odd start (e.g., "odd->text]")
  private vertexWithNodeIdOdd = this.RULE('vertexWithNodeIdOdd', () => {
    this.CONSUME(tokens.NodeIdWithOddStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
  });

  private vertexWithRect = this.RULE('vertexWithRect', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.RectStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
  });

  // Vertex with node data syntax (e.g., D@{ shape: rounded })
  private vertexWithNodeData = this.RULE('vertexWithNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.SUBRULE(this.nodeData);
  });

  // Vertices with both labels and node data
  private vertexWithSquareAndNodeData = this.RULE('vertexWithSquareAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.SquareStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithDoubleCircleAndNodeData = this.RULE('vertexWithDoubleCircleAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.DoubleCircleStart);
    this.OPTION(() => {
      this.SUBRULE(this.nodeText);
    });
    this.CONSUME(tokens.DoubleCircleEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithCircleAndNodeData = this.RULE('vertexWithCircleAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.CircleStart);
    this.OPTION(() => {
      this.SUBRULE(this.nodeText);
    });
    this.CONSUME(tokens.CircleEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithRoundAndNodeData = this.RULE('vertexWithRoundAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.PS);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.PE);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithHexagonAndNodeData = this.RULE('vertexWithHexagonAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.HexagonStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.HexagonEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithDiamondAndNodeData = this.RULE('vertexWithDiamondAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.DiamondStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.DiamondEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithSubroutineAndNodeData = this.RULE('vertexWithSubroutineAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.SubroutineStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SubroutineEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithStadiumAndNodeData = this.RULE('vertexWithStadiumAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.StadiumStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.StadiumEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithEllipseAndNodeData = this.RULE('vertexWithEllipseAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.EllipseStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.EllipseEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithCylinderAndNodeData = this.RULE('vertexWithCylinderAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.CylinderStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.CylinderEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithOddAndNodeData = this.RULE('vertexWithOddAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.OddStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
    this.SUBRULE(this.nodeData);
  });

  private vertexWithRectAndNodeData = this.RULE('vertexWithRectAndNodeData', () => {
    this.SUBRULE(this.nodeId);
    this.CONSUME(tokens.RectStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
    this.SUBRULE(this.nodeData);
  });

  // Lookahead methods to resolve ambiguity between shapes with and without node data
  private hasShapeDataAfterSquare(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.SquareStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterDoubleCircle(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.DoubleCircleStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterCircle(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.CircleStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterRound(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.PS &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterHexagon(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.HexagonStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterDiamond(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.DiamondStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterSubroutine(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.SubroutineStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterStadium(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.StadiumStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterEllipse(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.EllipseStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterCylinder(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.CylinderStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterOdd(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.OddStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  private hasShapeDataAfterRect(): boolean {
    return (
      this.LA(1).tokenType === tokens.NODE_STRING &&
      this.LA(2).tokenType === tokens.RectStart &&
      this.hasShapeDataAfterPosition(3)
    );
  }

  // Helper method to check for @{ after a shape's closing token
  private hasShapeDataAfterPosition(startPos: number): boolean {
    let pos = startPos;
    // Skip through the shape content and find the closing token
    let depth = 1;
    while (depth > 0 && pos <= 10) {
      // Limit lookahead to prevent infinite loops
      const token = this.LA(pos);
      if (!token) return false;

      // Check for opening tokens that increase depth
      if (
        token.tokenType === tokens.SquareStart ||
        token.tokenType === tokens.DoubleCircleStart ||
        token.tokenType === tokens.CircleStart ||
        token.tokenType === tokens.PS ||
        token.tokenType === tokens.HexagonStart ||
        token.tokenType === tokens.DiamondStart ||
        token.tokenType === tokens.SubroutineStart ||
        token.tokenType === tokens.StadiumStart ||
        token.tokenType === tokens.EllipseStart ||
        token.tokenType === tokens.CylinderStart ||
        token.tokenType === tokens.OddStart ||
        token.tokenType === tokens.RectStart
      ) {
        depth++;
      }
      // Check for closing tokens that decrease depth
      else if (
        token.tokenType === tokens.SquareEnd ||
        token.tokenType === tokens.DoubleCircleEnd ||
        token.tokenType === tokens.CircleEnd ||
        token.tokenType === tokens.PE ||
        token.tokenType === tokens.HexagonEnd ||
        token.tokenType === tokens.DiamondEnd ||
        token.tokenType === tokens.SubroutineEnd ||
        token.tokenType === tokens.StadiumEnd ||
        token.tokenType === tokens.EllipseEnd ||
        token.tokenType === tokens.CylinderEnd
      ) {
        depth--;
      }

      pos++;
    }

    // Check if the next token after the shape is @{
    return this.LA(pos)?.tokenType === tokens.ShapeDataStart;
  }

  // Node data rule (handles @{ ... } syntax)
  private nodeData = this.RULE('nodeData', () => {
    this.CONSUME(tokens.ShapeDataStart);
    this.SUBRULE(this.nodeDataContent);
    this.CONSUME(tokens.ShapeDataEnd);
  });

  // Node data content (handles the content inside @{ ... })
  private nodeDataContent = this.RULE('nodeDataContent', () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(tokens.ShapeDataContent) },
        { ALT: () => this.SUBRULE(this.nodeDataString) },
      ]);
    });
  });

  // Node data string (handles quoted strings inside node data)
  private nodeDataString = this.RULE('nodeDataString', () => {
    this.CONSUME(tokens.ShapeDataStringStart);
    this.MANY(() => {
      this.CONSUME(tokens.ShapeDataStringContent);
    });
    this.CONSUME(tokens.ShapeDataStringEnd);
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
      { ALT: () => this.SUBRULE(this.leanRightShape) },
      { ALT: () => this.SUBRULE(this.subroutineShape) },
      { ALT: () => this.SUBRULE(this.trapezoidShape) },
      { ALT: () => this.SUBRULE(this.invTrapezoidShape) },
      { ALT: () => this.SUBRULE(this.rectShape) },
      { ALT: () => this.SUBRULE(this.squareShape) },
      { ALT: () => this.SUBRULE(this.circleShape) },
      { ALT: () => this.SUBRULE(this.diamondShape) },
      { ALT: () => this.SUBRULE(this.oddShape) },
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

  private subroutineShape = this.RULE('subroutineShape', () => {
    this.CONSUME(tokens.SubroutineStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SubroutineEnd);
  });

  private trapezoidShape = this.RULE('trapezoidShape', () => {
    this.CONSUME(tokens.TrapezoidStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.TrapezoidEnd);
  });

  private invTrapezoidShape = this.RULE('invTrapezoidShape', () => {
    this.CONSUME(tokens.InvTrapezoidStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.InvTrapezoidEnd);
  });

  private leanRightShape = this.RULE('leanRightShape', () => {
    this.CONSUME(tokens.LeanRightStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.LeanRightEnd);
  });

  // Note: leanLeftShape is now handled by vertexWithTrapezoidVariant
  // (InvTrapezoidStart + nodeText + TrapezoidEnd)

  private rectShape = this.RULE('rectShape', () => {
    this.CONSUME(tokens.RectStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
  });

  private oddShape = this.RULE('oddShape', () => {
    this.CONSUME(tokens.OddStart);
    this.SUBRULE(this.nodeText);
    this.CONSUME(tokens.SquareEnd);
  });

  // Node text
  private nodeText = this.RULE('nodeText', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.TextContent) },
      { ALT: () => this.CONSUME(tokens.RectTextContent) },
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
      // LINK_ID followed by link token (e.g., "e1@-->")
      {
        ALT: () => {
          this.CONSUME(tokens.LINK_ID);
          this.OR2([
            { ALT: () => this.CONSUME(tokens.LINK) },
            { ALT: () => this.CONSUME(tokens.THICK_LINK) },
            { ALT: () => this.CONSUME(tokens.DOTTED_LINK) },
          ]);
        },
      },
      // Regular link tokens without ID
      { ALT: () => this.CONSUME2(tokens.LINK) },
      { ALT: () => this.CONSUME2(tokens.THICK_LINK) },
      { ALT: () => this.CONSUME2(tokens.DOTTED_LINK) },
    ]);
  });

  // Link with edge text - START_LINK/START_DOTTED_LINK/START_THICK_LINK edgeText EdgeTextEnd
  private linkWithEdgeText = this.RULE('linkWithEdgeText', () => {
    this.OR([
      // LINK_ID followed by START_LINK pattern (e.g., "e1@-- text -->")
      {
        ALT: () => {
          this.CONSUME(tokens.LINK_ID);
          this.OR2([
            { ALT: () => this.CONSUME(tokens.START_LINK) },
            { ALT: () => this.CONSUME(tokens.START_DOTTED_LINK) },
            { ALT: () => this.CONSUME(tokens.START_THICK_LINK) },
          ]);
        },
      },
      // Regular START_LINK patterns without ID
      { ALT: () => this.CONSUME2(tokens.START_LINK) },
      { ALT: () => this.CONSUME2(tokens.START_DOTTED_LINK) },
      { ALT: () => this.CONSUME2(tokens.START_THICK_LINK) },
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

  // Link style statement - unambiguous structure
  private linkStyleStatement = this.RULE('linkStyleStatement', () => {
    this.CONSUME(tokens.LinkStyle);

    // First, determine positions (DEFAULT or numberList)
    this.OR([
      {
        ALT: () => {
          this.CONSUME(tokens.Default);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.numberList);
        },
      },
    ]);

    // Then handle optional INTERPOLATE + alphaNum (must come before styleList)
    this.OPTION(() => {
      this.CONSUME(tokens.Interpolate);
      this.SUBRULE(this.alphaNum);
    });

    // Then handle optional styleList (after interpolate)
    this.OPTION2(() => {
      this.SUBRULE(this.styleList);
    });

    this.OPTION3(() => {
      this.SUBRULE(this.statementSeparator);
    });
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
      // Handle direct link syntax: click A "url" ["tooltip"] [target]
      {
        ALT: () => {
          this.CONSUME(tokens.QuotedString); // URL
          // Optional tooltip (second QuotedString)
          this.OPTION3(() => {
            this.CONSUME2(tokens.QuotedString); // Tooltip
          });
          // Optional target parameter (NODE_STRING)
          this.OPTION4(() => {
            this.CONSUME2(tokens.NODE_STRING); // Target parameter like "_blank"
          });
        },
      },
    ]);
    // Optional tooltip for clickCall (callback) syntax
    this.OPTION(() => {
      this.CONSUME3(tokens.QuotedString); // Tooltip for callback syntax
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
    // Optional tooltip parameter (second QuotedString)
    this.OPTION(() => {
      this.CONSUME2(tokens.QuotedString); // Tooltip parameter
    });
    // Optional target parameter
    this.OPTION2(() => {
      this.CONSUME2(tokens.NODE_STRING); // Target parameter like "_blank"
    });
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
            { ALT: () => this.CONSUME(tokens.Callback) }, // Handle "call callback" syntax
          ]);
          this.OPTION(() => {
            this.CONSUME(tokens.PS); // Opening parenthesis
            this.OPTION2(() => {
              // Parse function arguments - handle multiple tokens for complex arguments
              this.MANY(() => {
                this.OR3([
                  { ALT: () => this.CONSUME(tokens.TextContent) }, // Arguments as text token
                  { ALT: () => this.CONSUME2(tokens.QuotedString) },
                  { ALT: () => this.CONSUME2(tokens.NODE_STRING) },
                ]);
              });
            });
            this.CONSUME(tokens.PE); // Closing parenthesis
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME2(tokens.Callback);
          // For simple callback syntax like "click A callback", the Callback token itself is the function name
          // Don't consume additional strings here - let clickStatement handle tooltips
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
    this.CONSUME(tokens.Direction);
    this.CONSUME(tokens.DirectionValue);
    this.OPTION(() => {
      this.SUBRULE(this.statementSeparator);
    });
  });

  // Helper rules
  private className = this.RULE('className', () => {
    this.CONSUME(tokens.NODE_STRING);
  });

  private subgraphId = this.RULE('subgraphId', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.QuotedString) },
      {
        ALT: () => {
          this.CONSUME(tokens.MarkdownStringStart);
          this.CONSUME(tokens.MarkdownStringContent);
          this.CONSUME(tokens.MarkdownStringEnd);
        },
      },
      {
        ALT: () => {
          this.CONSUME(tokens.StringStart);
          this.CONSUME(tokens.StringContent);
          this.CONSUME(tokens.StringEnd);
        },
      },
      // Handle single or multi-word subgraph titles (including keywords)
      {
        ALT: () => {
          this.AT_LEAST_ONE(() => {
            this.OR2([
              { ALT: () => this.CONSUME(tokens.NODE_STRING) },
              { ALT: () => this.CONSUME(tokens.NumberToken) },
              { ALT: () => this.CONSUME(tokens.Style) }, // Allow 'style' keyword in titles
              { ALT: () => this.CONSUME(tokens.Class) }, // Allow 'class' keyword in titles
              { ALT: () => this.CONSUME(tokens.Click) }, // Allow 'click' keyword in titles
            ]);
          });
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
      { ALT: () => this.CONSUME(tokens.Default) },
      { ALT: () => this.SUBRULE(this.numberList) },
    ]);
  });

  private numberList = this.RULE('numberList', () => {
    this.OR([
      // Handle properly tokenized numbers: NumberToken, Comma, NumberToken, ...
      {
        ALT: () => {
          this.CONSUME(tokens.NumberToken);
          this.MANY(() => {
            this.CONSUME(tokens.Comma);
            this.CONSUME2(tokens.NumberToken);
          });
        },
      },
      // Handle comma-separated numbers that got tokenized as NODE_STRING (e.g., "0,1")
      // Only consume NODE_STRING if it looks like a number list (contains only digits and commas)
      {
        ALT: () => {
          this.CONSUME(tokens.NODE_STRING);
        },
      },
    ]);
  });

  private alphaNum = this.RULE('alphaNum', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.NODE_STRING) },
      { ALT: () => this.CONSUME(tokens.NumberToken) },
    ]);
  });

  private styleList = this.RULE('styleList', () => {
    this.SUBRULE(this.style);
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      this.SUBRULE2(this.style);
    });
  });

  private style = this.RULE('style', () => {
    // Collect all tokens that can be part of a CSS style value
    // This handles cases like "border:1px solid red" which gets tokenized as separate tokens
    // Use MANY instead of AT_LEAST_ONE to allow single token styles
    this.CONSUME(tokens.NODE_STRING); // First token is required (usually the main style like "stroke-width:1px")
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME2(tokens.NODE_STRING) },
        { ALT: () => this.CONSUME(tokens.NumberToken) },
        { ALT: () => this.CONSUME(tokens.Colon) },
        { ALT: () => this.CONSUME(tokens.Minus) },
        { ALT: () => this.CONSUME(tokens.DirectionValue) }, // For values like 'solid'
        { ALT: () => this.CONSUME(tokens.EscapedComma) }, // CRITICAL: Handle escaped commas in CSS
        // Don't consume Semicolon as it's a statement separator
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

// Export the adapter for backward compatibility
export { default as default } from './flowParserAdapter.js';
