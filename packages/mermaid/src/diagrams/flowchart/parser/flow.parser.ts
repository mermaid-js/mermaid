import type { TokenType } from 'chevrotain';
import { CstParser, defaultParserErrorProvider, EOF } from 'chevrotain';
import * as t from './flow.tokens.js';
import { allFlowTokens } from './flow.tokens.js';

// cspell:ignore LALR

/** Resolve a token type to its jison terminal name (the category name when categorized). */
function terminalName(tokType: TokenType): string {
  const categories = tokType.CATEGORIES;
  return categories && categories.length > 0 ? categories[0].name : tokType.name;
}

/** Collect the distinct next-expected terminal names from Chevrotain's nested expected-paths arrays. */
function expectedNames(paths: unknown): string {
  const names = new Set<string>();
  const walk = (node: unknown): void => {
    if (!Array.isArray(node)) {
      return;
    }
    const head = node[0] as TokenType | undefined;
    if (head && typeof head.name === 'string') {
      names.add(terminalName(head)); // `node` is a token path; the first token is what's expected next
      return;
    }
    node.forEach(walk);
  };
  walk(paths);
  return [...names].map((name) => `'${name}'`).join(', ');
}

/**
 * Error messages phrased like jison's (`Expecting '<X>', … got '<Y>'`) so error-assertion specs pass
 * on both engines. Works because the tokens carry jison terminal names (`SQE`, `PS`, `STR`, …).
 */
const flowErrorMessageProvider = {
  ...defaultParserErrorProvider,
  buildMismatchTokenMessage(options: { expected: TokenType; actual: { tokenType: TokenType } }) {
    return `Expecting '${terminalName(options.expected)}' got '${terminalName(options.actual.tokenType)}'`;
  },
  buildNoViableAltMessage(options: {
    expectedPathsPerAlt: unknown;
    actual: { tokenType: TokenType }[];
  }) {
    return `Expecting ${expectedNames(options.expectedPathsPerAlt)} got '${terminalName(options.actual[0].tokenType)}'`;
  },
  buildEarlyExitMessage(options: {
    expectedIterationPaths: unknown;
    actual: { tokenType: TokenType }[];
  }) {
    return `Expecting ${expectedNames(options.expectedIterationPaths)} got '${terminalName(options.actual[0].tokenType)}'`;
  },
};

/**
 * Chevrotain CST parser for the flowchart grammar.
 *
 * A close port of `flow.jison`'s grammar rules. Because the lexer emits the *same token stream* as
 * jison (verified by `flow.lexer.spec.ts`), the rules map almost 1:1; the differences are mechanical:
 * - jison is LALR (allows left recursion); Chevrotain is LL(k), so left-recursive rules become
 *   `MANY` / `AT_LEAST_ONE` loops.
 * - shared rule prefixes (e.g. `idString` before every shape) are factored out.
 * - shapes that differ only by their closing token (trapezoid vs lean) are merged and disambiguated
 *   in the visitor.
 *
 * The parser only builds a CST; `flow.visitor.ts` walks it to fill `FlowDB`.
 */
class FlowchartParser extends CstParser {
  constructor() {
    super(allFlowTokens, { maxLookahead: 4, errorMessageProvider: flowErrorMessageProvider });
    this.performSelfAnalysis();
  }

  // start: graphConfig document
  public start = this.RULE('start', () => {
    this.SUBRULE(this.graphConfig);
    this.SUBRULE(this.document);
  });

  // graphConfig: (SPACE | NEWLINE)* GRAPH (NODIR | DIR firstStmtSeparator)
  private graphConfig = this.RULE('graphConfig', () => {
    this.MANY(() =>
      this.OR([{ ALT: () => this.CONSUME(t.Space) }, { ALT: () => this.CONSUME(t.NewLine) }])
    );
    this.CONSUME(t.Graph);
    this.OR2([
      { ALT: () => this.CONSUME(t.NoDir) },
      {
        ALT: () => {
          this.CONSUME(t.Dir);
          this.SUBRULE(this.firstStmtSeparator);
        },
      },
    ]);
  });

