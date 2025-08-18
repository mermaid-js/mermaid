// Generated from Flow.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { FlowListener } from "./FlowListener";
import { FlowVisitor } from "./FlowVisitor";


export class FlowParser extends Parser {
	public static readonly GRAPH_GRAPH = 1;
	public static readonly FLOWCHART = 2;
	public static readonly FLOWCHART_ELK = 3;
	public static readonly NODIR = 4;
	public static readonly HREF_KEYWORD = 5;
	public static readonly CALL_KEYWORD = 6;
	public static readonly SUBGRAPH = 7;
	public static readonly END = 8;
	public static readonly STYLE = 9;
	public static readonly LINKSTYLE = 10;
	public static readonly CLASSDEF = 11;
	public static readonly CLASS = 12;
	public static readonly CLICK = 13;
	public static readonly ACC_TITLE = 14;
	public static readonly ACC_DESCR = 15;
	public static readonly SHAPE_DATA = 16;
	public static readonly AMP = 17;
	public static readonly STYLE_SEPARATOR = 18;
	public static readonly ARROW_REGULAR = 19;
	public static readonly ARROW_SIMPLE = 20;
	public static readonly ARROW_BIDIRECTIONAL = 21;
	public static readonly ARROW_BIDIRECTIONAL_SIMPLE = 22;
	public static readonly LINK_REGULAR = 23;
	public static readonly START_LINK_REGULAR = 24;
	public static readonly LINK_THICK = 25;
	public static readonly START_LINK_THICK = 26;
	public static readonly LINK_DOTTED = 27;
	public static readonly START_LINK_DOTTED = 28;
	public static readonly LINK_INVISIBLE = 29;
	public static readonly ELLIPSE_START = 30;
	public static readonly STADIUM_START = 31;
	public static readonly SUBROUTINE_START = 32;
	public static readonly VERTEX_WITH_PROPS_START = 33;
	public static readonly TAGEND_PUSH = 34;
	public static readonly CYLINDER_START = 35;
	public static readonly DOUBLECIRCLESTART = 36;
	public static readonly DOUBLECIRCLEEND = 37;
	public static readonly TRAPEZOID_START = 38;
	public static readonly INV_TRAPEZOID_START = 39;
	public static readonly ELLIPSE_END = 40;
	public static readonly STADIUM_END = 41;
	public static readonly SUBROUTINE_END = 42;
	public static readonly TRAPEZOID_END = 43;
	public static readonly INV_TRAPEZOID_END = 44;
	public static readonly TAGSTART = 45;
	public static readonly UP = 46;
	public static readonly DOWN = 47;
	public static readonly MINUS = 48;
	public static readonly UNICODE_TEXT = 49;
	public static readonly PS = 50;
	public static readonly PE = 51;
	public static readonly SQS = 52;
	public static readonly SQE = 53;
	public static readonly DIAMOND_START = 54;
	public static readonly DIAMOND_STOP = 55;
	public static readonly NEWLINE = 56;
	public static readonly SPACE = 57;
	public static readonly SEMI = 58;
	public static readonly COLON = 59;
	public static readonly LINK_TARGET = 60;
	public static readonly STR = 61;
	public static readonly MD_STR = 62;
	public static readonly DIRECTION_TD = 63;
	public static readonly DIRECTION_LR = 64;
	public static readonly DIRECTION_RL = 65;
	public static readonly DIRECTION_BT = 66;
	public static readonly DIRECTION_TB = 67;
	public static readonly TEXT = 68;
	public static readonly NODE_STRING = 69;
	public static readonly CYLINDER_END = 70;
	public static readonly TAGEND = 71;
	public static readonly SEP = 72;
	public static readonly RULE_start = 0;
	public static readonly RULE_document = 1;
	public static readonly RULE_line = 2;
	public static readonly RULE_graphConfig = 3;
	public static readonly RULE_direction = 4;
	public static readonly RULE_statement = 5;
	public static readonly RULE_vertexStatement = 6;
	public static readonly RULE_node = 7;
	public static readonly RULE_styledVertex = 8;
	public static readonly RULE_vertex = 9;
	public static readonly RULE_link = 10;
	public static readonly RULE_linkStatement = 11;
	public static readonly RULE_text = 12;
	public static readonly RULE_textToken = 13;
	public static readonly RULE_idString = 14;
	public static readonly RULE_edgeText = 15;
	public static readonly RULE_edgeTextToken = 16;
	public static readonly RULE_arrowText = 17;
	public static readonly RULE_subgraphStatement = 18;
	public static readonly RULE_accessibilityStatement = 19;
	public static readonly RULE_styleStatement = 20;
	public static readonly RULE_linkStyleStatement = 21;
	public static readonly RULE_classDefStatement = 22;
	public static readonly RULE_classStatement = 23;
	public static readonly RULE_clickStatement = 24;
	public static readonly RULE_separator = 25;
	public static readonly RULE_firstStmtSeparator = 26;
	public static readonly RULE_spaceList = 27;
	public static readonly RULE_textNoTags = 28;
	public static readonly RULE_shapeData = 29;
	public static readonly RULE_styleDefinition = 30;
	public static readonly RULE_callbackName = 31;
	public static readonly RULE_callbackArgs = 32;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"start", "document", "line", "graphConfig", "direction", "statement", 
		"vertexStatement", "node", "styledVertex", "vertex", "link", "linkStatement", 
		"text", "textToken", "idString", "edgeText", "edgeTextToken", "arrowText", 
		"subgraphStatement", "accessibilityStatement", "styleStatement", "linkStyleStatement", 
		"classDefStatement", "classStatement", "clickStatement", "separator", 
		"firstStmtSeparator", "spaceList", "textNoTags", "shapeData", "styleDefinition", 
		"callbackName", "callbackArgs",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'graph'", "'flowchart'", "'flowchart-elk'", "'NODIR'", "'href'", 
		"'call'", "'subgraph'", "'end'", "'style'", "'linkStyle'", "'classDef'", 
		"'class'", "'click'", "'accTitle'", "'accDescr'", undefined, "'&'", "':::'", 
		"'-->'", "'->'", "'<-->'", "'<->'", undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, "'(-'", "'(['", "'[['", "'[|'", "'>'", 
		"'[('", "'((('", "')))'", "'[/'", "'[\\'", "'-)'", "')]'", "']]'", "'/]'", 
		"'\\'", "'<'", "'^'", "'v'", "'-'", undefined, "'('", "')'", "'['", "']'", 
		"'{'", "'}'", undefined, undefined, "';'", "':'", undefined, undefined, 
		undefined, "'TD'", "'LR'", "'RL'", "'BT'", "'TB'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, "GRAPH_GRAPH", "FLOWCHART", "FLOWCHART_ELK", "NODIR", "HREF_KEYWORD", 
		"CALL_KEYWORD", "SUBGRAPH", "END", "STYLE", "LINKSTYLE", "CLASSDEF", "CLASS", 
		"CLICK", "ACC_TITLE", "ACC_DESCR", "SHAPE_DATA", "AMP", "STYLE_SEPARATOR", 
		"ARROW_REGULAR", "ARROW_SIMPLE", "ARROW_BIDIRECTIONAL", "ARROW_BIDIRECTIONAL_SIMPLE", 
		"LINK_REGULAR", "START_LINK_REGULAR", "LINK_THICK", "START_LINK_THICK", 
		"LINK_DOTTED", "START_LINK_DOTTED", "LINK_INVISIBLE", "ELLIPSE_START", 
		"STADIUM_START", "SUBROUTINE_START", "VERTEX_WITH_PROPS_START", "TAGEND_PUSH", 
		"CYLINDER_START", "DOUBLECIRCLESTART", "DOUBLECIRCLEEND", "TRAPEZOID_START", 
		"INV_TRAPEZOID_START", "ELLIPSE_END", "STADIUM_END", "SUBROUTINE_END", 
		"TRAPEZOID_END", "INV_TRAPEZOID_END", "TAGSTART", "UP", "DOWN", "MINUS", 
		"UNICODE_TEXT", "PS", "PE", "SQS", "SQE", "DIAMOND_START", "DIAMOND_STOP", 
		"NEWLINE", "SPACE", "SEMI", "COLON", "LINK_TARGET", "STR", "MD_STR", "DIRECTION_TD", 
		"DIRECTION_LR", "DIRECTION_RL", "DIRECTION_BT", "DIRECTION_TB", "TEXT", 
		"NODE_STRING", "CYLINDER_END", "TAGEND", "SEP",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(FlowParser._LITERAL_NAMES, FlowParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return FlowParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "Flow.g4"; }