  // firstStmtSeparator: SEMI | NEWLINE | spaceList NEWLINE
  private firstStmtSeparator = this.RULE('firstStmtSeparator', () => {
    this.MANY(() => this.CONSUME(t.Space));
    this.OR([{ ALT: () => this.CONSUME(t.NewLine) }, { ALT: () => this.CONSUME(t.Semi) }]);
  });

  // document: line*
  private document = this.RULE('document', () => {
    this.MANY(() => this.SUBRULE(this.line));
  });

  // line: statement | SEMI | NEWLINE | SPACE
  private line = this.RULE('line', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.statement) },
      { ALT: () => this.CONSUME(t.Semi) },
      { ALT: () => this.CONSUME(t.NewLine) },
      { ALT: () => this.CONSUME(t.Space) },
    ]);
  });

  // separator: NEWLINE | SEMI | EOF
  // A statement terminator is required EXCEPT at end-of-input (jison's `EOF` alternative). This rejects
  // two statements on one line with no separator (`A[x]B`, `A[x] OR B`) while still accepting a final
  // statement that ends the file — matching jison, which is stricter here than an optional separator.
  private separator = this.RULE('separator', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.NewLine) },
      { ALT: () => this.CONSUME(t.Semi) },
      { GATE: () => this.LA(1).tokenType === EOF, ALT: () => undefined },
    ]);
  });

  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.subgraphStatement) },
      { ALT: () => this.SUBRULE(this.styleStatement) },
      { ALT: () => this.SUBRULE(this.linkStyleStatement) },
      { ALT: () => this.SUBRULE(this.classDefStatement) },
      { ALT: () => this.SUBRULE(this.classStatement) },
      { ALT: () => this.SUBRULE(this.clickStatement) },
      { ALT: () => this.SUBRULE(this.direction) },
      { ALT: () => this.CONSUME(t.AccTitle) },
      { ALT: () => this.CONSUME(t.AccDescr) },
      { ALT: () => this.CONSUME(t.AccDescrMultiline) },
      // vertexStatement is last (it starts with the broad idString token set)
      {
        ALT: () => {
          this.SUBRULE(this.vertexStatement);
          this.SUBRULE(this.separator);
        },
      },
    ]);
  });

  // ----- vertex statements -----

  // vertexStatement: node (shapeData | spaceList)? (link node (shapeData | spaceList)?)*
  // The trailing (shapeData | spaceList) and each (link node …) segment are split into sub-rules so
  // shapeData associates with the right node in the CST (the visitor needs per-node metadata).
  private vertexStatement = this.RULE('vertexStatement', () => {
    this.SUBRULE(this.node);
    this.OPTION(() =>
      this.OR([
        { ALT: () => this.SUBRULE(this.shapeData) },
        { ALT: () => this.SUBRULE(this.spaceList) },
      ])
    );
    this.MANY(() => this.SUBRULE(this.vertexSegment));
  });

  // vertexSegment: link node (shapeData | spaceList)?
  private vertexSegment = this.RULE('vertexSegment', () => {
    this.SUBRULE(this.link);
    this.SUBRULE(this.node);
    this.OPTION(() =>
      this.OR([
        { ALT: () => this.SUBRULE(this.shapeData) },
        { ALT: () => this.SUBRULE(this.spaceList) },
      ])
    );
  });

  // node: styledVertex ( (shapeData)? spaceList AMP spaceList styledVertex )*
  // GATE: the chain separator is `spaceList AMP`, whose FIRST set is SPACE — the same token that ends
  // a statement (trailing space before `;`/`\n`/a link). Only enter the loop when an AMP is actually
  // ahead (after optional shapeData + spaces), else the trailing space belongs to vertexStatement.
  private node = this.RULE('node', () => {
    this.SUBRULE(this.styledVertex);
    this.MANY({
      GATE: () => this.isAmpChainAhead(),
      DEF: () => this.SUBRULE(this.ampSegment),
    });
  });

  // ampSegment: (shapeData)? spaceList AMP spaceList styledVertex  (the `&` chain continuation)
  private ampSegment = this.RULE('ampSegment', () => {
    this.OPTION(() => this.SUBRULE(this.shapeData));
    this.SUBRULE(this.spaceList);
    this.CONSUME(t.Amp);
    this.SUBRULE2(this.spaceList);
    this.SUBRULE(this.styledVertex);
  });

  private isAmpChainAhead(): boolean {
    let i = 1;
    let la = this.LA(i);
    while (la.tokenType.CATEGORIES?.includes(t.ShapeData)) {
      i++;
      la = this.LA(i);
    }
    while (la.tokenType === t.Space) {
      i++;
      la = this.LA(i);
    }
    return la.tokenType === t.Amp;
  }

  // styledVertex: vertex (STYLE_SEPARATOR idString)?
  private styledVertex = this.RULE('styledVertex', () => {
    this.SUBRULE(this.vertex);
    this.OPTION(() => {
      this.CONSUME(t.StyleSeparator);
      this.SUBRULE(this.idString);
    });
  });

  // vertex: idString shapeBody?
  private vertex = this.RULE('vertex', () => {
    this.SUBRULE(this.idString);
    this.OPTION(() => this.SUBRULE(this.shapeBody));
  });

  // The shape delimiters. Branch on the opening token; shapes that differ only by closing token are
  // merged into one rule and disambiguated in the visitor. Each shape is its own rule for clean
  // Chevrotain occurrence indices and clean CST node names for the visitor.
  private shapeBody = this.RULE('shapeBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.squareShape) },
      { ALT: () => this.SUBRULE(this.doubleCircleShape) },
      { ALT: () => this.SUBRULE(this.roundOrCircleShape) },
      { ALT: () => this.SUBRULE(this.ellipseShape) },
      { ALT: () => this.SUBRULE(this.stadiumShape) },
      { ALT: () => this.SUBRULE(this.subroutineShape) },
      { ALT: () => this.SUBRULE(this.propsShape) },
      { ALT: () => this.SUBRULE(this.cylinderShape) },
      { ALT: () => this.SUBRULE(this.diamondOrHexShape) },
      { ALT: () => this.SUBRULE(this.oddShape) },
      { ALT: () => this.SUBRULE(this.trapShape) },
      { ALT: () => this.SUBRULE(this.invTrapShape) },
    ]);
  });

  // square: SQS text SQE
  private squareShape = this.RULE('squareShape', () => {
    this.CONSUME(t.SquareStart);
    this.SUBRULE(this.text);
    this.CONSUME(t.SquareEnd);
  });

  // doublecircle: DOUBLECIRCLESTART text DOUBLECIRCLEEND
  private doubleCircleShape = this.RULE('doubleCircleShape', () => {
    this.CONSUME(t.DoubleCircleStart);
    this.SUBRULE(this.text);
    this.CONSUME(t.DoubleCircleEnd);
  });

  // round: PS text PE  |  circle: PS PS text PE PE
  private roundOrCircleShape = this.RULE('roundOrCircleShape', () => {
    this.CONSUME(t.ParenStart);
    this.OR([
      {
        ALT: () => {
          this.CONSUME2(t.ParenStart);
          this.SUBRULE(this.text);
          this.CONSUME(t.ParenEnd);
          this.CONSUME2(t.ParenEnd);
        },
      },
      {
        ALT: () => {
          this.SUBRULE2(this.text);
          this.CONSUME3(t.ParenEnd);
        },
      },
    ]);
  });

  // ellipse: (- text -)
  private ellipseShape = this.RULE('ellipseShape', () => {
    this.CONSUME(t.EllipseStart);
    this.SUBRULE(this.text);
    this.CONSUME(t.EllipseEnd);
  });

  // stadium: STADIUMSTART text STADIUMEND
  private stadiumShape = this.RULE('stadiumShape', () => {
    this.CONSUME(t.StadiumStart);
    this.SUBRULE(this.text);
    this.CONSUME(t.StadiumEnd);
  });

  // subroutine: SUBROUTINESTART text SUBROUTINEEND
  private subroutineShape = this.RULE('subroutineShape', () => {
    this.CONSUME(t.SubroutineStart);
    this.SUBRULE(this.text);
    this.CONSUME(t.SubroutineEnd);
  });

  // vertex with props: VERTEX_WITH_PROPS_START NODE_STRING COLON NODE_STRING PIPE text SQE
  private propsShape = this.RULE('propsShape', () => {
    this.CONSUME(t.VertexWithPropsStart);
    this.CONSUME(t.NodeString);
    this.CONSUME(t.Colon);
    this.CONSUME2(t.NodeString);
    this.CONSUME(t.Pipe);
    this.SUBRULE(this.text);
    this.CONSUME(t.SquareEnd);
  });

  // cylinder: CYLINDERSTART text CYLINDEREND
  private cylinderShape = this.RULE('cylinderShape', () => {
    this.CONSUME(t.CylinderStart);
    this.SUBRULE(this.text);
    this.CONSUME(t.CylinderEnd);
  });

  // diamond: DIAMOND_START text DIAMOND_STOP  |  hexagon: DIAMOND_START DIAMOND_START text DIAMOND_STOP DIAMOND_STOP
  private diamondOrHexShape = this.RULE('diamondOrHexShape', () => {
    this.CONSUME(t.DiamondStart);
    this.OR([
      {
        ALT: () => {
          this.CONSUME2(t.DiamondStart);
          this.SUBRULE(this.text);
          this.CONSUME(t.DiamondStop);
          this.CONSUME2(t.DiamondStop);
        },
      },
      {
        ALT: () => {
          this.SUBRULE2(this.text);
          this.CONSUME3(t.DiamondStop);
        },
      },
    ]);
  });

  // odd: TAGEND text SQE
  private oddShape = this.RULE('oddShape', () => {
    this.CONSUME(t.TagEnd);
    this.SUBRULE(this.text);
    this.CONSUME(t.SquareEnd);
  });

  // trapezoid / lean_right: TRAPSTART text (TRAPEND | INVTRAPEND)
  private trapShape = this.RULE('trapShape', () => {
    this.CONSUME(t.TrapStart);
    this.SUBRULE(this.text);
    this.OR([{ ALT: () => this.CONSUME(t.TrapEnd) }, { ALT: () => this.CONSUME(t.InvTrapEnd) }]);
  });

  // inv_trapezoid / lean_left: INVTRAPSTART text (TRAPEND | INVTRAPEND)
  private invTrapShape = this.RULE('invTrapShape', () => {
    this.CONSUME(t.InvTrapStart);
    this.SUBRULE(this.text);
    this.OR([{ ALT: () => this.CONSUME(t.TrapEnd) }, { ALT: () => this.CONSUME(t.InvTrapEnd) }]);
  });

  // ----- links -----

  // link: [LINK_ID] ( START_LINK edgeText LINK | LINK (arrowText (SPACE)?)? )
  private link = this.RULE('link', () => {
    this.OPTION(() => this.CONSUME(t.LinkId));
    this.OR([
      {
        ALT: () => {
          this.CONSUME(t.StartLink);
          this.SUBRULE(this.edgeText);
          this.CONSUME(t.Link);
        },
      },
      {
        ALT: () => {
          this.CONSUME2(t.Link);
          this.OPTION2(() => this.SUBRULE(this.arrowText));
          this.OPTION3(() => this.CONSUME(t.Space));
        },
      },
    ]);
  });

  // arrowText: PIPE text PIPE
  private arrowText = this.RULE('arrowText', () => {
    this.CONSUME(t.Pipe);
    this.SUBRULE(this.text);
    this.CONSUME2(t.Pipe);
  });

  // edgeText: (STR | MD_STR | edgeTextToken) edgeTextToken*
  // jison's `edgeText: edgeText edgeTextToken | STR | MD_STR` allows a string followed by more tokens.
  private edgeText = this.RULE('edgeText', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(t.StringContent);
          this.MANY(() => this.SUBRULE(this.edgeTextToken));
        },
      },
      {
        ALT: () => {
          this.CONSUME(t.MdString);
          this.MANY2(() => this.SUBRULE2(this.edgeTextToken));
        },
      },
      { ALT: () => this.AT_LEAST_ONE(() => this.SUBRULE3(this.edgeTextToken)) },
    ]);
  });

  // ----- statements -----

  // subgraph: subgraph SPACE textNoTags (SQS text SQE)? separator document end  | subgraph separator document end
  private subgraphStatement = this.RULE('subgraphStatement', () => {
    this.CONSUME(t.Subgraph);
    this.OPTION(() => {
      this.SUBRULE(this.spaceList);
      this.SUBRULE(this.textNoTags);
      this.OPTION2(() => {
        this.CONSUME(t.SquareStart);
        this.SUBRULE(this.text);
        this.CONSUME(t.SquareEnd);
      });
    });
    this.SUBRULE(this.separator);
    this.SUBRULE(this.document);
    this.CONSUME(t.End);
  });

  // classDefStatement: CLASSDEF SPACE idString SPACE stylesOpt
  private classDefStatement = this.RULE('classDefStatement', () => {
    this.CONSUME(t.ClassDef);
    this.SUBRULE(this.spaceList);
    this.SUBRULE(this.idString);
    this.SUBRULE2(this.spaceList);
    this.SUBRULE(this.stylesOpt);
  });

  // classStatement: CLASS SPACE idString SPACE idString
  private classStatement = this.RULE('classStatement', () => {
    this.CONSUME(t.Class);
    this.SUBRULE(this.spaceList);
    this.SUBRULE(this.idString);
    this.SUBRULE2(this.spaceList);
    this.SUBRULE2(this.idString);
  });

  // styleStatement: STYLE SPACE idString SPACE stylesOpt
  private styleStatement = this.RULE('styleStatement', () => {
    this.CONSUME(t.Style);
    this.SUBRULE(this.spaceList);
    this.SUBRULE(this.idString);
    this.SUBRULE2(this.spaceList);
    this.SUBRULE(this.stylesOpt);
  });

  // linkStyleStatement: LINKSTYLE SPACE (DEFAULT | numList) SPACE (INTERPOLATE SPACE alphaNum SPACE)? stylesOpt?
  // (covers all six jison alternatives)
  private linkStyleStatement = this.RULE('linkStyleStatement', () => {
    this.CONSUME(t.LinkStyle);
    this.SUBRULE(this.spaceList);
    this.OR([{ ALT: () => this.CONSUME(t.Default) }, { ALT: () => this.SUBRULE(this.numList) }]);
    this.SUBRULE2(this.spaceList);
    this.OPTION(() => {
      this.CONSUME(t.Interpolate);
      this.SUBRULE3(this.spaceList);
      this.SUBRULE(this.alphaNum);
      this.OPTION2(() => this.SUBRULE4(this.spaceList));
    });
    this.OPTION3(() => this.SUBRULE(this.stylesOpt));
  });

  // clickStatement: CLICK (CALLBACKNAME [CALLBACKARGS] | HREF STR [LINK_TARGET] | alphaNum | STR) ...tooltip/target
  private clickStatement = this.RULE('clickStatement', () => {
    this.CONSUME(t.Click);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(t.CallbackName);
          this.OPTION(() => this.CONSUME(t.CallbackArgs));
          this.OPTION2(() => {
            this.SUBRULE(this.spaceList);
            this.CONSUME(t.StringContent);
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(t.Href);
          this.CONSUME2(t.StringContent);
          this.OPTION3(() => {
            this.SUBRULE2(this.spaceList);
            this.OR2([
              { ALT: () => this.CONSUME(t.LinkTarget) },
              {
                ALT: () => {
                  this.CONSUME3(t.StringContent);
                  this.OPTION4(() => {
                    this.SUBRULE3(this.spaceList);
                    this.CONSUME2(t.LinkTarget);
                  });
                },
              },
            ]);
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME4(t.StringContent);
          this.OPTION5(() => {
            this.SUBRULE4(this.spaceList);
            this.OR3([
              { ALT: () => this.CONSUME3(t.LinkTarget) },
              {
                ALT: () => {
                  this.CONSUME5(t.StringContent);
                  this.OPTION6(() => {
                    this.SUBRULE5(this.spaceList);
                    this.CONSUME4(t.LinkTarget);
                  });
                },
              },
            ]);
          });
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.alphaNum);
          this.OPTION7(() => {
            this.SUBRULE6(this.spaceList);
            this.CONSUME6(t.StringContent);
          });
        },
      },
    ]);
  });

  // direction: direction_tb | direction_bt | direction_rl | direction_lr | direction_td
  private direction = this.RULE('direction', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.DirectionTB) },
      { ALT: () => this.CONSUME(t.DirectionBT) },
      { ALT: () => this.CONSUME(t.DirectionRL) },
      { ALT: () => this.CONSUME(t.DirectionLR) },
      { ALT: () => this.CONSUME(t.DirectionTD) },
    ]);
  });

  // ----- style lists -----

  // numList: NUM (COMMA NUM)*
  private numList = this.RULE('numList', () => {
    this.CONSUME(t.Num);
    this.MANY(() => {
      this.CONSUME(t.Comma);
      this.CONSUME2(t.Num);
    });
  });

  // stylesOpt: style (COMMA style)*
  private stylesOpt = this.RULE('stylesOpt', () => {
    this.SUBRULE(this.style);
    this.MANY(() => {
      this.CONSUME(t.Comma);
      this.SUBRULE2(this.style);
    });
  });

  // style: styleComponent+
  private style = this.RULE('style', () => {
    this.AT_LEAST_ONE(() => this.SUBRULE(this.styleComponent));
  });

  // styleComponent: NUM | NODE_STRING | COLON | UNIT | SPACE | BRKT | STYLE | PCT
  private styleComponent = this.RULE('styleComponent', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Num) },
      { ALT: () => this.CONSUME(t.NodeString) },
      { ALT: () => this.CONSUME(t.Colon) },
      { ALT: () => this.CONSUME(t.Unit) },
      { ALT: () => this.CONSUME(t.Space) },
      { ALT: () => this.CONSUME(t.Brkt) },
      { ALT: () => this.CONSUME(t.Style) },
      { ALT: () => this.CONSUME(t.Pct) },
    ]);
  });

  // ----- token lists -----

  private spaceList = this.RULE('spaceList', () => {
    this.AT_LEAST_ONE(() => this.CONSUME(t.Space));
  });

  // idString: idStringToken+
  private idString = this.RULE('idString', () => {
    this.AT_LEAST_ONE(() => this.SUBRULE(this.idStringToken));
  });

  private idStringToken = this.RULE('idStringToken', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Num) },
      { ALT: () => this.CONSUME(t.NodeString) },
      { ALT: () => this.CONSUME(t.Down) },
      { ALT: () => this.CONSUME(t.Minus) },
      { ALT: () => this.CONSUME(t.Default) },
      { ALT: () => this.CONSUME(t.Comma) },
      { ALT: () => this.CONSUME(t.Colon) },
      { ALT: () => this.CONSUME(t.Amp) },
      { ALT: () => this.CONSUME(t.Brkt) },
      { ALT: () => this.CONSUME(t.Mult) },
      { ALT: () => this.CONSUME(t.UnicodeText) },
    ]);
  });

  // alphaNum: alphaNumToken+
  private alphaNum = this.RULE('alphaNum', () => {
    this.AT_LEAST_ONE(() => this.SUBRULE(this.alphaNumToken));
  });

  private alphaNumToken = this.RULE('alphaNumToken', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Num) },
      { ALT: () => this.CONSUME(t.UnicodeText) },
      { ALT: () => this.CONSUME(t.NodeString) },
      { ALT: () => this.CONSUME(t.Dir) },
      { ALT: () => this.CONSUME(t.Down) },
      { ALT: () => this.CONSUME(t.Minus) },
      { ALT: () => this.CONSUME(t.Comma) },
      { ALT: () => this.CONSUME(t.Colon) },
      { ALT: () => this.CONSUME(t.Amp) },
      { ALT: () => this.CONSUME(t.Brkt) },
      { ALT: () => this.CONSUME(t.Mult) },
    ]);
  });

  // text: (STR | MD_STR | textToken) textToken*  (jison allows a string followed by more tokens)
  private text = this.RULE('text', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(t.StringContent);
          this.MANY(() => this.SUBRULE(this.textToken));
        },
      },
      {
        ALT: () => {
          this.CONSUME(t.MdString);
          this.MANY2(() => this.SUBRULE2(this.textToken));
        },
      },
      { ALT: () => this.AT_LEAST_ONE(() => this.SUBRULE3(this.textToken)) },
    ]);
  });

  // textToken: TEXT | TAGSTART | TAGEND | UNICODE_TEXT
  private textToken = this.RULE('textToken', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.TextToken) },
      { ALT: () => this.CONSUME(t.TagStart) },
      { ALT: () => this.CONSUME(t.TagEnd) },
      { ALT: () => this.CONSUME(t.UnicodeText) },
    ]);
  });

  // textNoTags: (STR | MD_STR | textNoTagsToken) textNoTagsToken*  (string may be followed by tokens)
  private textNoTags = this.RULE('textNoTags', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(t.StringContent);
          this.MANY(() => this.SUBRULE(this.textNoTagsToken));
        },
      },
      {
        ALT: () => {
          this.CONSUME(t.MdString);
          this.MANY2(() => this.SUBRULE2(this.textNoTagsToken));
        },
      },
      { ALT: () => this.AT_LEAST_ONE(() => this.SUBRULE3(this.textNoTagsToken)) },
    ]);
  });

  // textNoTagsToken: NUM | NODE_STRING | SPACE | MINUS | AMP | UNICODE_TEXT | COLON | MULT | BRKT | keywords | START_LINK
  private textNoTagsToken = this.RULE('textNoTagsToken', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Num) },
      { ALT: () => this.CONSUME(t.NodeString) },
      { ALT: () => this.CONSUME(t.Space) },
      { ALT: () => this.CONSUME(t.Minus) },
      { ALT: () => this.CONSUME(t.Amp) },
      { ALT: () => this.CONSUME(t.UnicodeText) },
      { ALT: () => this.CONSUME(t.Colon) },
      { ALT: () => this.CONSUME(t.Mult) },
      { ALT: () => this.CONSUME(t.Brkt) },
      { ALT: () => this.SUBRULE(this.keywords) },
      { ALT: () => this.CONSUME(t.StartLink) },
    ]);
  });

  // edgeTextToken: EDGE_TEXT | UNICODE_TEXT
  private edgeTextToken = this.RULE('edgeTextToken', () => {
    this.OR([{ ALT: () => this.CONSUME(t.EdgeText) }, { ALT: () => this.CONSUME(t.UnicodeText) }]);
  });

  // keywords: STYLE | LINKSTYLE | CLASSDEF | CLASS | CLICK | GRAPH | DIR | subgraph | end | DOWN | UP
  private keywords = this.RULE('keywords', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Style) },
      { ALT: () => this.CONSUME(t.LinkStyle) },
      { ALT: () => this.CONSUME(t.ClassDef) },
      { ALT: () => this.CONSUME(t.Class) },
      { ALT: () => this.CONSUME(t.Click) },
      { ALT: () => this.CONSUME(t.Graph) },
      { ALT: () => this.CONSUME(t.Dir) },
      { ALT: () => this.CONSUME(t.Subgraph) },
      { ALT: () => this.CONSUME(t.End) },
      { ALT: () => this.CONSUME(t.Down) },
      { ALT: () => this.CONSUME(t.Up) },
    ]);
  });

  // shapeData: SHAPE_DATA+
  private shapeData = this.RULE('shapeData', () => {
    this.AT_LEAST_ONE(() => this.CONSUME(t.ShapeData));
  });
}

export const flowParser = new FlowchartParser();