	// @Override
	public get ruleNames(): string[] { return FlowParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return FlowParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(FlowParser._ATN, this);
	}
	// @RuleVersion(0)
	public start(): StartContext {
		let _localctx: StartContext = new StartContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, FlowParser.RULE_start);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 66;
			this.graphConfig();
			this.state = 67;
			this.document(0);
			this.state = 68;
			this.match(FlowParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public document(): DocumentContext;
	public document(_p: number): DocumentContext;
	// @RuleVersion(0)
	public document(_p?: number): DocumentContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: DocumentContext = new DocumentContext(this._ctx, _parentState);
		let _prevctx: DocumentContext = _localctx;
		let _startState: number = 2;
		this.enterRecursionRule(_localctx, 2, FlowParser.RULE_document, _p);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			{
			_localctx = new EmptyDocumentContext(_localctx);
			this._ctx = _localctx;
			_prevctx = _localctx;

			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 75;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 0, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					if (this._parseListeners != null) {
						this.triggerExitRuleEvent();
					}
					_prevctx = _localctx;
					{
					{
					_localctx = new DocumentWithLineContext(new DocumentContext(_parentctx, _parentState));
					this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_document);
					this.state = 71;
					if (!(this.precpred(this._ctx, 1))) {
						throw this.createFailedPredicateException("this.precpred(this._ctx, 1)");
					}
					this.state = 72;
					this.line();
					}
					}
				}
				this.state = 77;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 0, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public line(): LineContext {
		let _localctx: LineContext = new LineContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, FlowParser.RULE_line);
		try {
			this.state = 82;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.SUBGRAPH:
			case FlowParser.STYLE:
			case FlowParser.LINKSTYLE:
			case FlowParser.CLASSDEF:
			case FlowParser.CLASS:
			case FlowParser.CLICK:
			case FlowParser.ACC_TITLE:
			case FlowParser.ACC_DESCR:
			case FlowParser.DIRECTION_TD:
			case FlowParser.DIRECTION_LR:
			case FlowParser.DIRECTION_RL:
			case FlowParser.DIRECTION_BT:
			case FlowParser.DIRECTION_TB:
			case FlowParser.TEXT:
			case FlowParser.NODE_STRING:
				_localctx = new StatementLineContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 78;
				this.statement();
				}
				break;
			case FlowParser.SEMI:
				_localctx = new SemicolonLineContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 79;
				this.match(FlowParser.SEMI);
				}
				break;
			case FlowParser.NEWLINE:
				_localctx = new NewlineLineContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 80;
				this.match(FlowParser.NEWLINE);
				}
				break;
			case FlowParser.SPACE:
				_localctx = new SpaceLineContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 81;
				this.match(FlowParser.SPACE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public graphConfig(): GraphConfigContext {
		let _localctx: GraphConfigContext = new GraphConfigContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, FlowParser.RULE_graphConfig);
		try {
			this.state = 98;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 2, this._ctx) ) {
			case 1:
				_localctx = new SpaceGraphConfigContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 84;
				this.match(FlowParser.SPACE);
				this.state = 85;
				this.graphConfig();
				}
				break;

			case 2:
				_localctx = new NewlineGraphConfigContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 86;
				this.match(FlowParser.NEWLINE);
				this.state = 87;
				this.graphConfig();
				}
				break;

			case 3:
				_localctx = new GraphNoDirectionContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 88;
				this.match(FlowParser.GRAPH_GRAPH);
				this.state = 89;
				this.match(FlowParser.NODIR);
				}
				break;

			case 4:
				_localctx = new GraphWithDirectionContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 90;
				this.match(FlowParser.GRAPH_GRAPH);
				this.state = 91;
				this.match(FlowParser.SPACE);
				this.state = 92;
				this.direction();
				this.state = 93;
				this.firstStmtSeparator();
				}
				break;

			case 5:
				_localctx = new GraphWithDirectionNoSeparatorContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 95;
				this.match(FlowParser.GRAPH_GRAPH);
				this.state = 96;
				this.match(FlowParser.SPACE);
				this.state = 97;
				this.direction();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public direction(): DirectionContext {
		let _localctx: DirectionContext = new DirectionContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, FlowParser.RULE_direction);
		try {
			this.state = 106;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.DIRECTION_TD:
				_localctx = new DirectionTDContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 100;
				this.match(FlowParser.DIRECTION_TD);
				}
				break;
			case FlowParser.DIRECTION_LR:
				_localctx = new DirectionLRContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 101;
				this.match(FlowParser.DIRECTION_LR);
				}
				break;
			case FlowParser.DIRECTION_RL:
				_localctx = new DirectionRLContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 102;
				this.match(FlowParser.DIRECTION_RL);
				}
				break;
			case FlowParser.DIRECTION_BT:
				_localctx = new DirectionBTContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 103;
				this.match(FlowParser.DIRECTION_BT);
				}
				break;
			case FlowParser.DIRECTION_TB:
				_localctx = new DirectionTBContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 104;
				this.match(FlowParser.DIRECTION_TB);
				}
				break;
			case FlowParser.TEXT:
				_localctx = new DirectionTextContext(_localctx);
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 105;
				this.match(FlowParser.TEXT);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public statement(): StatementContext {
		let _localctx: StatementContext = new StatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, FlowParser.RULE_statement);
		try {
			this.state = 131;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 4, this._ctx) ) {
			case 1:
				_localctx = new VertexStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 108;
				this.vertexStatement(0);
				this.state = 109;
				this.separator();
				}
				break;

			case 2:
				_localctx = new StyleStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 111;
				this.styleStatement();
				this.state = 112;
				this.separator();
				}
				break;

			case 3:
				_localctx = new LinkStyleStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 114;
				this.linkStyleStatement();
				this.state = 115;
				this.separator();
				}
				break;

			case 4:
				_localctx = new ClassDefStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 117;
				this.classDefStatement();
				this.state = 118;
				this.separator();
				}
				break;

			case 5:
				_localctx = new ClassStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 120;
				this.classStatement();
				this.state = 121;
				this.separator();
				}
				break;

			case 6:
				_localctx = new ClickStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 123;
				this.clickStatement();
				this.state = 124;
				this.separator();
				}
				break;

			case 7:
				_localctx = new SubgraphStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 126;
				this.subgraphStatement();
				this.state = 127;
				this.separator();
				}
				break;

			case 8:
				_localctx = new DirectionStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 129;
				this.direction();
				}
				break;

			case 9:
				_localctx = new AccessibilityStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 130;
				this.accessibilityStatement();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public vertexStatement(): VertexStatementContext;
	public vertexStatement(_p: number): VertexStatementContext;
	// @RuleVersion(0)
	public vertexStatement(_p?: number): VertexStatementContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: VertexStatementContext = new VertexStatementContext(this._ctx, _parentState);
		let _prevctx: VertexStatementContext = _localctx;
		let _startState: number = 12;
		this.enterRecursionRule(_localctx, 12, FlowParser.RULE_vertexStatement, _p);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 141;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 5, this._ctx) ) {
			case 1:
				{
				_localctx = new NodeWithSpaceContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;

				this.state = 134;
				this.node(0);
				this.state = 135;
				this.spaceList();
				}
				break;

			case 2:
				{
				_localctx = new NodeWithShapeDataContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 137;
				this.node(0);
				this.state = 138;
				this.shapeData(0);
				}
				break;

			case 3:
				{
				_localctx = new SingleNodeContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 140;
				this.node(0);
				}
				break;
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 159;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 7, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					if (this._parseListeners != null) {
						this.triggerExitRuleEvent();
					}
					_prevctx = _localctx;
					{
					this.state = 157;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input, 6, this._ctx) ) {
					case 1:
						{
						_localctx = new VertexWithShapeDataContext(new VertexStatementContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_vertexStatement);
						this.state = 143;
						if (!(this.precpred(this._ctx, 6))) {
							throw this.createFailedPredicateException("this.precpred(this._ctx, 6)");
						}
						this.state = 144;
						this.link();
						this.state = 145;
						this.node(0);
						this.state = 146;
						this.shapeData(0);
						}
						break;

					case 2:
						{
						_localctx = new VertexWithLinkContext(new VertexStatementContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_vertexStatement);
						this.state = 148;
						if (!(this.precpred(this._ctx, 5))) {
							throw this.createFailedPredicateException("this.precpred(this._ctx, 5)");
						}
						this.state = 149;
						this.link();
						this.state = 150;
						this.node(0);
						}
						break;

					case 3:
						{
						_localctx = new VertexWithLinkAndSpaceContext(new VertexStatementContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_vertexStatement);
						this.state = 152;
						if (!(this.precpred(this._ctx, 4))) {
							throw this.createFailedPredicateException("this.precpred(this._ctx, 4)");
						}
						this.state = 153;
						this.link();
						this.state = 154;
						this.node(0);
						this.state = 155;
						this.spaceList();
						}
						break;
					}
					}
				}
				this.state = 161;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 7, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	public node(): NodeContext;
	public node(_p: number): NodeContext;
	// @RuleVersion(0)
	public node(_p?: number): NodeContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: NodeContext = new NodeContext(this._ctx, _parentState);
		let _prevctx: NodeContext = _localctx;
		let _startState: number = 14;
		this.enterRecursionRule(_localctx, 14, FlowParser.RULE_node, _p);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			{
			_localctx = new SingleStyledVertexContext(_localctx);
			this._ctx = _localctx;
			_prevctx = _localctx;

			this.state = 163;
			this.styledVertex();
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 180;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 9, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					if (this._parseListeners != null) {
						this.triggerExitRuleEvent();
					}
					_prevctx = _localctx;
					{
					this.state = 178;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input, 8, this._ctx) ) {
					case 1:
						{
						_localctx = new NodeWithShapeDataAndAmpContext(new NodeContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_node);
						this.state = 165;
						if (!(this.precpred(this._ctx, 2))) {
							throw this.createFailedPredicateException("this.precpred(this._ctx, 2)");
						}
						this.state = 166;
						this.shapeData(0);
						this.state = 167;
						this.spaceList();
						this.state = 168;
						this.match(FlowParser.AMP);
						this.state = 169;
						this.spaceList();
						this.state = 170;
						this.styledVertex();
						}
						break;

					case 2:
						{
						_localctx = new NodeWithAmpContext(new NodeContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_node);
						this.state = 172;
						if (!(this.precpred(this._ctx, 1))) {
							throw this.createFailedPredicateException("this.precpred(this._ctx, 1)");
						}
						this.state = 173;
						this.spaceList();
						this.state = 174;
						this.match(FlowParser.AMP);
						this.state = 175;
						this.spaceList();
						this.state = 176;
						this.styledVertex();
						}
						break;
					}
					}
				}
				this.state = 182;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 9, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public styledVertex(): StyledVertexContext {
		let _localctx: StyledVertexContext = new StyledVertexContext(this._ctx, this.state);
		this.enterRule(_localctx, 16, FlowParser.RULE_styledVertex);
		try {
			this.state = 188;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 10, this._ctx) ) {
			case 1:
				_localctx = new PlainVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 183;
				this.vertex();
				}
				break;

			case 2:
				_localctx = new StyledVertexWithClassContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 184;
				this.vertex();
				this.state = 185;
				this.match(FlowParser.STYLE_SEPARATOR);
				this.state = 186;
				this.idString();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public vertex(): VertexContext {
		let _localctx: VertexContext = new VertexContext(this._ctx, this.state);
		this.enterRule(_localctx, 18, FlowParser.RULE_vertex);
		try {
			this.state = 260;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 11, this._ctx) ) {
			case 1:
				_localctx = new SquareVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 190;
				this.idString();
				this.state = 191;
				this.match(FlowParser.SQS);
				this.state = 192;
				this.text(0);
				this.state = 193;
				this.match(FlowParser.SQE);
				}
				break;

			case 2:
				_localctx = new DoubleCircleVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 195;
				this.idString();
				this.state = 196;
				this.match(FlowParser.DOUBLECIRCLESTART);
				this.state = 197;
				this.text(0);
				this.state = 198;
				this.match(FlowParser.DOUBLECIRCLEEND);
				}
				break;

			case 3:
				_localctx = new CircleVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 200;
				this.idString();
				this.state = 201;
				this.match(FlowParser.PS);
				this.state = 202;
				this.match(FlowParser.PS);
				this.state = 203;
				this.text(0);
				this.state = 204;
				this.match(FlowParser.PE);
				this.state = 205;
				this.match(FlowParser.PE);
				}
				break;

			case 4:
				_localctx = new EllipseVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 207;
				this.idString();
				this.state = 208;
				this.match(FlowParser.ELLIPSE_START);
				this.state = 209;
				this.text(0);
				this.state = 210;
				this.match(FlowParser.ELLIPSE_END);
				}
				break;

			case 5:
				_localctx = new StadiumVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 212;
				this.idString();
				this.state = 213;
				this.match(FlowParser.STADIUM_START);
				this.state = 214;
				this.text(0);
				this.state = 215;
				this.match(FlowParser.STADIUM_END);
				}
				break;

			case 6:
				_localctx = new SubroutineVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 217;
				this.idString();
				this.state = 218;
				this.match(FlowParser.SUBROUTINE_START);
				this.state = 219;
				this.text(0);
				this.state = 220;
				this.match(FlowParser.SUBROUTINE_END);
				}
				break;

			case 7:
				_localctx = new CylinderVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 222;
				this.idString();
				this.state = 223;
				this.match(FlowParser.CYLINDER_START);
				this.state = 224;
				this.text(0);
				this.state = 225;
				this.match(FlowParser.CYLINDER_END);
				}
				break;

			case 8:
				_localctx = new RoundVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 227;
				this.idString();
				this.state = 228;
				this.match(FlowParser.PS);
				this.state = 229;
				this.text(0);
				this.state = 230;
				this.match(FlowParser.PE);
				}
				break;

			case 9:
				_localctx = new DiamondVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 232;
				this.idString();
				this.state = 233;
				this.match(FlowParser.DIAMOND_START);
				this.state = 234;
				this.text(0);
				this.state = 235;
				this.match(FlowParser.DIAMOND_STOP);
				}
				break;

			case 10:
				_localctx = new HexagonVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 10);
				{
				this.state = 237;
				this.idString();
				this.state = 238;
				this.match(FlowParser.DIAMOND_START);
				this.state = 239;
				this.match(FlowParser.DIAMOND_START);
				this.state = 240;
				this.text(0);
				this.state = 241;
				this.match(FlowParser.DIAMOND_STOP);
				this.state = 242;
				this.match(FlowParser.DIAMOND_STOP);
				}
				break;

			case 11:
				_localctx = new OddVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 11);
				{
				this.state = 244;
				this.idString();
				this.state = 245;
				this.match(FlowParser.TAGEND);
				this.state = 246;
				this.text(0);
				this.state = 247;
				this.match(FlowParser.SQE);
				}
				break;

			case 12:
				_localctx = new TrapezoidVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 12);
				{
				this.state = 249;
				this.idString();
				this.state = 250;
				this.match(FlowParser.TRAPEZOID_START);
				this.state = 251;
				this.text(0);
				this.state = 252;
				this.match(FlowParser.TRAPEZOID_END);
				}
				break;

			case 13:
				_localctx = new InvTrapezoidVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 13);
				{
				this.state = 254;
				this.idString();
				this.state = 255;
				this.match(FlowParser.INV_TRAPEZOID_START);
				this.state = 256;
				this.text(0);
				this.state = 257;
				this.match(FlowParser.INV_TRAPEZOID_END);
				}
				break;

			case 14:
				_localctx = new PlainIdVertexContext(_localctx);
				this.enterOuterAlt(_localctx, 14);
				{
				this.state = 259;
				this.idString();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public link(): LinkContext {
		let _localctx: LinkContext = new LinkContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, FlowParser.RULE_link);
		try {
			this.state = 270;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 12, this._ctx) ) {
			case 1:
				_localctx = new LinkWithArrowTextContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 262;
				this.linkStatement();
				this.state = 263;
				this.arrowText();
				}
				break;

			case 2:
				_localctx = new PlainLinkContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 265;
				this.linkStatement();
				}
				break;

			case 3:
				_localctx = new StartLinkWithTextContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 266;
				this.match(FlowParser.START_LINK_REGULAR);
				this.state = 267;
				this.edgeText(0);
				this.state = 268;
				this.match(FlowParser.LINK_REGULAR);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public linkStatement(): LinkStatementContext {
		let _localctx: LinkStatementContext = new LinkStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, FlowParser.RULE_linkStatement);
		try {
			this.state = 279;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.ARROW_REGULAR:
				_localctx = new RegularArrowContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 272;
				this.match(FlowParser.ARROW_REGULAR);
				}
				break;
			case FlowParser.ARROW_SIMPLE:
				_localctx = new SimpleArrowContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 273;
				this.match(FlowParser.ARROW_SIMPLE);
				}
				break;
			case FlowParser.ARROW_BIDIRECTIONAL:
				_localctx = new BidirectionalArrowContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 274;
				this.match(FlowParser.ARROW_BIDIRECTIONAL);
				}
				break;
			case FlowParser.LINK_REGULAR:
				_localctx = new RegularLinkContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 275;
				this.match(FlowParser.LINK_REGULAR);
				}
				break;
			case FlowParser.LINK_THICK:
				_localctx = new ThickLinkContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 276;
				this.match(FlowParser.LINK_THICK);
				}
				break;
			case FlowParser.LINK_DOTTED:
				_localctx = new DottedLinkContext(_localctx);
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 277;
				this.match(FlowParser.LINK_DOTTED);
				}
				break;
			case FlowParser.LINK_INVISIBLE:
				_localctx = new InvisibleLinkContext(_localctx);
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 278;
				this.match(FlowParser.LINK_INVISIBLE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public text(): TextContext;
	public text(_p: number): TextContext;
	// @RuleVersion(0)
	public text(_p?: number): TextContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: TextContext = new TextContext(this._ctx, _parentState);
		let _prevctx: TextContext = _localctx;
		let _startState: number = 24;
		this.enterRecursionRule(_localctx, 24, FlowParser.RULE_text, _p);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			{
			_localctx = new SingleTextTokenContext(_localctx);
			this._ctx = _localctx;
			_prevctx = _localctx;

			this.state = 282;
			this.textToken();
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 288;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 14, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					if (this._parseListeners != null) {
						this.triggerExitRuleEvent();
					}
					_prevctx = _localctx;
					{
					{
					_localctx = new MultipleTextTokensContext(new TextContext(_parentctx, _parentState));
					this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_text);
					this.state = 284;
					if (!(this.precpred(this._ctx, 1))) {
						throw this.createFailedPredicateException("this.precpred(this._ctx, 1)");
					}
					this.state = 285;
					this.textToken();
					}
					}
				}
				this.state = 290;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 14, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public textToken(): TextTokenContext {
		let _localctx: TextTokenContext = new TextTokenContext(this._ctx, this.state);
		this.enterRule(_localctx, 26, FlowParser.RULE_textToken);
		try {
			this.state = 295;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.TEXT:
				_localctx = new PlainTextContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 291;
				this.match(FlowParser.TEXT);
				}
				break;
			case FlowParser.STR:
				_localctx = new StringTextContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 292;
				this.match(FlowParser.STR);
				}
				break;
			case FlowParser.MD_STR:
				_localctx = new MarkdownTextContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 293;
				this.match(FlowParser.MD_STR);
				}
				break;
			case FlowParser.NODE_STRING:
				_localctx = new NodeStringTextContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 294;
				this.match(FlowParser.NODE_STRING);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public idString(): IdStringContext {
		let _localctx: IdStringContext = new IdStringContext(this._ctx, this.state);
		this.enterRule(_localctx, 28, FlowParser.RULE_idString);
		try {
			this.state = 299;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.TEXT:
				_localctx = new TextIdContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 297;
				this.match(FlowParser.TEXT);
				}
				break;
			case FlowParser.NODE_STRING:
				_localctx = new NodeStringIdContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 298;
				this.match(FlowParser.NODE_STRING);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public edgeText(): EdgeTextContext;
	public edgeText(_p: number): EdgeTextContext;
	// @RuleVersion(0)
	public edgeText(_p?: number): EdgeTextContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: EdgeTextContext = new EdgeTextContext(this._ctx, _parentState);
		let _prevctx: EdgeTextContext = _localctx;
		let _startState: number = 30;
		this.enterRecursionRule(_localctx, 30, FlowParser.RULE_edgeText, _p);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 305;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.TEXT:
			case FlowParser.NODE_STRING:
				{
				_localctx = new SingleEdgeTextTokenContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;

				this.state = 302;
				this.edgeTextToken();
				}
				break;
			case FlowParser.STR:
				{
				_localctx = new StringEdgeTextContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 303;
				this.match(FlowParser.STR);
				}
				break;
			case FlowParser.MD_STR:
				{
				_localctx = new MarkdownEdgeTextContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 304;
				this.match(FlowParser.MD_STR);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 311;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 18, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					if (this._parseListeners != null) {
						this.triggerExitRuleEvent();
					}
					_prevctx = _localctx;
					{
					{
					_localctx = new MultipleEdgeTextTokensContext(new EdgeTextContext(_parentctx, _parentState));
					this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_edgeText);
					this.state = 307;
					if (!(this.precpred(this._ctx, 3))) {
						throw this.createFailedPredicateException("this.precpred(this._ctx, 3)");
					}
					this.state = 308;
					this.edgeTextToken();
					}
					}
				}
				this.state = 313;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 18, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public edgeTextToken(): EdgeTextTokenContext {
		let _localctx: EdgeTextTokenContext = new EdgeTextTokenContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, FlowParser.RULE_edgeTextToken);
		try {
			this.state = 316;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.TEXT:
				_localctx = new PlainEdgeTextContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 314;
				this.match(FlowParser.TEXT);
				}
				break;
			case FlowParser.NODE_STRING:
				_localctx = new NodeStringEdgeTextContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 315;
				this.match(FlowParser.NODE_STRING);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public arrowText(): ArrowTextContext {
		let _localctx: ArrowTextContext = new ArrowTextContext(this._ctx, this.state);
		this.enterRule(_localctx, 34, FlowParser.RULE_arrowText);
		try {
			_localctx = new PipedArrowTextContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 318;
			this.match(FlowParser.SEP);
			this.state = 319;
			this.text(0);
			this.state = 320;
			this.match(FlowParser.SEP);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public subgraphStatement(): SubgraphStatementContext {
		let _localctx: SubgraphStatementContext = new SubgraphStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 36, FlowParser.RULE_subgraphStatement);
		try {
			this.state = 344;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 20, this._ctx) ) {
			case 1:
				_localctx = new SubgraphWithTitleContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 322;
				this.match(FlowParser.SUBGRAPH);
				this.state = 323;
				this.match(FlowParser.SPACE);
				this.state = 324;
				this.textNoTags();
				this.state = 325;
				this.match(FlowParser.SQS);
				this.state = 326;
				this.text(0);
				this.state = 327;
				this.match(FlowParser.SQE);
				this.state = 328;
				this.separator();
				this.state = 329;
				this.document(0);
				this.state = 330;
				this.match(FlowParser.END);
				}
				break;

			case 2:
				_localctx = new SubgraphWithTextNoTagsContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 332;
				this.match(FlowParser.SUBGRAPH);
				this.state = 333;
				this.match(FlowParser.SPACE);
				this.state = 334;
				this.textNoTags();
				this.state = 335;
				this.separator();
				this.state = 336;
				this.document(0);
				this.state = 337;
				this.match(FlowParser.END);
				}
				break;

			case 3:
				_localctx = new PlainSubgraphContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 339;
				this.match(FlowParser.SUBGRAPH);
				this.state = 340;
				this.separator();
				this.state = 341;
				this.document(0);
				this.state = 342;
				this.match(FlowParser.END);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public accessibilityStatement(): AccessibilityStatementContext {
		let _localctx: AccessibilityStatementContext = new AccessibilityStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 38, FlowParser.RULE_accessibilityStatement);
		try {
			this.state = 352;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.ACC_TITLE:
				_localctx = new AccTitleStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 346;
				this.match(FlowParser.ACC_TITLE);
				this.state = 347;
				this.match(FlowParser.COLON);
				this.state = 348;
				this.text(0);
				}
				break;
			case FlowParser.ACC_DESCR:
				_localctx = new AccDescrStmtContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 349;
				this.match(FlowParser.ACC_DESCR);
				this.state = 350;
				this.match(FlowParser.COLON);
				this.state = 351;
				this.text(0);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public styleStatement(): StyleStatementContext {
		let _localctx: StyleStatementContext = new StyleStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 40, FlowParser.RULE_styleStatement);
		try {
			_localctx = new StyleRuleContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 354;
			this.match(FlowParser.STYLE);
			this.state = 355;
			this.idString();
			this.state = 356;
			this.styleDefinition();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public linkStyleStatement(): LinkStyleStatementContext {
		let _localctx: LinkStyleStatementContext = new LinkStyleStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 42, FlowParser.RULE_linkStyleStatement);
		try {
			_localctx = new LinkStyleRuleContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 358;
			this.match(FlowParser.LINKSTYLE);
			this.state = 359;
			this.idString();
			this.state = 360;
			this.styleDefinition();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public classDefStatement(): ClassDefStatementContext {
		let _localctx: ClassDefStatementContext = new ClassDefStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 44, FlowParser.RULE_classDefStatement);
		try {
			_localctx = new ClassDefRuleContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 362;
			this.match(FlowParser.CLASSDEF);
			this.state = 363;
			this.idString();
			this.state = 364;
			this.styleDefinition();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public classStatement(): ClassStatementContext {
		let _localctx: ClassStatementContext = new ClassStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 46, FlowParser.RULE_classStatement);
		try {
			_localctx = new ClassRuleContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 366;
			this.match(FlowParser.CLASS);
			this.state = 367;
			this.idString();
			this.state = 368;
			this.idString();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public clickStatement(): ClickStatementContext {
		let _localctx: ClickStatementContext = new ClickStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 48, FlowParser.RULE_clickStatement);
		try {
			this.state = 434;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 22, this._ctx) ) {
			case 1:
				_localctx = new ClickCallbackRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 370;
				this.match(FlowParser.CLICK);
				this.state = 371;
				this.idString();
				this.state = 372;
				this.callbackName();
				}
				break;

			case 2:
				_localctx = new ClickCallbackTooltipRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 374;
				this.match(FlowParser.CLICK);
				this.state = 375;
				this.idString();
				this.state = 376;
				this.callbackName();
				this.state = 377;
				this.match(FlowParser.STR);
				}
				break;

			case 3:
				_localctx = new ClickCallbackArgsRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 379;
				this.match(FlowParser.CLICK);
				this.state = 380;
				this.idString();
				this.state = 381;
				this.callbackName();
				this.state = 382;
				this.callbackArgs();
				}
				break;

			case 4:
				_localctx = new ClickCallbackArgsTooltipRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 384;
				this.match(FlowParser.CLICK);
				this.state = 385;
				this.idString();
				this.state = 386;
				this.callbackName();
				this.state = 387;
				this.callbackArgs();
				this.state = 388;
				this.match(FlowParser.STR);
				}
				break;

			case 5:
				_localctx = new ClickHrefRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 390;
				this.match(FlowParser.CLICK);
				this.state = 391;
				this.idString();
				this.state = 392;
				this.match(FlowParser.HREF_KEYWORD);
				this.state = 393;
				this.match(FlowParser.STR);
				}
				break;

			case 6:
				_localctx = new ClickHrefTooltipRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 395;
				this.match(FlowParser.CLICK);
				this.state = 396;
				this.idString();
				this.state = 397;
				this.match(FlowParser.HREF_KEYWORD);
				this.state = 398;
				this.match(FlowParser.STR);
				this.state = 399;
				this.match(FlowParser.STR);
				}
				break;

			case 7:
				_localctx = new ClickHrefTargetRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 401;
				this.match(FlowParser.CLICK);
				this.state = 402;
				this.idString();
				this.state = 403;
				this.match(FlowParser.HREF_KEYWORD);
				this.state = 404;
				this.match(FlowParser.STR);
				this.state = 405;
				this.match(FlowParser.LINK_TARGET);
				}
				break;

			case 8:
				_localctx = new ClickHrefTooltipTargetRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 407;
				this.match(FlowParser.CLICK);
				this.state = 408;
				this.idString();
				this.state = 409;
				this.match(FlowParser.HREF_KEYWORD);
				this.state = 410;
				this.match(FlowParser.STR);
				this.state = 411;
				this.match(FlowParser.STR);
				this.state = 412;
				this.match(FlowParser.LINK_TARGET);
				}
				break;

			case 9:
				_localctx = new ClickLinkRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 414;
				this.match(FlowParser.CLICK);
				this.state = 415;
				this.idString();
				this.state = 416;
				this.match(FlowParser.STR);
				}
				break;

			case 10:
				_localctx = new ClickLinkTooltipRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 10);
				{
				this.state = 418;
				this.match(FlowParser.CLICK);
				this.state = 419;
				this.idString();
				this.state = 420;
				this.match(FlowParser.STR);
				this.state = 421;
				this.match(FlowParser.STR);
				}
				break;

			case 11:
				_localctx = new ClickLinkTargetRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 11);
				{
				this.state = 423;
				this.match(FlowParser.CLICK);
				this.state = 424;
				this.idString();
				this.state = 425;
				this.match(FlowParser.STR);
				this.state = 426;
				this.match(FlowParser.LINK_TARGET);
				}
				break;

			case 12:
				_localctx = new ClickLinkTooltipTargetRuleContext(_localctx);
				this.enterOuterAlt(_localctx, 12);
				{
				this.state = 428;
				this.match(FlowParser.CLICK);
				this.state = 429;
				this.idString();
				this.state = 430;
				this.match(FlowParser.STR);
				this.state = 431;
				this.match(FlowParser.STR);
				this.state = 432;
				this.match(FlowParser.LINK_TARGET);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public separator(): SeparatorContext {
		let _localctx: SeparatorContext = new SeparatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 50, FlowParser.RULE_separator);
		try {
			this.state = 439;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 23, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 436;
				this.match(FlowParser.NEWLINE);
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 437;
				this.match(FlowParser.SEMI);
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				// tslint:disable-next-line:no-empty
				{
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public firstStmtSeparator(): FirstStmtSeparatorContext {
		let _localctx: FirstStmtSeparatorContext = new FirstStmtSeparatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 52, FlowParser.RULE_firstStmtSeparator);
		try {
			this.state = 447;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 24, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 441;
				this.match(FlowParser.SEMI);
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 442;
				this.match(FlowParser.NEWLINE);
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 443;
				this.spaceList();
				this.state = 444;
				this.match(FlowParser.NEWLINE);
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				// tslint:disable-next-line:no-empty
				{
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public spaceList(): SpaceListContext {
		let _localctx: SpaceListContext = new SpaceListContext(this._ctx, this.state);
		this.enterRule(_localctx, 54, FlowParser.RULE_spaceList);
		try {
			this.state = 452;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 25, this._ctx) ) {
			case 1:
				_localctx = new MultipleSpacesContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 449;
				this.match(FlowParser.SPACE);
				this.state = 450;
				this.spaceList();
				}
				break;

			case 2:
				_localctx = new SingleSpaceContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 451;
				this.match(FlowParser.SPACE);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public textNoTags(): TextNoTagsContext {
		let _localctx: TextNoTagsContext = new TextNoTagsContext(this._ctx, this.state);
		this.enterRule(_localctx, 56, FlowParser.RULE_textNoTags);
		try {
			this.state = 456;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.TEXT:
				_localctx = new PlainTextNoTagsContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 454;
				this.match(FlowParser.TEXT);
				}
				break;
			case FlowParser.NODE_STRING:
				_localctx = new NodeStringTextNoTagsContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 455;
				this.match(FlowParser.NODE_STRING);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public shapeData(): ShapeDataContext;
	public shapeData(_p: number): ShapeDataContext;
	// @RuleVersion(0)
	public shapeData(_p?: number): ShapeDataContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: ShapeDataContext = new ShapeDataContext(this._ctx, _parentState);
		let _prevctx: ShapeDataContext = _localctx;
		let _startState: number = 58;
		this.enterRecursionRule(_localctx, 58, FlowParser.RULE_shapeData, _p);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			{
			_localctx = new SingleShapeDataContext(_localctx);
			this._ctx = _localctx;
			_prevctx = _localctx;

			this.state = 459;
			this.match(FlowParser.SHAPE_DATA);
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 465;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 27, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					if (this._parseListeners != null) {
						this.triggerExitRuleEvent();
					}
					_prevctx = _localctx;
					{
					{
					_localctx = new MultipleShapeDataContext(new ShapeDataContext(_parentctx, _parentState));
					this.pushNewRecursionContext(_localctx, _startState, FlowParser.RULE_shapeData);
					this.state = 461;
					if (!(this.precpred(this._ctx, 2))) {
						throw this.createFailedPredicateException("this.precpred(this._ctx, 2)");
					}
					this.state = 462;
					this.match(FlowParser.SHAPE_DATA);
					}
					}
				}
				this.state = 467;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 27, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public styleDefinition(): StyleDefinitionContext {
		let _localctx: StyleDefinitionContext = new StyleDefinitionContext(this._ctx, this.state);
		this.enterRule(_localctx, 60, FlowParser.RULE_styleDefinition);
		try {
			_localctx = new PlainStyleDefinitionContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 468;
			this.match(FlowParser.TEXT);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public callbackName(): CallbackNameContext {
		let _localctx: CallbackNameContext = new CallbackNameContext(this._ctx, this.state);
		this.enterRule(_localctx, 62, FlowParser.RULE_callbackName);
		try {
			this.state = 472;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case FlowParser.TEXT:
				_localctx = new PlainCallbackNameContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 470;
				this.match(FlowParser.TEXT);
				}
				break;
			case FlowParser.NODE_STRING:
				_localctx = new NodeStringCallbackNameContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 471;
				this.match(FlowParser.NODE_STRING);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public callbackArgs(): CallbackArgsContext {
		let _localctx: CallbackArgsContext = new CallbackArgsContext(this._ctx, this.state);
		this.enterRule(_localctx, 64, FlowParser.RULE_callbackArgs);
		try {
			this.state = 479;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 29, this._ctx) ) {
			case 1:
				_localctx = new PlainCallbackArgsContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 474;
				this.match(FlowParser.PS);
				this.state = 475;
				this.match(FlowParser.TEXT);
				this.state = 476;
				this.match(FlowParser.PE);
				}
				break;

			case 2:
				_localctx = new EmptyCallbackArgsContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 477;
				this.match(FlowParser.PS);
				this.state = 478;
				this.match(FlowParser.PE);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public sempred(_localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
		switch (ruleIndex) {
		case 1:
			return this.document_sempred(_localctx as DocumentContext, predIndex);

		case 6:
			return this.vertexStatement_sempred(_localctx as VertexStatementContext, predIndex);

		case 7:
			return this.node_sempred(_localctx as NodeContext, predIndex);

		case 12:
			return this.text_sempred(_localctx as TextContext, predIndex);

		case 15:
			return this.edgeText_sempred(_localctx as EdgeTextContext, predIndex);

		case 29:
			return this.shapeData_sempred(_localctx as ShapeDataContext, predIndex);
		}
		return true;
	}
	private document_sempred(_localctx: DocumentContext, predIndex: number): boolean {
		switch (predIndex) {
		case 0:
			return this.precpred(this._ctx, 1);
		}
		return true;
	}
	private vertexStatement_sempred(_localctx: VertexStatementContext, predIndex: number): boolean {
		switch (predIndex) {
		case 1:
			return this.precpred(this._ctx, 6);

		case 2:
			return this.precpred(this._ctx, 5);

		case 3:
			return this.precpred(this._ctx, 4);
		}
		return true;
	}
	private node_sempred(_localctx: NodeContext, predIndex: number): boolean {
		switch (predIndex) {
		case 4:
			return this.precpred(this._ctx, 2);

		case 5:
			return this.precpred(this._ctx, 1);
		}
		return true;
	}
	private text_sempred(_localctx: TextContext, predIndex: number): boolean {
		switch (predIndex) {
		case 6:
			return this.precpred(this._ctx, 1);
		}
		return true;
	}
	private edgeText_sempred(_localctx: EdgeTextContext, predIndex: number): boolean {
		switch (predIndex) {
		case 7:
			return this.precpred(this._ctx, 3);
		}
		return true;
	}
	private shapeData_sempred(_localctx: ShapeDataContext, predIndex: number): boolean {
		switch (predIndex) {
		case 8:
			return this.precpred(this._ctx, 2);
		}
		return true;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03J\u01E4\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
		"\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t\x1C\x04" +
		"\x1D\t\x1D\x04\x1E\t\x1E\x04\x1F\t\x1F\x04 \t \x04!\t!\x04\"\t\"\x03\x02" +
		"\x03\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03\x03\x07\x03L\n\x03\f\x03" +
		"\x0E\x03O\v\x03\x03\x04\x03\x04\x03\x04\x03\x04\x05\x04U\n\x04\x03\x05" +
		"\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05" +
		"\x03\x05\x03\x05\x03\x05\x03\x05\x05\x05e\n\x05\x03\x06\x03\x06\x03\x06" +
		"\x03\x06\x03\x06\x03\x06\x05\x06m\n\x06\x03\x07\x03\x07\x03\x07\x03\x07" +
		"\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07" +
		"\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07" +
		"\x03\x07\x05\x07\x86\n\x07\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03" +
		"\b\x05\b\x90\n\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b" +
		"\x03\b\x03\b\x03\b\x03\b\x03\b\x07\b\xA0\n\b\f\b\x0E\b\xA3\v\b\x03\t\x03" +
		"\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03" +
		"\t\x03\t\x03\t\x07\t\xB5\n\t\f\t\x0E\t\xB8\v\t\x03\n\x03\n\x03\n\x03\n" +
		"\x03\n\x05\n\xBF\n\n\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03" +
		"\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03" +
		"\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03" +
		"\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03" +
		"\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03" +
		"\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03" +
		"\v\x03\v\x05\v\u0107\n\v\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03\f\x03" +
		"\f\x05\f\u0111\n\f\x03\r\x03\r\x03\r\x03\r\x03\r\x03\r\x03\r\x05\r\u011A" +
		"\n\r\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x07\x0E\u0121\n\x0E\f\x0E" +
		"\x0E\x0E\u0124\v\x0E\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x05\x0F\u012A\n\x0F" +
		"\x03\x10\x03\x10\x05\x10\u012E\n\x10\x03\x11\x03\x11\x03\x11\x03\x11\x05" +
		"\x11\u0134\n\x11\x03\x11\x03\x11\x07\x11\u0138\n\x11\f\x11\x0E\x11\u013B" +
		"\v\x11\x03\x12\x03\x12\x05\x12\u013F\n\x12\x03\x13\x03\x13\x03\x13\x03" +
		"\x13\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03" +
		"\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03" +
		"\x14\x03\x14\x03\x14\x03\x14\x03\x14\x05\x14\u015B\n\x14\x03\x15\x03\x15" +
		"\x03\x15\x03\x15\x03\x15\x03\x15\x05\x15\u0163\n\x15\x03\x16\x03\x16\x03" +
		"\x16\x03\x16\x03\x17\x03\x17\x03\x17\x03\x17\x03\x18\x03\x18\x03\x18\x03" +
		"\x18\x03\x19\x03\x19\x03\x19\x03\x19\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03" +
		"\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03" +
		"\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03" +
		"\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03" +
		"\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03" +
		"\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03" +
		"\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03" +
		"\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x05\x1A\u01B5\n\x1A\x03\x1B" +
		"\x03\x1B\x03\x1B\x05\x1B\u01BA\n\x1B\x03\x1C\x03\x1C\x03\x1C\x03\x1C\x03" +
		"\x1C\x03\x1C\x05\x1C\u01C2\n\x1C\x03\x1D\x03\x1D\x03\x1D\x05\x1D\u01C7" +
		"\n\x1D\x03\x1E\x03\x1E\x05\x1E\u01CB\n\x1E\x03\x1F\x03\x1F\x03\x1F\x03" +
		"\x1F\x03\x1F\x07\x1F\u01D2\n\x1F\f\x1F\x0E\x1F\u01D5\v\x1F\x03 \x03 \x03" +
		"!\x03!\x05!\u01DB\n!\x03\"\x03\"\x03\"\x03\"\x03\"\x05\"\u01E2\n\"\x03" +
		"\"\x02\x02\b\x04\x0E\x10\x1A <#\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f" +
		"\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02\x1A\x02\x1C\x02\x1E" +
		"\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02.\x020\x022\x024\x026\x028\x02" +
		":\x02<\x02>\x02@\x02B\x02\x02\x02\x02\u0215\x02D\x03\x02\x02\x02\x04H" +
		"\x03\x02\x02\x02\x06T\x03\x02\x02\x02\bd\x03\x02\x02\x02\nl\x03\x02\x02" +
		"\x02\f\x85\x03\x02\x02\x02\x0E\x8F\x03\x02\x02\x02\x10\xA4\x03\x02\x02" +
		"\x02\x12\xBE\x03\x02\x02\x02\x14\u0106\x03\x02\x02\x02\x16\u0110\x03\x02" +
		"\x02\x02\x18\u0119\x03\x02\x02\x02\x1A\u011B\x03\x02\x02\x02\x1C\u0129" +
		"\x03\x02\x02\x02\x1E\u012D\x03\x02\x02\x02 \u0133\x03\x02\x02\x02\"\u013E" +
		"\x03\x02\x02\x02$\u0140\x03\x02\x02\x02&\u015A\x03\x02\x02\x02(\u0162" +
		"\x03\x02\x02\x02*\u0164\x03\x02\x02\x02,\u0168\x03\x02\x02\x02.\u016C" +
		"\x03\x02\x02\x020\u0170\x03\x02\x02\x022\u01B4\x03\x02\x02\x024\u01B9" +
		"\x03\x02\x02\x026\u01C1\x03\x02\x02\x028\u01C6\x03\x02\x02\x02:\u01CA" +
		"\x03\x02\x02\x02<\u01CC\x03\x02\x02\x02>\u01D6\x03\x02\x02\x02@\u01DA" +
		"\x03\x02\x02\x02B\u01E1\x03\x02\x02\x02DE\x05\b\x05\x02EF\x05\x04\x03" +
		"\x02FG\x07\x02\x02\x03G\x03\x03\x02\x02\x02HM\b\x03\x01\x02IJ\f\x03\x02" +
		"\x02JL\x05\x06\x04\x02KI\x03\x02\x02\x02LO\x03\x02\x02\x02MK\x03\x02\x02" +
		"\x02MN\x03\x02\x02\x02N\x05\x03\x02\x02\x02OM\x03\x02\x02\x02PU\x05\f" +
		"\x07\x02QU\x07<\x02\x02RU\x07:\x02\x02SU\x07;\x02\x02TP\x03\x02\x02\x02" +
		"TQ\x03\x02\x02\x02TR\x03\x02\x02\x02TS\x03\x02\x02\x02U\x07\x03\x02\x02" +
		"\x02VW\x07;\x02\x02We\x05\b\x05\x02XY\x07:\x02\x02Ye\x05\b\x05\x02Z[\x07" +
		"\x03\x02\x02[e\x07\x06\x02\x02\\]\x07\x03\x02\x02]^\x07;\x02\x02^_\x05" +
		"\n\x06\x02_`\x056\x1C\x02`e\x03\x02\x02\x02ab\x07\x03\x02\x02bc\x07;\x02" +
		"\x02ce\x05\n\x06\x02dV\x03\x02\x02\x02dX\x03\x02\x02\x02dZ\x03\x02\x02" +
		"\x02d\\\x03\x02\x02\x02da\x03\x02\x02\x02e\t\x03\x02\x02\x02fm\x07A\x02" +
		"\x02gm\x07B\x02\x02hm\x07C\x02\x02im\x07D\x02\x02jm\x07E\x02\x02km\x07" +
		"F\x02\x02lf\x03\x02\x02\x02lg\x03\x02\x02\x02lh\x03\x02\x02\x02li\x03" +
		"\x02\x02\x02lj\x03\x02\x02\x02lk\x03\x02\x02\x02m\v\x03\x02\x02\x02no" +
		"\x05\x0E\b\x02op\x054\x1B\x02p\x86\x03\x02\x02\x02qr\x05*\x16\x02rs\x05" +
		"4\x1B\x02s\x86\x03\x02\x02\x02tu\x05,\x17\x02uv\x054\x1B\x02v\x86\x03" +
		"\x02\x02\x02wx\x05.\x18\x02xy\x054\x1B\x02y\x86\x03\x02\x02\x02z{\x05" +
		"0\x19\x02{|\x054\x1B\x02|\x86\x03\x02\x02\x02}~\x052\x1A\x02~\x7F\x05" +
		"4\x1B\x02\x7F\x86\x03\x02\x02\x02\x80\x81\x05&\x14\x02\x81\x82\x054\x1B" +
		"\x02\x82\x86\x03\x02\x02\x02\x83\x86\x05\n\x06\x02\x84\x86\x05(\x15\x02" +
		"\x85n\x03\x02\x02\x02\x85q\x03\x02\x02\x02\x85t\x03\x02\x02\x02\x85w\x03" +
		"\x02\x02\x02\x85z\x03\x02\x02\x02\x85}\x03\x02\x02\x02\x85\x80\x03\x02" +
		"\x02\x02\x85\x83\x03\x02\x02\x02\x85\x84\x03\x02\x02\x02\x86\r\x03\x02" +
		"\x02\x02\x87\x88\b\b\x01\x02\x88\x89\x05\x10\t\x02\x89\x8A\x058\x1D\x02" +
		"\x8A\x90\x03\x02\x02\x02\x8B\x8C\x05\x10\t\x02\x8C\x8D\x05<\x1F\x02\x8D" +
		"\x90\x03\x02\x02\x02\x8E\x90\x05\x10\t\x02\x8F\x87\x03\x02\x02\x02\x8F" +
		"\x8B\x03\x02\x02\x02\x8F\x8E\x03\x02\x02\x02\x90\xA1\x03\x02\x02\x02\x91" +
		"\x92\f\b\x02\x02\x92\x93\x05\x16\f\x02\x93\x94\x05\x10\t\x02\x94\x95\x05" +
		"<\x1F\x02\x95\xA0\x03\x02\x02\x02\x96\x97\f\x07\x02\x02\x97\x98\x05\x16" +
		"\f\x02\x98\x99\x05\x10\t\x02\x99\xA0\x03\x02\x02\x02\x9A\x9B\f\x06\x02" +
		"\x02\x9B\x9C\x05\x16\f\x02\x9C\x9D\x05\x10\t\x02\x9D\x9E\x058\x1D\x02" +
		"\x9E\xA0\x03\x02\x02\x02\x9F\x91\x03\x02\x02\x02\x9F\x96\x03\x02\x02\x02" +
		"\x9F\x9A\x03\x02\x02\x02\xA0\xA3\x03\x02\x02\x02\xA1\x9F\x03\x02\x02\x02" +
		"\xA1\xA2\x03\x02\x02\x02\xA2\x0F\x03\x02\x02\x02\xA3\xA1\x03\x02\x02\x02" +
		"\xA4\xA5\b\t\x01\x02\xA5\xA6\x05\x12\n\x02\xA6\xB6\x03\x02\x02\x02\xA7" +
		"\xA8\f\x04\x02\x02\xA8\xA9\x05<\x1F\x02\xA9\xAA\x058\x1D\x02\xAA\xAB\x07" +
		"\x13\x02\x02\xAB\xAC\x058\x1D\x02\xAC\xAD\x05\x12\n\x02\xAD\xB5\x03\x02" +
		"\x02\x02\xAE\xAF\f\x03\x02\x02\xAF\xB0\x058\x1D\x02\xB0\xB1\x07\x13\x02" +
		"\x02\xB1\xB2\x058\x1D\x02\xB2\xB3\x05\x12\n\x02\xB3\xB5\x03\x02\x02\x02" +
		"\xB4\xA7\x03\x02\x02\x02\xB4\xAE\x03\x02\x02\x02\xB5\xB8\x03\x02\x02\x02" +
		"\xB6\xB4\x03\x02\x02\x02\xB6\xB7\x03\x02\x02\x02\xB7\x11\x03\x02\x02\x02" +
		"\xB8\xB6\x03\x02\x02\x02\xB9\xBF\x05\x14\v\x02\xBA\xBB\x05\x14\v\x02\xBB" +
		"\xBC\x07\x14\x02\x02\xBC\xBD\x05\x1E\x10\x02\xBD\xBF\x03\x02\x02\x02\xBE" +
		"\xB9\x03\x02\x02\x02\xBE\xBA\x03\x02\x02\x02\xBF\x13\x03\x02\x02\x02\xC0" +
		"\xC1\x05\x1E\x10\x02\xC1\xC2\x076\x02\x02\xC2\xC3\x05\x1A\x0E\x02\xC3" +
		"\xC4\x077\x02\x02\xC4\u0107\x03\x02\x02\x02\xC5\xC6\x05\x1E\x10\x02\xC6" +
		"\xC7\x07&\x02\x02\xC7\xC8\x05\x1A\x0E\x02\xC8\xC9\x07\'\x02\x02\xC9\u0107" +
		"\x03\x02\x02\x02\xCA\xCB\x05\x1E\x10\x02\xCB\xCC\x074\x02\x02\xCC\xCD" +
		"\x074\x02\x02\xCD\xCE\x05\x1A\x0E\x02\xCE\xCF\x075\x02\x02\xCF\xD0\x07" +
		"5\x02\x02\xD0\u0107\x03\x02\x02\x02\xD1\xD2\x05\x1E\x10\x02\xD2\xD3\x07" +
		" \x02\x02\xD3\xD4\x05\x1A\x0E\x02\xD4\xD5\x07*\x02\x02\xD5\u0107\x03\x02" +
		"\x02\x02\xD6\xD7\x05\x1E\x10\x02\xD7\xD8\x07!\x02\x02\xD8\xD9\x05\x1A" +
		"\x0E\x02\xD9\xDA\x07+\x02\x02\xDA\u0107\x03\x02\x02\x02\xDB\xDC\x05\x1E" +
		"\x10\x02\xDC\xDD\x07\"\x02\x02\xDD\xDE\x05\x1A\x0E\x02\xDE\xDF\x07,\x02" +
		"\x02\xDF\u0107\x03\x02\x02\x02\xE0\xE1\x05\x1E\x10\x02\xE1\xE2\x07%\x02" +
		"\x02\xE2\xE3\x05\x1A\x0E\x02\xE3\xE4\x07H\x02\x02\xE4\u0107\x03\x02\x02" +
		"\x02\xE5\xE6\x05\x1E\x10\x02\xE6\xE7\x074\x02\x02\xE7\xE8\x05\x1A\x0E" +
		"\x02\xE8\xE9\x075\x02\x02\xE9\u0107\x03\x02\x02\x02\xEA\xEB\x05\x1E\x10" +
		"\x02\xEB\xEC\x078\x02\x02\xEC\xED\x05\x1A\x0E\x02\xED\xEE\x079\x02\x02" +
		"\xEE\u0107\x03\x02\x02\x02\xEF\xF0\x05\x1E\x10\x02\xF0\xF1\x078\x02\x02" +
		"\xF1\xF2\x078\x02\x02\xF2\xF3\x05\x1A\x0E\x02\xF3\xF4\x079\x02\x02\xF4" +
		"\xF5\x079\x02\x02\xF5\u0107\x03\x02\x02\x02\xF6\xF7\x05\x1E\x10\x02\xF7" +
		"\xF8\x07I\x02\x02\xF8\xF9\x05\x1A\x0E\x02\xF9\xFA\x077\x02\x02\xFA\u0107" +
		"\x03\x02\x02\x02\xFB\xFC\x05\x1E\x10\x02\xFC\xFD\x07(\x02\x02\xFD\xFE" +
		"\x05\x1A\x0E\x02\xFE\xFF\x07-\x02\x02\xFF\u0107\x03\x02\x02\x02\u0100" +
		"\u0101\x05\x1E\x10\x02\u0101\u0102\x07)\x02\x02\u0102\u0103\x05\x1A\x0E" +
		"\x02\u0103\u0104\x07.\x02\x02\u0104\u0107\x03\x02\x02\x02\u0105\u0107" +
		"\x05\x1E\x10\x02\u0106\xC0\x03\x02\x02\x02\u0106\xC5\x03\x02\x02\x02\u0106" +
		"\xCA\x03\x02\x02\x02\u0106\xD1\x03\x02\x02\x02\u0106\xD6\x03\x02\x02\x02" +
		"\u0106\xDB\x03\x02\x02\x02\u0106\xE0\x03\x02\x02\x02\u0106\xE5\x03\x02" +
		"\x02\x02\u0106\xEA\x03\x02\x02\x02\u0106\xEF\x03\x02\x02\x02\u0106\xF6" +
		"\x03\x02\x02\x02\u0106\xFB\x03\x02\x02\x02\u0106\u0100\x03\x02\x02\x02" +
		"\u0106\u0105\x03\x02\x02\x02\u0107\x15\x03\x02\x02\x02\u0108\u0109\x05" +
		"\x18\r\x02\u0109\u010A\x05$\x13\x02\u010A\u0111\x03\x02\x02\x02\u010B" +
		"\u0111\x05\x18\r\x02\u010C\u010D\x07\x1A\x02\x02\u010D\u010E\x05 \x11" +
		"\x02\u010E\u010F\x07\x19\x02\x02\u010F\u0111\x03\x02\x02\x02\u0110\u0108" +
		"\x03\x02\x02\x02\u0110\u010B\x03\x02\x02\x02\u0110\u010C\x03\x02\x02\x02" +
		"\u0111\x17\x03\x02\x02\x02\u0112\u011A\x07\x15\x02\x02\u0113\u011A\x07" +
		"\x16\x02\x02\u0114\u011A\x07\x17\x02\x02\u0115\u011A\x07\x19\x02\x02\u0116" +
		"\u011A\x07\x1B\x02\x02\u0117\u011A\x07\x1D\x02\x02\u0118\u011A\x07\x1F" +
		"\x02\x02\u0119\u0112\x03\x02\x02\x02\u0119\u0113\x03\x02\x02\x02\u0119" +
		"\u0114\x03\x02\x02\x02\u0119\u0115\x03\x02\x02\x02\u0119\u0116\x03\x02" +
		"\x02\x02\u0119\u0117\x03\x02\x02\x02\u0119\u0118\x03\x02\x02\x02\u011A" +
		"\x19\x03\x02\x02\x02\u011B\u011C\b\x0E\x01\x02\u011C\u011D\x05\x1C\x0F" +
		"\x02\u011D\u0122\x03\x02\x02\x02\u011E\u011F\f\x03\x02\x02\u011F\u0121" +
		"\x05\x1C\x0F\x02\u0120\u011E\x03\x02\x02\x02\u0121\u0124\x03\x02\x02\x02" +
		"\u0122\u0120\x03\x02\x02\x02\u0122\u0123\x03\x02\x02\x02\u0123\x1B\x03" +
		"\x02\x02\x02\u0124\u0122\x03\x02\x02\x02\u0125\u012A\x07F\x02\x02\u0126" +
		"\u012A\x07?\x02\x02\u0127\u012A\x07@\x02\x02\u0128\u012A\x07G\x02\x02" +
		"\u0129\u0125\x03\x02\x02\x02\u0129\u0126\x03\x02\x02\x02\u0129\u0127\x03" +
		"\x02\x02\x02\u0129\u0128\x03\x02\x02\x02\u012A\x1D\x03\x02\x02\x02\u012B" +
		"\u012E\x07F\x02\x02\u012C\u012E\x07G\x02\x02\u012D\u012B\x03\x02\x02\x02" +
		"\u012D\u012C\x03\x02\x02\x02\u012E\x1F\x03\x02\x02\x02\u012F\u0130\b\x11" +
		"\x01\x02\u0130\u0134\x05\"\x12\x02\u0131\u0134\x07?\x02\x02\u0132\u0134" +
		"\x07@\x02\x02\u0133\u012F\x03\x02\x02\x02\u0133\u0131\x03\x02\x02\x02" +
		"\u0133\u0132\x03\x02\x02\x02\u0134\u0139\x03\x02\x02\x02\u0135\u0136\f" +
		"\x05\x02\x02\u0136\u0138\x05\"\x12\x02\u0137\u0135\x03\x02\x02\x02\u0138" +
		"\u013B\x03\x02\x02\x02\u0139\u0137\x03\x02\x02\x02\u0139\u013A\x03\x02" +
		"\x02\x02\u013A!\x03\x02\x02\x02\u013B\u0139\x03\x02\x02\x02\u013C\u013F" +
		"\x07F\x02\x02\u013D\u013F\x07G\x02\x02\u013E\u013C\x03\x02\x02\x02\u013E" +
		"\u013D\x03\x02\x02\x02\u013F#\x03\x02\x02\x02\u0140\u0141\x07J\x02\x02" +
		"\u0141\u0142\x05\x1A\x0E\x02\u0142\u0143\x07J\x02\x02\u0143%\x03\x02\x02" +
		"\x02\u0144\u0145\x07\t\x02\x02\u0145\u0146\x07;\x02\x02\u0146\u0147\x05" +
		":\x1E\x02\u0147\u0148\x076\x02\x02\u0148\u0149\x05\x1A\x0E\x02\u0149\u014A" +
		"\x077\x02\x02\u014A\u014B\x054\x1B\x02\u014B\u014C\x05\x04\x03\x02\u014C" +
		"\u014D\x07\n\x02\x02\u014D\u015B\x03\x02\x02\x02\u014E\u014F\x07\t\x02" +
		"\x02\u014F\u0150\x07;\x02\x02\u0150\u0151\x05:\x1E\x02\u0151\u0152\x05" +
		"4\x1B\x02\u0152\u0153\x05\x04\x03\x02\u0153\u0154\x07\n\x02\x02\u0154" +
		"\u015B\x03\x02\x02\x02\u0155\u0156\x07\t\x02\x02\u0156\u0157\x054\x1B" +
		"\x02\u0157\u0158\x05\x04\x03\x02\u0158\u0159\x07\n\x02\x02\u0159\u015B" +
		"\x03\x02\x02\x02\u015A\u0144\x03\x02\x02\x02\u015A\u014E\x03\x02\x02\x02" +
		"\u015A\u0155\x03\x02\x02\x02\u015B\'\x03\x02\x02\x02\u015C\u015D\x07\x10" +
		"\x02\x02\u015D\u015E\x07=\x02\x02\u015E\u0163\x05\x1A\x0E\x02\u015F\u0160" +
		"\x07\x11\x02\x02\u0160\u0161\x07=\x02\x02\u0161\u0163\x05\x1A\x0E\x02" +
		"\u0162\u015C\x03\x02\x02\x02\u0162\u015F\x03\x02\x02\x02\u0163)\x03\x02" +
		"\x02\x02\u0164\u0165\x07\v\x02\x02\u0165\u0166\x05\x1E\x10\x02\u0166\u0167" +
		"\x05> \x02\u0167+\x03\x02\x02\x02\u0168\u0169\x07\f\x02\x02\u0169\u016A" +
		"\x05\x1E\x10\x02\u016A\u016B\x05> \x02\u016B-\x03\x02\x02\x02\u016C\u016D" +
		"\x07\r\x02\x02\u016D\u016E\x05\x1E\x10\x02\u016E\u016F\x05> \x02\u016F" +
		"/\x03\x02\x02\x02\u0170\u0171\x07\x0E\x02\x02\u0171\u0172\x05\x1E\x10" +
		"\x02\u0172\u0173\x05\x1E\x10\x02\u01731\x03\x02\x02\x02\u0174\u0175\x07" +
		"\x0F\x02\x02\u0175\u0176\x05\x1E\x10\x02\u0176\u0177\x05@!\x02\u0177\u01B5" +
		"\x03\x02\x02\x02\u0178\u0179\x07\x0F\x02\x02\u0179\u017A\x05\x1E\x10\x02" +
		"\u017A\u017B\x05@!\x02\u017B\u017C\x07?\x02\x02\u017C\u01B5\x03\x02\x02" +
		"\x02\u017D\u017E\x07\x0F\x02\x02\u017E\u017F\x05\x1E\x10\x02\u017F\u0180" +
		"\x05@!\x02\u0180\u0181\x05B\"\x02\u0181\u01B5\x03\x02\x02\x02\u0182\u0183" +
		"\x07\x0F\x02\x02\u0183\u0184\x05\x1E\x10\x02\u0184\u0185\x05@!\x02\u0185" +
		"\u0186\x05B\"\x02\u0186\u0187\x07?\x02\x02\u0187\u01B5\x03\x02\x02\x02" +
		"\u0188\u0189\x07\x0F\x02\x02\u0189\u018A\x05\x1E\x10\x02\u018A\u018B\x07" +
		"\x07\x02\x02\u018B\u018C\x07?\x02\x02\u018C\u01B5\x03\x02\x02\x02\u018D" +
		"\u018E\x07\x0F\x02\x02\u018E\u018F\x05\x1E\x10\x02\u018F\u0190\x07\x07" +
		"\x02\x02\u0190\u0191\x07?\x02\x02\u0191\u0192\x07?\x02\x02\u0192\u01B5" +
		"\x03\x02\x02\x02\u0193\u0194\x07\x0F\x02\x02\u0194\u0195\x05\x1E\x10\x02" +
		"\u0195\u0196\x07\x07\x02\x02\u0196\u0197\x07?\x02\x02\u0197\u0198\x07" +
		">\x02\x02\u0198\u01B5\x03\x02\x02\x02\u0199\u019A\x07\x0F\x02\x02\u019A" +
		"\u019B\x05\x1E\x10\x02\u019B\u019C\x07\x07\x02\x02\u019C\u019D\x07?\x02" +
		"\x02\u019D\u019E\x07?\x02\x02\u019E\u019F\x07>\x02\x02\u019F\u01B5\x03" +
		"\x02\x02\x02\u01A0\u01A1\x07\x0F\x02\x02\u01A1\u01A2\x05\x1E\x10\x02\u01A2" +
		"\u01A3\x07?\x02\x02\u01A3\u01B5\x03\x02\x02\x02\u01A4\u01A5\x07\x0F\x02" +
		"\x02\u01A5\u01A6\x05\x1E\x10\x02\u01A6\u01A7\x07?\x02\x02\u01A7\u01A8" +
		"\x07?\x02\x02\u01A8\u01B5\x03\x02\x02\x02\u01A9\u01AA\x07\x0F\x02\x02" +
		"\u01AA\u01AB\x05\x1E\x10\x02\u01AB\u01AC\x07?\x02\x02\u01AC\u01AD\x07" +
		">\x02\x02\u01AD\u01B5\x03\x02\x02\x02\u01AE\u01AF\x07\x0F\x02\x02\u01AF" +
		"\u01B0\x05\x1E\x10\x02\u01B0\u01B1\x07?\x02\x02\u01B1\u01B2\x07?\x02\x02" +
		"\u01B2\u01B3\x07>\x02\x02\u01B3\u01B5\x03\x02\x02\x02\u01B4\u0174\x03" +
		"\x02\x02\x02\u01B4\u0178\x03\x02\x02\x02\u01B4\u017D\x03\x02\x02\x02\u01B4" +
		"\u0182\x03\x02\x02\x02\u01B4\u0188\x03\x02\x02\x02\u01B4\u018D\x03\x02" +
		"\x02\x02\u01B4\u0193\x03\x02\x02\x02\u01B4\u0199\x03\x02\x02\x02\u01B4" +
		"\u01A0\x03\x02\x02\x02\u01B4\u01A4\x03\x02\x02\x02\u01B4\u01A9\x03\x02" +
		"\x02\x02\u01B4\u01AE\x03\x02\x02\x02\u01B53\x03\x02\x02\x02\u01B6\u01BA" +
		"\x07:\x02\x02\u01B7\u01BA\x07<\x02\x02\u01B8\u01BA\x03\x02\x02\x02\u01B9" +
		"\u01B6\x03\x02\x02\x02\u01B9\u01B7\x03\x02\x02\x02\u01B9\u01B8\x03\x02" +
		"\x02\x02\u01BA5\x03\x02\x02\x02\u01BB\u01C2\x07<\x02\x02\u01BC\u01C2\x07" +
		":\x02\x02\u01BD\u01BE\x058\x1D\x02\u01BE\u01BF\x07:\x02\x02\u01BF\u01C2" +
		"\x03\x02\x02\x02\u01C0\u01C2\x03\x02\x02\x02\u01C1\u01BB\x03\x02\x02\x02" +
		"\u01C1\u01BC\x03\x02\x02\x02\u01C1\u01BD\x03\x02\x02\x02\u01C1\u01C0\x03" +
		"\x02\x02\x02\u01C27\x03\x02\x02\x02\u01C3\u01C4\x07;\x02\x02\u01C4\u01C7" +
		"\x058\x1D\x02\u01C5\u01C7\x07;\x02\x02\u01C6\u01C3\x03\x02\x02\x02\u01C6" +
		"\u01C5\x03\x02\x02\x02\u01C79\x03\x02\x02\x02\u01C8\u01CB\x07F\x02\x02" +
		"\u01C9\u01CB\x07G\x02\x02\u01CA\u01C8\x03\x02\x02\x02\u01CA\u01C9\x03" +
		"\x02\x02\x02\u01CB;\x03\x02\x02\x02\u01CC\u01CD\b\x1F\x01\x02\u01CD\u01CE" +
		"\x07\x12\x02\x02\u01CE\u01D3\x03\x02\x02\x02\u01CF\u01D0\f\x04\x02\x02" +
		"\u01D0\u01D2\x07\x12\x02\x02\u01D1\u01CF\x03\x02\x02\x02\u01D2\u01D5\x03" +
		"\x02\x02\x02\u01D3\u01D1\x03\x02\x02\x02\u01D3\u01D4\x03\x02\x02\x02\u01D4" +
		"=\x03\x02\x02\x02\u01D5\u01D3\x03\x02\x02\x02\u01D6\u01D7\x07F\x02\x02" +
		"\u01D7?\x03\x02\x02\x02\u01D8\u01DB\x07F\x02\x02\u01D9\u01DB\x07G\x02" +
		"\x02\u01DA\u01D8\x03\x02\x02\x02\u01DA\u01D9\x03\x02\x02\x02\u01DBA\x03" +
		"\x02\x02\x02\u01DC\u01DD\x074\x02\x02\u01DD\u01DE\x07F\x02\x02\u01DE\u01E2" +
		"\x075\x02\x02\u01DF\u01E0\x074\x02\x02\u01E0\u01E2\x075\x02\x02\u01E1" +
		"\u01DC\x03\x02\x02\x02\u01E1\u01DF\x03\x02\x02\x02\u01E2C\x03\x02\x02" +
		"\x02 MTdl\x85\x8F\x9F\xA1\xB4\xB6\xBE\u0106\u0110\u0119\u0122\u0129\u012D" +
		"\u0133\u0139\u013E\u015A\u0162\u01B4\u01B9\u01C1\u01C6\u01CA\u01D3\u01DA" +
		"\u01E1";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!FlowParser.__ATN) {
			FlowParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(FlowParser._serializedATN));
		}

		return FlowParser.__ATN;
	}

}

export class StartContext extends ParserRuleContext {
	public graphConfig(): GraphConfigContext {
		return this.getRuleContext(0, GraphConfigContext);
	}
	public document(): DocumentContext {
		return this.getRuleContext(0, DocumentContext);
	}
	public EOF(): TerminalNode { return this.getToken(FlowParser.EOF, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_start; }
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStart) {
			listener.enterStart(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStart) {
			listener.exitStart(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStart) {
			return visitor.visitStart(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class DocumentContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_document; }
	public copyFrom(ctx: DocumentContext): void {
		super.copyFrom(ctx);
	}
}
export class EmptyDocumentContext extends DocumentContext {
	constructor(ctx: DocumentContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterEmptyDocument) {
			listener.enterEmptyDocument(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitEmptyDocument) {
			listener.exitEmptyDocument(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitEmptyDocument) {
			return visitor.visitEmptyDocument(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DocumentWithLineContext extends DocumentContext {
	public document(): DocumentContext {
		return this.getRuleContext(0, DocumentContext);
	}
	public line(): LineContext {
		return this.getRuleContext(0, LineContext);
	}
	constructor(ctx: DocumentContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDocumentWithLine) {
			listener.enterDocumentWithLine(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDocumentWithLine) {
			listener.exitDocumentWithLine(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDocumentWithLine) {
			return visitor.visitDocumentWithLine(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LineContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_line; }
	public copyFrom(ctx: LineContext): void {
		super.copyFrom(ctx);
	}
}
export class StatementLineContext extends LineContext {
	public statement(): StatementContext {
		return this.getRuleContext(0, StatementContext);
	}
	constructor(ctx: LineContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStatementLine) {
			listener.enterStatementLine(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStatementLine) {
			listener.exitStatementLine(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStatementLine) {
			return visitor.visitStatementLine(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SemicolonLineContext extends LineContext {
	public SEMI(): TerminalNode { return this.getToken(FlowParser.SEMI, 0); }
	constructor(ctx: LineContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSemicolonLine) {
			listener.enterSemicolonLine(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSemicolonLine) {
			listener.exitSemicolonLine(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSemicolonLine) {
			return visitor.visitSemicolonLine(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NewlineLineContext extends LineContext {
	public NEWLINE(): TerminalNode { return this.getToken(FlowParser.NEWLINE, 0); }
	constructor(ctx: LineContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNewlineLine) {
			listener.enterNewlineLine(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNewlineLine) {
			listener.exitNewlineLine(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNewlineLine) {
			return visitor.visitNewlineLine(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SpaceLineContext extends LineContext {
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	constructor(ctx: LineContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSpaceLine) {
			listener.enterSpaceLine(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSpaceLine) {
			listener.exitSpaceLine(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSpaceLine) {
			return visitor.visitSpaceLine(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class GraphConfigContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_graphConfig; }
	public copyFrom(ctx: GraphConfigContext): void {
		super.copyFrom(ctx);
	}
}
export class SpaceGraphConfigContext extends GraphConfigContext {
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	public graphConfig(): GraphConfigContext {
		return this.getRuleContext(0, GraphConfigContext);
	}
	constructor(ctx: GraphConfigContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSpaceGraphConfig) {
			listener.enterSpaceGraphConfig(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSpaceGraphConfig) {
			listener.exitSpaceGraphConfig(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSpaceGraphConfig) {
			return visitor.visitSpaceGraphConfig(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NewlineGraphConfigContext extends GraphConfigContext {
	public NEWLINE(): TerminalNode { return this.getToken(FlowParser.NEWLINE, 0); }
	public graphConfig(): GraphConfigContext {
		return this.getRuleContext(0, GraphConfigContext);
	}
	constructor(ctx: GraphConfigContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNewlineGraphConfig) {
			listener.enterNewlineGraphConfig(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNewlineGraphConfig) {
			listener.exitNewlineGraphConfig(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNewlineGraphConfig) {
			return visitor.visitNewlineGraphConfig(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class GraphNoDirectionContext extends GraphConfigContext {
	public GRAPH_GRAPH(): TerminalNode { return this.getToken(FlowParser.GRAPH_GRAPH, 0); }
	public NODIR(): TerminalNode { return this.getToken(FlowParser.NODIR, 0); }
	constructor(ctx: GraphConfigContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterGraphNoDirection) {
			listener.enterGraphNoDirection(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitGraphNoDirection) {
			listener.exitGraphNoDirection(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitGraphNoDirection) {
			return visitor.visitGraphNoDirection(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class GraphWithDirectionContext extends GraphConfigContext {
	public GRAPH_GRAPH(): TerminalNode { return this.getToken(FlowParser.GRAPH_GRAPH, 0); }
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	public direction(): DirectionContext {
		return this.getRuleContext(0, DirectionContext);
	}
	public firstStmtSeparator(): FirstStmtSeparatorContext {
		return this.getRuleContext(0, FirstStmtSeparatorContext);
	}
	constructor(ctx: GraphConfigContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterGraphWithDirection) {
			listener.enterGraphWithDirection(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitGraphWithDirection) {
			listener.exitGraphWithDirection(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitGraphWithDirection) {
			return visitor.visitGraphWithDirection(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class GraphWithDirectionNoSeparatorContext extends GraphConfigContext {
	public GRAPH_GRAPH(): TerminalNode { return this.getToken(FlowParser.GRAPH_GRAPH, 0); }
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	public direction(): DirectionContext {
		return this.getRuleContext(0, DirectionContext);
	}
	constructor(ctx: GraphConfigContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterGraphWithDirectionNoSeparator) {
			listener.enterGraphWithDirectionNoSeparator(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitGraphWithDirectionNoSeparator) {
			listener.exitGraphWithDirectionNoSeparator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitGraphWithDirectionNoSeparator) {
			return visitor.visitGraphWithDirectionNoSeparator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class DirectionContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_direction; }
	public copyFrom(ctx: DirectionContext): void {
		super.copyFrom(ctx);
	}
}
export class DirectionTDContext extends DirectionContext {
	public DIRECTION_TD(): TerminalNode { return this.getToken(FlowParser.DIRECTION_TD, 0); }
	constructor(ctx: DirectionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDirectionTD) {
			listener.enterDirectionTD(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDirectionTD) {
			listener.exitDirectionTD(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDirectionTD) {
			return visitor.visitDirectionTD(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DirectionLRContext extends DirectionContext {
	public DIRECTION_LR(): TerminalNode { return this.getToken(FlowParser.DIRECTION_LR, 0); }
	constructor(ctx: DirectionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDirectionLR) {
			listener.enterDirectionLR(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDirectionLR) {
			listener.exitDirectionLR(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDirectionLR) {
			return visitor.visitDirectionLR(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DirectionRLContext extends DirectionContext {
	public DIRECTION_RL(): TerminalNode { return this.getToken(FlowParser.DIRECTION_RL, 0); }
	constructor(ctx: DirectionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDirectionRL) {
			listener.enterDirectionRL(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDirectionRL) {
			listener.exitDirectionRL(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDirectionRL) {
			return visitor.visitDirectionRL(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DirectionBTContext extends DirectionContext {
	public DIRECTION_BT(): TerminalNode { return this.getToken(FlowParser.DIRECTION_BT, 0); }
	constructor(ctx: DirectionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDirectionBT) {
			listener.enterDirectionBT(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDirectionBT) {
			listener.exitDirectionBT(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDirectionBT) {
			return visitor.visitDirectionBT(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DirectionTBContext extends DirectionContext {
	public DIRECTION_TB(): TerminalNode { return this.getToken(FlowParser.DIRECTION_TB, 0); }
	constructor(ctx: DirectionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDirectionTB) {
			listener.enterDirectionTB(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDirectionTB) {
			listener.exitDirectionTB(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDirectionTB) {
			return visitor.visitDirectionTB(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DirectionTextContext extends DirectionContext {
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	constructor(ctx: DirectionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDirectionText) {
			listener.enterDirectionText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDirectionText) {
			listener.exitDirectionText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDirectionText) {
			return visitor.visitDirectionText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_statement; }
	public copyFrom(ctx: StatementContext): void {
		super.copyFrom(ctx);
	}
}
export class VertexStmtContext extends StatementContext {
	public vertexStatement(): VertexStatementContext {
		return this.getRuleContext(0, VertexStatementContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterVertexStmt) {
			listener.enterVertexStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitVertexStmt) {
			listener.exitVertexStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitVertexStmt) {
			return visitor.visitVertexStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class StyleStmtContext extends StatementContext {
	public styleStatement(): StyleStatementContext {
		return this.getRuleContext(0, StyleStatementContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStyleStmt) {
			listener.enterStyleStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStyleStmt) {
			listener.exitStyleStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStyleStmt) {
			return visitor.visitStyleStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class LinkStyleStmtContext extends StatementContext {
	public linkStyleStatement(): LinkStyleStatementContext {
		return this.getRuleContext(0, LinkStyleStatementContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterLinkStyleStmt) {
			listener.enterLinkStyleStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitLinkStyleStmt) {
			listener.exitLinkStyleStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitLinkStyleStmt) {
			return visitor.visitLinkStyleStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClassDefStmtContext extends StatementContext {
	public classDefStatement(): ClassDefStatementContext {
		return this.getRuleContext(0, ClassDefStatementContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClassDefStmt) {
			listener.enterClassDefStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClassDefStmt) {
			listener.exitClassDefStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClassDefStmt) {
			return visitor.visitClassDefStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClassStmtContext extends StatementContext {
	public classStatement(): ClassStatementContext {
		return this.getRuleContext(0, ClassStatementContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClassStmt) {
			listener.enterClassStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClassStmt) {
			listener.exitClassStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClassStmt) {
			return visitor.visitClassStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickStmtContext extends StatementContext {
	public clickStatement(): ClickStatementContext {
		return this.getRuleContext(0, ClickStatementContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickStmt) {
			listener.enterClickStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickStmt) {
			listener.exitClickStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickStmt) {
			return visitor.visitClickStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SubgraphStmtContext extends StatementContext {
	public subgraphStatement(): SubgraphStatementContext {
		return this.getRuleContext(0, SubgraphStatementContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSubgraphStmt) {
			listener.enterSubgraphStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSubgraphStmt) {
			listener.exitSubgraphStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSubgraphStmt) {
			return visitor.visitSubgraphStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DirectionStmtContext extends StatementContext {
	public direction(): DirectionContext {
		return this.getRuleContext(0, DirectionContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDirectionStmt) {
			listener.enterDirectionStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDirectionStmt) {
			listener.exitDirectionStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDirectionStmt) {
			return visitor.visitDirectionStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class AccessibilityStmtContext extends StatementContext {
	public accessibilityStatement(): AccessibilityStatementContext {
		return this.getRuleContext(0, AccessibilityStatementContext);
	}
	constructor(ctx: StatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterAccessibilityStmt) {
			listener.enterAccessibilityStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitAccessibilityStmt) {
			listener.exitAccessibilityStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitAccessibilityStmt) {
			return visitor.visitAccessibilityStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class VertexStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_vertexStatement; }
	public copyFrom(ctx: VertexStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class VertexWithShapeDataContext extends VertexStatementContext {
	public vertexStatement(): VertexStatementContext {
		return this.getRuleContext(0, VertexStatementContext);
	}
	public link(): LinkContext {
		return this.getRuleContext(0, LinkContext);
	}
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	public shapeData(): ShapeDataContext {
		return this.getRuleContext(0, ShapeDataContext);
	}
	constructor(ctx: VertexStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterVertexWithShapeData) {
			listener.enterVertexWithShapeData(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitVertexWithShapeData) {
			listener.exitVertexWithShapeData(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitVertexWithShapeData) {
			return visitor.visitVertexWithShapeData(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class VertexWithLinkContext extends VertexStatementContext {
	public vertexStatement(): VertexStatementContext {
		return this.getRuleContext(0, VertexStatementContext);
	}
	public link(): LinkContext {
		return this.getRuleContext(0, LinkContext);
	}
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	constructor(ctx: VertexStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterVertexWithLink) {
			listener.enterVertexWithLink(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitVertexWithLink) {
			listener.exitVertexWithLink(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitVertexWithLink) {
			return visitor.visitVertexWithLink(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class VertexWithLinkAndSpaceContext extends VertexStatementContext {
	public vertexStatement(): VertexStatementContext {
		return this.getRuleContext(0, VertexStatementContext);
	}
	public link(): LinkContext {
		return this.getRuleContext(0, LinkContext);
	}
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	public spaceList(): SpaceListContext {
		return this.getRuleContext(0, SpaceListContext);
	}
	constructor(ctx: VertexStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterVertexWithLinkAndSpace) {
			listener.enterVertexWithLinkAndSpace(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitVertexWithLinkAndSpace) {
			listener.exitVertexWithLinkAndSpace(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitVertexWithLinkAndSpace) {
			return visitor.visitVertexWithLinkAndSpace(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeWithSpaceContext extends VertexStatementContext {
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	public spaceList(): SpaceListContext {
		return this.getRuleContext(0, SpaceListContext);
	}
	constructor(ctx: VertexStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeWithSpace) {
			listener.enterNodeWithSpace(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeWithSpace) {
			listener.exitNodeWithSpace(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeWithSpace) {
			return visitor.visitNodeWithSpace(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeWithShapeDataContext extends VertexStatementContext {
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	public shapeData(): ShapeDataContext {
		return this.getRuleContext(0, ShapeDataContext);
	}
	constructor(ctx: VertexStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeWithShapeData) {
			listener.enterNodeWithShapeData(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeWithShapeData) {
			listener.exitNodeWithShapeData(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeWithShapeData) {
			return visitor.visitNodeWithShapeData(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SingleNodeContext extends VertexStatementContext {
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	constructor(ctx: VertexStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSingleNode) {
			listener.enterSingleNode(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSingleNode) {
			listener.exitSingleNode(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSingleNode) {
			return visitor.visitSingleNode(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class NodeContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_node; }
	public copyFrom(ctx: NodeContext): void {
		super.copyFrom(ctx);
	}
}
export class SingleStyledVertexContext extends NodeContext {
	public styledVertex(): StyledVertexContext {
		return this.getRuleContext(0, StyledVertexContext);
	}
	constructor(ctx: NodeContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSingleStyledVertex) {
			listener.enterSingleStyledVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSingleStyledVertex) {
			listener.exitSingleStyledVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSingleStyledVertex) {
			return visitor.visitSingleStyledVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeWithShapeDataAndAmpContext extends NodeContext {
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	public shapeData(): ShapeDataContext {
		return this.getRuleContext(0, ShapeDataContext);
	}
	public spaceList(): SpaceListContext[];
	public spaceList(i: number): SpaceListContext;
	public spaceList(i?: number): SpaceListContext | SpaceListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(SpaceListContext);
		} else {
			return this.getRuleContext(i, SpaceListContext);
		}
	}
	public AMP(): TerminalNode { return this.getToken(FlowParser.AMP, 0); }
	public styledVertex(): StyledVertexContext {
		return this.getRuleContext(0, StyledVertexContext);
	}
	constructor(ctx: NodeContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeWithShapeDataAndAmp) {
			listener.enterNodeWithShapeDataAndAmp(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeWithShapeDataAndAmp) {
			listener.exitNodeWithShapeDataAndAmp(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeWithShapeDataAndAmp) {
			return visitor.visitNodeWithShapeDataAndAmp(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeWithAmpContext extends NodeContext {
	public node(): NodeContext {
		return this.getRuleContext(0, NodeContext);
	}
	public spaceList(): SpaceListContext[];
	public spaceList(i: number): SpaceListContext;
	public spaceList(i?: number): SpaceListContext | SpaceListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(SpaceListContext);
		} else {
			return this.getRuleContext(i, SpaceListContext);
		}
	}
	public AMP(): TerminalNode { return this.getToken(FlowParser.AMP, 0); }
	public styledVertex(): StyledVertexContext {
		return this.getRuleContext(0, StyledVertexContext);
	}
	constructor(ctx: NodeContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeWithAmp) {
			listener.enterNodeWithAmp(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeWithAmp) {
			listener.exitNodeWithAmp(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeWithAmp) {
			return visitor.visitNodeWithAmp(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StyledVertexContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_styledVertex; }
	public copyFrom(ctx: StyledVertexContext): void {
		super.copyFrom(ctx);
	}
}
export class PlainVertexContext extends StyledVertexContext {
	public vertex(): VertexContext {
		return this.getRuleContext(0, VertexContext);
	}
	constructor(ctx: StyledVertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainVertex) {
			listener.enterPlainVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainVertex) {
			listener.exitPlainVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainVertex) {
			return visitor.visitPlainVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class StyledVertexWithClassContext extends StyledVertexContext {
	public vertex(): VertexContext {
		return this.getRuleContext(0, VertexContext);
	}
	public STYLE_SEPARATOR(): TerminalNode { return this.getToken(FlowParser.STYLE_SEPARATOR, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	constructor(ctx: StyledVertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStyledVertexWithClass) {
			listener.enterStyledVertexWithClass(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStyledVertexWithClass) {
			listener.exitStyledVertexWithClass(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStyledVertexWithClass) {
			return visitor.visitStyledVertexWithClass(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class VertexContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_vertex; }
	public copyFrom(ctx: VertexContext): void {
		super.copyFrom(ctx);
	}
}
export class SquareVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public SQS(): TerminalNode { return this.getToken(FlowParser.SQS, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public SQE(): TerminalNode { return this.getToken(FlowParser.SQE, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSquareVertex) {
			listener.enterSquareVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSquareVertex) {
			listener.exitSquareVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSquareVertex) {
			return visitor.visitSquareVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DoubleCircleVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public DOUBLECIRCLESTART(): TerminalNode { return this.getToken(FlowParser.DOUBLECIRCLESTART, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public DOUBLECIRCLEEND(): TerminalNode { return this.getToken(FlowParser.DOUBLECIRCLEEND, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDoubleCircleVertex) {
			listener.enterDoubleCircleVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDoubleCircleVertex) {
			listener.exitDoubleCircleVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDoubleCircleVertex) {
			return visitor.visitDoubleCircleVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class CircleVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public PS(): TerminalNode[];
	public PS(i: number): TerminalNode;
	public PS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.PS);
		} else {
			return this.getToken(FlowParser.PS, i);
		}
	}
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public PE(): TerminalNode[];
	public PE(i: number): TerminalNode;
	public PE(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.PE);
		} else {
			return this.getToken(FlowParser.PE, i);
		}
	}
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterCircleVertex) {
			listener.enterCircleVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitCircleVertex) {
			listener.exitCircleVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitCircleVertex) {
			return visitor.visitCircleVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class EllipseVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public ELLIPSE_START(): TerminalNode { return this.getToken(FlowParser.ELLIPSE_START, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public ELLIPSE_END(): TerminalNode { return this.getToken(FlowParser.ELLIPSE_END, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterEllipseVertex) {
			listener.enterEllipseVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitEllipseVertex) {
			listener.exitEllipseVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitEllipseVertex) {
			return visitor.visitEllipseVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class StadiumVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public STADIUM_START(): TerminalNode { return this.getToken(FlowParser.STADIUM_START, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public STADIUM_END(): TerminalNode { return this.getToken(FlowParser.STADIUM_END, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStadiumVertex) {
			listener.enterStadiumVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStadiumVertex) {
			listener.exitStadiumVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStadiumVertex) {
			return visitor.visitStadiumVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SubroutineVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public SUBROUTINE_START(): TerminalNode { return this.getToken(FlowParser.SUBROUTINE_START, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public SUBROUTINE_END(): TerminalNode { return this.getToken(FlowParser.SUBROUTINE_END, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSubroutineVertex) {
			listener.enterSubroutineVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSubroutineVertex) {
			listener.exitSubroutineVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSubroutineVertex) {
			return visitor.visitSubroutineVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class CylinderVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public CYLINDER_START(): TerminalNode { return this.getToken(FlowParser.CYLINDER_START, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public CYLINDER_END(): TerminalNode { return this.getToken(FlowParser.CYLINDER_END, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterCylinderVertex) {
			listener.enterCylinderVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitCylinderVertex) {
			listener.exitCylinderVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitCylinderVertex) {
			return visitor.visitCylinderVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class RoundVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public PS(): TerminalNode { return this.getToken(FlowParser.PS, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public PE(): TerminalNode { return this.getToken(FlowParser.PE, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterRoundVertex) {
			listener.enterRoundVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitRoundVertex) {
			listener.exitRoundVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitRoundVertex) {
			return visitor.visitRoundVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DiamondVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public DIAMOND_START(): TerminalNode { return this.getToken(FlowParser.DIAMOND_START, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public DIAMOND_STOP(): TerminalNode { return this.getToken(FlowParser.DIAMOND_STOP, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDiamondVertex) {
			listener.enterDiamondVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDiamondVertex) {
			listener.exitDiamondVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDiamondVertex) {
			return visitor.visitDiamondVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class HexagonVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public DIAMOND_START(): TerminalNode[];
	public DIAMOND_START(i: number): TerminalNode;
	public DIAMOND_START(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.DIAMOND_START);
		} else {
			return this.getToken(FlowParser.DIAMOND_START, i);
		}
	}
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public DIAMOND_STOP(): TerminalNode[];
	public DIAMOND_STOP(i: number): TerminalNode;
	public DIAMOND_STOP(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.DIAMOND_STOP);
		} else {
			return this.getToken(FlowParser.DIAMOND_STOP, i);
		}
	}
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterHexagonVertex) {
			listener.enterHexagonVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitHexagonVertex) {
			listener.exitHexagonVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitHexagonVertex) {
			return visitor.visitHexagonVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class OddVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public TAGEND(): TerminalNode { return this.getToken(FlowParser.TAGEND, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public SQE(): TerminalNode { return this.getToken(FlowParser.SQE, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterOddVertex) {
			listener.enterOddVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitOddVertex) {
			listener.exitOddVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitOddVertex) {
			return visitor.visitOddVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class TrapezoidVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public TRAPEZOID_START(): TerminalNode { return this.getToken(FlowParser.TRAPEZOID_START, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public TRAPEZOID_END(): TerminalNode { return this.getToken(FlowParser.TRAPEZOID_END, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterTrapezoidVertex) {
			listener.enterTrapezoidVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitTrapezoidVertex) {
			listener.exitTrapezoidVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitTrapezoidVertex) {
			return visitor.visitTrapezoidVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class InvTrapezoidVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public INV_TRAPEZOID_START(): TerminalNode { return this.getToken(FlowParser.INV_TRAPEZOID_START, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public INV_TRAPEZOID_END(): TerminalNode { return this.getToken(FlowParser.INV_TRAPEZOID_END, 0); }
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterInvTrapezoidVertex) {
			listener.enterInvTrapezoidVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitInvTrapezoidVertex) {
			listener.exitInvTrapezoidVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitInvTrapezoidVertex) {
			return visitor.visitInvTrapezoidVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class PlainIdVertexContext extends VertexContext {
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	constructor(ctx: VertexContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainIdVertex) {
			listener.enterPlainIdVertex(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainIdVertex) {
			listener.exitPlainIdVertex(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainIdVertex) {
			return visitor.visitPlainIdVertex(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LinkContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_link; }
	public copyFrom(ctx: LinkContext): void {
		super.copyFrom(ctx);
	}
}
export class LinkWithArrowTextContext extends LinkContext {
	public linkStatement(): LinkStatementContext {
		return this.getRuleContext(0, LinkStatementContext);
	}
	public arrowText(): ArrowTextContext {
		return this.getRuleContext(0, ArrowTextContext);
	}
	constructor(ctx: LinkContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterLinkWithArrowText) {
			listener.enterLinkWithArrowText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitLinkWithArrowText) {
			listener.exitLinkWithArrowText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitLinkWithArrowText) {
			return visitor.visitLinkWithArrowText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class PlainLinkContext extends LinkContext {
	public linkStatement(): LinkStatementContext {
		return this.getRuleContext(0, LinkStatementContext);
	}
	constructor(ctx: LinkContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainLink) {
			listener.enterPlainLink(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainLink) {
			listener.exitPlainLink(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainLink) {
			return visitor.visitPlainLink(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class StartLinkWithTextContext extends LinkContext {
	public START_LINK_REGULAR(): TerminalNode { return this.getToken(FlowParser.START_LINK_REGULAR, 0); }
	public edgeText(): EdgeTextContext {
		return this.getRuleContext(0, EdgeTextContext);
	}
	public LINK_REGULAR(): TerminalNode { return this.getToken(FlowParser.LINK_REGULAR, 0); }
	constructor(ctx: LinkContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStartLinkWithText) {
			listener.enterStartLinkWithText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStartLinkWithText) {
			listener.exitStartLinkWithText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStartLinkWithText) {
			return visitor.visitStartLinkWithText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LinkStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_linkStatement; }
	public copyFrom(ctx: LinkStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class RegularArrowContext extends LinkStatementContext {
	public ARROW_REGULAR(): TerminalNode { return this.getToken(FlowParser.ARROW_REGULAR, 0); }
	constructor(ctx: LinkStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterRegularArrow) {
			listener.enterRegularArrow(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitRegularArrow) {
			listener.exitRegularArrow(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitRegularArrow) {
			return visitor.visitRegularArrow(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SimpleArrowContext extends LinkStatementContext {
	public ARROW_SIMPLE(): TerminalNode { return this.getToken(FlowParser.ARROW_SIMPLE, 0); }
	constructor(ctx: LinkStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSimpleArrow) {
			listener.enterSimpleArrow(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSimpleArrow) {
			listener.exitSimpleArrow(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSimpleArrow) {
			return visitor.visitSimpleArrow(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class BidirectionalArrowContext extends LinkStatementContext {
	public ARROW_BIDIRECTIONAL(): TerminalNode { return this.getToken(FlowParser.ARROW_BIDIRECTIONAL, 0); }
	constructor(ctx: LinkStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterBidirectionalArrow) {
			listener.enterBidirectionalArrow(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitBidirectionalArrow) {
			listener.exitBidirectionalArrow(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitBidirectionalArrow) {
			return visitor.visitBidirectionalArrow(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class RegularLinkContext extends LinkStatementContext {
	public LINK_REGULAR(): TerminalNode { return this.getToken(FlowParser.LINK_REGULAR, 0); }
	constructor(ctx: LinkStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterRegularLink) {
			listener.enterRegularLink(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitRegularLink) {
			listener.exitRegularLink(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitRegularLink) {
			return visitor.visitRegularLink(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ThickLinkContext extends LinkStatementContext {
	public LINK_THICK(): TerminalNode { return this.getToken(FlowParser.LINK_THICK, 0); }
	constructor(ctx: LinkStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterThickLink) {
			listener.enterThickLink(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitThickLink) {
			listener.exitThickLink(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitThickLink) {
			return visitor.visitThickLink(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class DottedLinkContext extends LinkStatementContext {
	public LINK_DOTTED(): TerminalNode { return this.getToken(FlowParser.LINK_DOTTED, 0); }
	constructor(ctx: LinkStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterDottedLink) {
			listener.enterDottedLink(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitDottedLink) {
			listener.exitDottedLink(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitDottedLink) {
			return visitor.visitDottedLink(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class InvisibleLinkContext extends LinkStatementContext {
	public LINK_INVISIBLE(): TerminalNode { return this.getToken(FlowParser.LINK_INVISIBLE, 0); }
	constructor(ctx: LinkStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterInvisibleLink) {
			listener.enterInvisibleLink(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitInvisibleLink) {
			listener.exitInvisibleLink(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitInvisibleLink) {
			return visitor.visitInvisibleLink(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TextContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_text; }
	public copyFrom(ctx: TextContext): void {
		super.copyFrom(ctx);
	}
}
export class SingleTextTokenContext extends TextContext {
	public textToken(): TextTokenContext {
		return this.getRuleContext(0, TextTokenContext);
	}
	constructor(ctx: TextContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSingleTextToken) {
			listener.enterSingleTextToken(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSingleTextToken) {
			listener.exitSingleTextToken(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSingleTextToken) {
			return visitor.visitSingleTextToken(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class MultipleTextTokensContext extends TextContext {
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public textToken(): TextTokenContext {
		return this.getRuleContext(0, TextTokenContext);
	}
	constructor(ctx: TextContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterMultipleTextTokens) {
			listener.enterMultipleTextTokens(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitMultipleTextTokens) {
			listener.exitMultipleTextTokens(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitMultipleTextTokens) {
			return visitor.visitMultipleTextTokens(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TextTokenContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_textToken; }
	public copyFrom(ctx: TextTokenContext): void {
		super.copyFrom(ctx);
	}
}
export class PlainTextContext extends TextTokenContext {
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	constructor(ctx: TextTokenContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainText) {
			listener.enterPlainText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainText) {
			listener.exitPlainText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainText) {
			return visitor.visitPlainText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class StringTextContext extends TextTokenContext {
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	constructor(ctx: TextTokenContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStringText) {
			listener.enterStringText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStringText) {
			listener.exitStringText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStringText) {
			return visitor.visitStringText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class MarkdownTextContext extends TextTokenContext {
	public MD_STR(): TerminalNode { return this.getToken(FlowParser.MD_STR, 0); }
	constructor(ctx: TextTokenContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterMarkdownText) {
			listener.enterMarkdownText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitMarkdownText) {
			listener.exitMarkdownText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitMarkdownText) {
			return visitor.visitMarkdownText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeStringTextContext extends TextTokenContext {
	public NODE_STRING(): TerminalNode { return this.getToken(FlowParser.NODE_STRING, 0); }
	constructor(ctx: TextTokenContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeStringText) {
			listener.enterNodeStringText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeStringText) {
			listener.exitNodeStringText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeStringText) {
			return visitor.visitNodeStringText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class IdStringContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_idString; }
	public copyFrom(ctx: IdStringContext): void {
		super.copyFrom(ctx);
	}
}
export class TextIdContext extends IdStringContext {
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	constructor(ctx: IdStringContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterTextId) {
			listener.enterTextId(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitTextId) {
			listener.exitTextId(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitTextId) {
			return visitor.visitTextId(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeStringIdContext extends IdStringContext {
	public NODE_STRING(): TerminalNode { return this.getToken(FlowParser.NODE_STRING, 0); }
	constructor(ctx: IdStringContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeStringId) {
			listener.enterNodeStringId(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeStringId) {
			listener.exitNodeStringId(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeStringId) {
			return visitor.visitNodeStringId(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class EdgeTextContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_edgeText; }
	public copyFrom(ctx: EdgeTextContext): void {
		super.copyFrom(ctx);
	}
}
export class SingleEdgeTextTokenContext extends EdgeTextContext {
	public edgeTextToken(): EdgeTextTokenContext {
		return this.getRuleContext(0, EdgeTextTokenContext);
	}
	constructor(ctx: EdgeTextContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSingleEdgeTextToken) {
			listener.enterSingleEdgeTextToken(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSingleEdgeTextToken) {
			listener.exitSingleEdgeTextToken(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSingleEdgeTextToken) {
			return visitor.visitSingleEdgeTextToken(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class MultipleEdgeTextTokensContext extends EdgeTextContext {
	public edgeText(): EdgeTextContext {
		return this.getRuleContext(0, EdgeTextContext);
	}
	public edgeTextToken(): EdgeTextTokenContext {
		return this.getRuleContext(0, EdgeTextTokenContext);
	}
	constructor(ctx: EdgeTextContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterMultipleEdgeTextTokens) {
			listener.enterMultipleEdgeTextTokens(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitMultipleEdgeTextTokens) {
			listener.exitMultipleEdgeTextTokens(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitMultipleEdgeTextTokens) {
			return visitor.visitMultipleEdgeTextTokens(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class StringEdgeTextContext extends EdgeTextContext {
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	constructor(ctx: EdgeTextContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStringEdgeText) {
			listener.enterStringEdgeText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStringEdgeText) {
			listener.exitStringEdgeText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStringEdgeText) {
			return visitor.visitStringEdgeText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class MarkdownEdgeTextContext extends EdgeTextContext {
	public MD_STR(): TerminalNode { return this.getToken(FlowParser.MD_STR, 0); }
	constructor(ctx: EdgeTextContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterMarkdownEdgeText) {
			listener.enterMarkdownEdgeText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitMarkdownEdgeText) {
			listener.exitMarkdownEdgeText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitMarkdownEdgeText) {
			return visitor.visitMarkdownEdgeText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class EdgeTextTokenContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_edgeTextToken; }
	public copyFrom(ctx: EdgeTextTokenContext): void {
		super.copyFrom(ctx);
	}
}
export class PlainEdgeTextContext extends EdgeTextTokenContext {
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	constructor(ctx: EdgeTextTokenContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainEdgeText) {
			listener.enterPlainEdgeText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainEdgeText) {
			listener.exitPlainEdgeText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainEdgeText) {
			return visitor.visitPlainEdgeText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeStringEdgeTextContext extends EdgeTextTokenContext {
	public NODE_STRING(): TerminalNode { return this.getToken(FlowParser.NODE_STRING, 0); }
	constructor(ctx: EdgeTextTokenContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeStringEdgeText) {
			listener.enterNodeStringEdgeText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeStringEdgeText) {
			listener.exitNodeStringEdgeText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeStringEdgeText) {
			return visitor.visitNodeStringEdgeText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ArrowTextContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_arrowText; }
	public copyFrom(ctx: ArrowTextContext): void {
		super.copyFrom(ctx);
	}
}
export class PipedArrowTextContext extends ArrowTextContext {
	public SEP(): TerminalNode[];
	public SEP(i: number): TerminalNode;
	public SEP(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.SEP);
		} else {
			return this.getToken(FlowParser.SEP, i);
		}
	}
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	constructor(ctx: ArrowTextContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPipedArrowText) {
			listener.enterPipedArrowText(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPipedArrowText) {
			listener.exitPipedArrowText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPipedArrowText) {
			return visitor.visitPipedArrowText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class SubgraphStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_subgraphStatement; }
	public copyFrom(ctx: SubgraphStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class SubgraphWithTitleContext extends SubgraphStatementContext {
	public SUBGRAPH(): TerminalNode { return this.getToken(FlowParser.SUBGRAPH, 0); }
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	public textNoTags(): TextNoTagsContext {
		return this.getRuleContext(0, TextNoTagsContext);
	}
	public SQS(): TerminalNode { return this.getToken(FlowParser.SQS, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	public SQE(): TerminalNode { return this.getToken(FlowParser.SQE, 0); }
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	public document(): DocumentContext {
		return this.getRuleContext(0, DocumentContext);
	}
	public END(): TerminalNode { return this.getToken(FlowParser.END, 0); }
	constructor(ctx: SubgraphStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSubgraphWithTitle) {
			listener.enterSubgraphWithTitle(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSubgraphWithTitle) {
			listener.exitSubgraphWithTitle(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSubgraphWithTitle) {
			return visitor.visitSubgraphWithTitle(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SubgraphWithTextNoTagsContext extends SubgraphStatementContext {
	public SUBGRAPH(): TerminalNode { return this.getToken(FlowParser.SUBGRAPH, 0); }
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	public textNoTags(): TextNoTagsContext {
		return this.getRuleContext(0, TextNoTagsContext);
	}
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	public document(): DocumentContext {
		return this.getRuleContext(0, DocumentContext);
	}
	public END(): TerminalNode { return this.getToken(FlowParser.END, 0); }
	constructor(ctx: SubgraphStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSubgraphWithTextNoTags) {
			listener.enterSubgraphWithTextNoTags(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSubgraphWithTextNoTags) {
			listener.exitSubgraphWithTextNoTags(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSubgraphWithTextNoTags) {
			return visitor.visitSubgraphWithTextNoTags(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class PlainSubgraphContext extends SubgraphStatementContext {
	public SUBGRAPH(): TerminalNode { return this.getToken(FlowParser.SUBGRAPH, 0); }
	public separator(): SeparatorContext {
		return this.getRuleContext(0, SeparatorContext);
	}
	public document(): DocumentContext {
		return this.getRuleContext(0, DocumentContext);
	}
	public END(): TerminalNode { return this.getToken(FlowParser.END, 0); }
	constructor(ctx: SubgraphStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainSubgraph) {
			listener.enterPlainSubgraph(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainSubgraph) {
			listener.exitPlainSubgraph(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainSubgraph) {
			return visitor.visitPlainSubgraph(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AccessibilityStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_accessibilityStatement; }
	public copyFrom(ctx: AccessibilityStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class AccTitleStmtContext extends AccessibilityStatementContext {
	public ACC_TITLE(): TerminalNode { return this.getToken(FlowParser.ACC_TITLE, 0); }
	public COLON(): TerminalNode { return this.getToken(FlowParser.COLON, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	constructor(ctx: AccessibilityStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterAccTitleStmt) {
			listener.enterAccTitleStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitAccTitleStmt) {
			listener.exitAccTitleStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitAccTitleStmt) {
			return visitor.visitAccTitleStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class AccDescrStmtContext extends AccessibilityStatementContext {
	public ACC_DESCR(): TerminalNode { return this.getToken(FlowParser.ACC_DESCR, 0); }
	public COLON(): TerminalNode { return this.getToken(FlowParser.COLON, 0); }
	public text(): TextContext {
		return this.getRuleContext(0, TextContext);
	}
	constructor(ctx: AccessibilityStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterAccDescrStmt) {
			listener.enterAccDescrStmt(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitAccDescrStmt) {
			listener.exitAccDescrStmt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitAccDescrStmt) {
			return visitor.visitAccDescrStmt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StyleStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_styleStatement; }
	public copyFrom(ctx: StyleStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class StyleRuleContext extends StyleStatementContext {
	public STYLE(): TerminalNode { return this.getToken(FlowParser.STYLE, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public styleDefinition(): StyleDefinitionContext {
		return this.getRuleContext(0, StyleDefinitionContext);
	}
	constructor(ctx: StyleStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterStyleRule) {
			listener.enterStyleRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitStyleRule) {
			listener.exitStyleRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitStyleRule) {
			return visitor.visitStyleRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LinkStyleStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_linkStyleStatement; }
	public copyFrom(ctx: LinkStyleStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class LinkStyleRuleContext extends LinkStyleStatementContext {
	public LINKSTYLE(): TerminalNode { return this.getToken(FlowParser.LINKSTYLE, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public styleDefinition(): StyleDefinitionContext {
		return this.getRuleContext(0, StyleDefinitionContext);
	}
	constructor(ctx: LinkStyleStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterLinkStyleRule) {
			listener.enterLinkStyleRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitLinkStyleRule) {
			listener.exitLinkStyleRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitLinkStyleRule) {
			return visitor.visitLinkStyleRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ClassDefStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_classDefStatement; }
	public copyFrom(ctx: ClassDefStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class ClassDefRuleContext extends ClassDefStatementContext {
	public CLASSDEF(): TerminalNode { return this.getToken(FlowParser.CLASSDEF, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public styleDefinition(): StyleDefinitionContext {
		return this.getRuleContext(0, StyleDefinitionContext);
	}
	constructor(ctx: ClassDefStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClassDefRule) {
			listener.enterClassDefRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClassDefRule) {
			listener.exitClassDefRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClassDefRule) {
			return visitor.visitClassDefRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ClassStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_classStatement; }
	public copyFrom(ctx: ClassStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class ClassRuleContext extends ClassStatementContext {
	public CLASS(): TerminalNode { return this.getToken(FlowParser.CLASS, 0); }
	public idString(): IdStringContext[];
	public idString(i: number): IdStringContext;
	public idString(i?: number): IdStringContext | IdStringContext[] {
		if (i === undefined) {
			return this.getRuleContexts(IdStringContext);
		} else {
			return this.getRuleContext(i, IdStringContext);
		}
	}
	constructor(ctx: ClassStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClassRule) {
			listener.enterClassRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClassRule) {
			listener.exitClassRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClassRule) {
			return visitor.visitClassRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ClickStatementContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_clickStatement; }
	public copyFrom(ctx: ClickStatementContext): void {
		super.copyFrom(ctx);
	}
}
export class ClickCallbackRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public callbackName(): CallbackNameContext {
		return this.getRuleContext(0, CallbackNameContext);
	}
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickCallbackRule) {
			listener.enterClickCallbackRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickCallbackRule) {
			listener.exitClickCallbackRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickCallbackRule) {
			return visitor.visitClickCallbackRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickCallbackTooltipRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public callbackName(): CallbackNameContext {
		return this.getRuleContext(0, CallbackNameContext);
	}
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickCallbackTooltipRule) {
			listener.enterClickCallbackTooltipRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickCallbackTooltipRule) {
			listener.exitClickCallbackTooltipRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickCallbackTooltipRule) {
			return visitor.visitClickCallbackTooltipRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickCallbackArgsRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public callbackName(): CallbackNameContext {
		return this.getRuleContext(0, CallbackNameContext);
	}
	public callbackArgs(): CallbackArgsContext {
		return this.getRuleContext(0, CallbackArgsContext);
	}
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickCallbackArgsRule) {
			listener.enterClickCallbackArgsRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickCallbackArgsRule) {
			listener.exitClickCallbackArgsRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickCallbackArgsRule) {
			return visitor.visitClickCallbackArgsRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickCallbackArgsTooltipRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public callbackName(): CallbackNameContext {
		return this.getRuleContext(0, CallbackNameContext);
	}
	public callbackArgs(): CallbackArgsContext {
		return this.getRuleContext(0, CallbackArgsContext);
	}
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickCallbackArgsTooltipRule) {
			listener.enterClickCallbackArgsTooltipRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickCallbackArgsTooltipRule) {
			listener.exitClickCallbackArgsTooltipRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickCallbackArgsTooltipRule) {
			return visitor.visitClickCallbackArgsTooltipRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickHrefRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public HREF_KEYWORD(): TerminalNode { return this.getToken(FlowParser.HREF_KEYWORD, 0); }
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickHrefRule) {
			listener.enterClickHrefRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickHrefRule) {
			listener.exitClickHrefRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickHrefRule) {
			return visitor.visitClickHrefRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickHrefTooltipRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public HREF_KEYWORD(): TerminalNode { return this.getToken(FlowParser.HREF_KEYWORD, 0); }
	public STR(): TerminalNode[];
	public STR(i: number): TerminalNode;
	public STR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.STR);
		} else {
			return this.getToken(FlowParser.STR, i);
		}
	}
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickHrefTooltipRule) {
			listener.enterClickHrefTooltipRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickHrefTooltipRule) {
			listener.exitClickHrefTooltipRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickHrefTooltipRule) {
			return visitor.visitClickHrefTooltipRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickHrefTargetRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public HREF_KEYWORD(): TerminalNode { return this.getToken(FlowParser.HREF_KEYWORD, 0); }
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	public LINK_TARGET(): TerminalNode { return this.getToken(FlowParser.LINK_TARGET, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickHrefTargetRule) {
			listener.enterClickHrefTargetRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickHrefTargetRule) {
			listener.exitClickHrefTargetRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickHrefTargetRule) {
			return visitor.visitClickHrefTargetRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickHrefTooltipTargetRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public HREF_KEYWORD(): TerminalNode { return this.getToken(FlowParser.HREF_KEYWORD, 0); }
	public STR(): TerminalNode[];
	public STR(i: number): TerminalNode;
	public STR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.STR);
		} else {
			return this.getToken(FlowParser.STR, i);
		}
	}
	public LINK_TARGET(): TerminalNode { return this.getToken(FlowParser.LINK_TARGET, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickHrefTooltipTargetRule) {
			listener.enterClickHrefTooltipTargetRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickHrefTooltipTargetRule) {
			listener.exitClickHrefTooltipTargetRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickHrefTooltipTargetRule) {
			return visitor.visitClickHrefTooltipTargetRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickLinkRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickLinkRule) {
			listener.enterClickLinkRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickLinkRule) {
			listener.exitClickLinkRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickLinkRule) {
			return visitor.visitClickLinkRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickLinkTooltipRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public STR(): TerminalNode[];
	public STR(i: number): TerminalNode;
	public STR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.STR);
		} else {
			return this.getToken(FlowParser.STR, i);
		}
	}
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickLinkTooltipRule) {
			listener.enterClickLinkTooltipRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickLinkTooltipRule) {
			listener.exitClickLinkTooltipRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickLinkTooltipRule) {
			return visitor.visitClickLinkTooltipRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickLinkTargetRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public STR(): TerminalNode { return this.getToken(FlowParser.STR, 0); }
	public LINK_TARGET(): TerminalNode { return this.getToken(FlowParser.LINK_TARGET, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickLinkTargetRule) {
			listener.enterClickLinkTargetRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickLinkTargetRule) {
			listener.exitClickLinkTargetRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickLinkTargetRule) {
			return visitor.visitClickLinkTargetRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ClickLinkTooltipTargetRuleContext extends ClickStatementContext {
	public CLICK(): TerminalNode { return this.getToken(FlowParser.CLICK, 0); }
	public idString(): IdStringContext {
		return this.getRuleContext(0, IdStringContext);
	}
	public STR(): TerminalNode[];
	public STR(i: number): TerminalNode;
	public STR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FlowParser.STR);
		} else {
			return this.getToken(FlowParser.STR, i);
		}
	}
	public LINK_TARGET(): TerminalNode { return this.getToken(FlowParser.LINK_TARGET, 0); }
	constructor(ctx: ClickStatementContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterClickLinkTooltipTargetRule) {
			listener.enterClickLinkTooltipTargetRule(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitClickLinkTooltipTargetRule) {
			listener.exitClickLinkTooltipTargetRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitClickLinkTooltipTargetRule) {
			return visitor.visitClickLinkTooltipTargetRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class SeparatorContext extends ParserRuleContext {
	public NEWLINE(): TerminalNode | undefined { return this.tryGetToken(FlowParser.NEWLINE, 0); }
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(FlowParser.SEMI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_separator; }
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSeparator) {
			listener.enterSeparator(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSeparator) {
			listener.exitSeparator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSeparator) {
			return visitor.visitSeparator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class FirstStmtSeparatorContext extends ParserRuleContext {
	public SEMI(): TerminalNode | undefined { return this.tryGetToken(FlowParser.SEMI, 0); }
	public NEWLINE(): TerminalNode | undefined { return this.tryGetToken(FlowParser.NEWLINE, 0); }
	public spaceList(): SpaceListContext | undefined {
		return this.tryGetRuleContext(0, SpaceListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_firstStmtSeparator; }
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterFirstStmtSeparator) {
			listener.enterFirstStmtSeparator(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitFirstStmtSeparator) {
			listener.exitFirstStmtSeparator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitFirstStmtSeparator) {
			return visitor.visitFirstStmtSeparator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class SpaceListContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_spaceList; }
	public copyFrom(ctx: SpaceListContext): void {
		super.copyFrom(ctx);
	}
}
export class MultipleSpacesContext extends SpaceListContext {
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	public spaceList(): SpaceListContext {
		return this.getRuleContext(0, SpaceListContext);
	}
	constructor(ctx: SpaceListContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterMultipleSpaces) {
			listener.enterMultipleSpaces(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitMultipleSpaces) {
			listener.exitMultipleSpaces(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitMultipleSpaces) {
			return visitor.visitMultipleSpaces(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SingleSpaceContext extends SpaceListContext {
	public SPACE(): TerminalNode { return this.getToken(FlowParser.SPACE, 0); }
	constructor(ctx: SpaceListContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSingleSpace) {
			listener.enterSingleSpace(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSingleSpace) {
			listener.exitSingleSpace(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSingleSpace) {
			return visitor.visitSingleSpace(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TextNoTagsContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_textNoTags; }
	public copyFrom(ctx: TextNoTagsContext): void {
		super.copyFrom(ctx);
	}
}
export class PlainTextNoTagsContext extends TextNoTagsContext {
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	constructor(ctx: TextNoTagsContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainTextNoTags) {
			listener.enterPlainTextNoTags(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainTextNoTags) {
			listener.exitPlainTextNoTags(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainTextNoTags) {
			return visitor.visitPlainTextNoTags(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeStringTextNoTagsContext extends TextNoTagsContext {
	public NODE_STRING(): TerminalNode { return this.getToken(FlowParser.NODE_STRING, 0); }
	constructor(ctx: TextNoTagsContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeStringTextNoTags) {
			listener.enterNodeStringTextNoTags(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeStringTextNoTags) {
			listener.exitNodeStringTextNoTags(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeStringTextNoTags) {
			return visitor.visitNodeStringTextNoTags(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ShapeDataContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_shapeData; }
	public copyFrom(ctx: ShapeDataContext): void {
		super.copyFrom(ctx);
	}
}
export class MultipleShapeDataContext extends ShapeDataContext {
	public shapeData(): ShapeDataContext {
		return this.getRuleContext(0, ShapeDataContext);
	}
	public SHAPE_DATA(): TerminalNode { return this.getToken(FlowParser.SHAPE_DATA, 0); }
	constructor(ctx: ShapeDataContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterMultipleShapeData) {
			listener.enterMultipleShapeData(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitMultipleShapeData) {
			listener.exitMultipleShapeData(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitMultipleShapeData) {
			return visitor.visitMultipleShapeData(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class SingleShapeDataContext extends ShapeDataContext {
	public SHAPE_DATA(): TerminalNode { return this.getToken(FlowParser.SHAPE_DATA, 0); }
	constructor(ctx: ShapeDataContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterSingleShapeData) {
			listener.enterSingleShapeData(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitSingleShapeData) {
			listener.exitSingleShapeData(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitSingleShapeData) {
			return visitor.visitSingleShapeData(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StyleDefinitionContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_styleDefinition; }
	public copyFrom(ctx: StyleDefinitionContext): void {
		super.copyFrom(ctx);
	}
}
export class PlainStyleDefinitionContext extends StyleDefinitionContext {
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	constructor(ctx: StyleDefinitionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainStyleDefinition) {
			listener.enterPlainStyleDefinition(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainStyleDefinition) {
			listener.exitPlainStyleDefinition(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainStyleDefinition) {
			return visitor.visitPlainStyleDefinition(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CallbackNameContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_callbackName; }
	public copyFrom(ctx: CallbackNameContext): void {
		super.copyFrom(ctx);
	}
}
export class PlainCallbackNameContext extends CallbackNameContext {
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	constructor(ctx: CallbackNameContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainCallbackName) {
			listener.enterPlainCallbackName(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainCallbackName) {
			listener.exitPlainCallbackName(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainCallbackName) {
			return visitor.visitPlainCallbackName(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NodeStringCallbackNameContext extends CallbackNameContext {
	public NODE_STRING(): TerminalNode { return this.getToken(FlowParser.NODE_STRING, 0); }
	constructor(ctx: CallbackNameContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterNodeStringCallbackName) {
			listener.enterNodeStringCallbackName(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitNodeStringCallbackName) {
			listener.exitNodeStringCallbackName(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitNodeStringCallbackName) {
			return visitor.visitNodeStringCallbackName(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CallbackArgsContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FlowParser.RULE_callbackArgs; }
	public copyFrom(ctx: CallbackArgsContext): void {
		super.copyFrom(ctx);
	}
}
export class PlainCallbackArgsContext extends CallbackArgsContext {
	public PS(): TerminalNode { return this.getToken(FlowParser.PS, 0); }
	public TEXT(): TerminalNode { return this.getToken(FlowParser.TEXT, 0); }
	public PE(): TerminalNode { return this.getToken(FlowParser.PE, 0); }
	constructor(ctx: CallbackArgsContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterPlainCallbackArgs) {
			listener.enterPlainCallbackArgs(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitPlainCallbackArgs) {
			listener.exitPlainCallbackArgs(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitPlainCallbackArgs) {
			return visitor.visitPlainCallbackArgs(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class EmptyCallbackArgsContext extends CallbackArgsContext {
	public PS(): TerminalNode { return this.getToken(FlowParser.PS, 0); }
	public PE(): TerminalNode { return this.getToken(FlowParser.PE, 0); }
	constructor(ctx: CallbackArgsContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: FlowListener): void {
		if (listener.enterEmptyCallbackArgs) {
			listener.enterEmptyCallbackArgs(this);
		}
	}
	// @Override
	public exitRule(listener: FlowListener): void {
		if (listener.exitEmptyCallbackArgs) {
			listener.exitEmptyCallbackArgs(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FlowVisitor<Result>): Result {
		if (visitor.visitEmptyCallbackArgs) {
			return visitor.visitEmptyCallbackArgs(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


