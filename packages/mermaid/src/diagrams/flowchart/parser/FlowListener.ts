// Generated from Flow.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { PlainTextNoTagsContext } from "./FlowParser";
import { NodeStringTextNoTagsContext } from "./FlowParser";
import { SquareVertexContext } from "./FlowParser";
import { DoubleCircleVertexContext } from "./FlowParser";
import { CircleVertexContext } from "./FlowParser";
import { EllipseVertexContext } from "./FlowParser";
import { StadiumVertexContext } from "./FlowParser";
import { SubroutineVertexContext } from "./FlowParser";
import { CylinderVertexContext } from "./FlowParser";
import { RoundVertexContext } from "./FlowParser";
import { DiamondVertexContext } from "./FlowParser";
import { HexagonVertexContext } from "./FlowParser";
import { OddVertexContext } from "./FlowParser";
import { TrapezoidVertexContext } from "./FlowParser";
import { InvTrapezoidVertexContext } from "./FlowParser";
import { PlainIdVertexContext } from "./FlowParser";
import { StatementLineContext } from "./FlowParser";
import { SemicolonLineContext } from "./FlowParser";
import { NewlineLineContext } from "./FlowParser";
import { SpaceLineContext } from "./FlowParser";
import { PlainTextContext } from "./FlowParser";
import { StringTextContext } from "./FlowParser";
import { MarkdownTextContext } from "./FlowParser";
import { NodeStringTextContext } from "./FlowParser";
import { EmptyDocumentContext } from "./FlowParser";
import { DocumentWithLineContext } from "./FlowParser";
import { LinkWithArrowTextContext } from "./FlowParser";
import { PlainLinkContext } from "./FlowParser";
import { StartLinkWithTextContext } from "./FlowParser";
import { TextIdContext } from "./FlowParser";
import { NodeStringIdContext } from "./FlowParser";
import { SingleEdgeTextTokenContext } from "./FlowParser";
import { MultipleEdgeTextTokensContext } from "./FlowParser";
import { StringEdgeTextContext } from "./FlowParser";
import { MarkdownEdgeTextContext } from "./FlowParser";
import { PipedArrowTextContext } from "./FlowParser";
import { PlainCallbackArgsContext } from "./FlowParser";
import { EmptyCallbackArgsContext } from "./FlowParser";
import { RegularArrowContext } from "./FlowParser";
import { SimpleArrowContext } from "./FlowParser";
import { BidirectionalArrowContext } from "./FlowParser";
import { RegularLinkContext } from "./FlowParser";
import { ThickLinkContext } from "./FlowParser";
import { DottedLinkContext } from "./FlowParser";
import { InvisibleLinkContext } from "./FlowParser";
import { VertexStmtContext } from "./FlowParser";
import { StyleStmtContext } from "./FlowParser";
import { LinkStyleStmtContext } from "./FlowParser";
import { ClassDefStmtContext } from "./FlowParser";
import { ClassStmtContext } from "./FlowParser";
import { ClickStmtContext } from "./FlowParser";
import { SubgraphStmtContext } from "./FlowParser";
import { DirectionStmtContext } from "./FlowParser";
import { AccessibilityStmtContext } from "./FlowParser";
import { PlainVertexContext } from "./FlowParser";
import { StyledVertexWithClassContext } from "./FlowParser";
import { SingleTextTokenContext } from "./FlowParser";
import { MultipleTextTokensContext } from "./FlowParser";
import { DirectionTDContext } from "./FlowParser";
import { DirectionLRContext } from "./FlowParser";
import { DirectionRLContext } from "./FlowParser";
import { DirectionBTContext } from "./FlowParser";
import { DirectionTBContext } from "./FlowParser";
import { DirectionTextContext } from "./FlowParser";
import { PlainEdgeTextContext } from "./FlowParser";
import { NodeStringEdgeTextContext } from "./FlowParser";
import { PlainStyleDefinitionContext } from "./FlowParser";
import { MultipleSpacesContext } from "./FlowParser";
import { SingleSpaceContext } from "./FlowParser";
import { SpaceGraphConfigContext } from "./FlowParser";
import { NewlineGraphConfigContext } from "./FlowParser";
import { GraphNoDirectionContext } from "./FlowParser";
import { GraphWithDirectionContext } from "./FlowParser";
import { GraphWithDirectionNoSeparatorContext } from "./FlowParser";
import { AccTitleStmtContext } from "./FlowParser";
import { AccDescrStmtContext } from "./FlowParser";
import { VertexWithShapeDataContext } from "./FlowParser";
import { VertexWithLinkContext } from "./FlowParser";
import { VertexWithLinkAndSpaceContext } from "./FlowParser";
import { NodeWithSpaceContext } from "./FlowParser";
import { NodeWithShapeDataContext } from "./FlowParser";
import { SingleNodeContext } from "./FlowParser";
import { SubgraphWithTitleContext } from "./FlowParser";
import { SubgraphWithTextNoTagsContext } from "./FlowParser";
import { PlainSubgraphContext } from "./FlowParser";
import { StyleRuleContext } from "./FlowParser";
import { ClassRuleContext } from "./FlowParser";
import { MultipleShapeDataContext } from "./FlowParser";
import { SingleShapeDataContext } from "./FlowParser";
import { PlainCallbackNameContext } from "./FlowParser";
import { NodeStringCallbackNameContext } from "./FlowParser";
import { LinkStyleRuleContext } from "./FlowParser";
import { ClassDefRuleContext } from "./FlowParser";
import { SingleStyledVertexContext } from "./FlowParser";
import { NodeWithShapeDataAndAmpContext } from "./FlowParser";
import { NodeWithAmpContext } from "./FlowParser";
import { ClickCallbackRuleContext } from "./FlowParser";
import { ClickCallbackTooltipRuleContext } from "./FlowParser";
import { ClickCallbackArgsRuleContext } from "./FlowParser";
import { ClickCallbackArgsTooltipRuleContext } from "./FlowParser";
import { ClickHrefRuleContext } from "./FlowParser";
import { ClickHrefTooltipRuleContext } from "./FlowParser";
import { ClickHrefTargetRuleContext } from "./FlowParser";
import { ClickHrefTooltipTargetRuleContext } from "./FlowParser";
import { ClickLinkRuleContext } from "./FlowParser";
import { ClickLinkTooltipRuleContext } from "./FlowParser";
import { ClickLinkTargetRuleContext } from "./FlowParser";
import { ClickLinkTooltipTargetRuleContext } from "./FlowParser";
import { StartContext } from "./FlowParser";
import { DocumentContext } from "./FlowParser";
import { LineContext } from "./FlowParser";
import { GraphConfigContext } from "./FlowParser";
import { DirectionContext } from "./FlowParser";
import { StatementContext } from "./FlowParser";
import { VertexStatementContext } from "./FlowParser";
import { NodeContext } from "./FlowParser";
import { StyledVertexContext } from "./FlowParser";
import { VertexContext } from "./FlowParser";
import { LinkContext } from "./FlowParser";
import { LinkStatementContext } from "./FlowParser";
import { TextContext } from "./FlowParser";
import { TextTokenContext } from "./FlowParser";
import { IdStringContext } from "./FlowParser";
import { EdgeTextContext } from "./FlowParser";
import { EdgeTextTokenContext } from "./FlowParser";
import { ArrowTextContext } from "./FlowParser";
import { SubgraphStatementContext } from "./FlowParser";
import { AccessibilityStatementContext } from "./FlowParser";
import { StyleStatementContext } from "./FlowParser";
import { LinkStyleStatementContext } from "./FlowParser";
import { ClassDefStatementContext } from "./FlowParser";
import { ClassStatementContext } from "./FlowParser";
import { ClickStatementContext } from "./FlowParser";
import { SeparatorContext } from "./FlowParser";
import { FirstStmtSeparatorContext } from "./FlowParser";
import { SpaceListContext } from "./FlowParser";
import { TextNoTagsContext } from "./FlowParser";
import { ShapeDataContext } from "./FlowParser";
import { StyleDefinitionContext } from "./FlowParser";
import { CallbackNameContext } from "./FlowParser";
import { CallbackArgsContext } from "./FlowParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `FlowParser`.
 */
export interface FlowListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by the `PlainTextNoTags`
	 * labeled alternative in `FlowParser.textNoTags`.
	 * @param ctx the parse tree
	 */
	enterPlainTextNoTags?: (ctx: PlainTextNoTagsContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainTextNoTags`
	 * labeled alternative in `FlowParser.textNoTags`.
	 * @param ctx the parse tree
	 */
	exitPlainTextNoTags?: (ctx: PlainTextNoTagsContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeStringTextNoTags`
	 * labeled alternative in `FlowParser.textNoTags`.
	 * @param ctx the parse tree
	 */
	enterNodeStringTextNoTags?: (ctx: NodeStringTextNoTagsContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeStringTextNoTags`
	 * labeled alternative in `FlowParser.textNoTags`.
	 * @param ctx the parse tree
	 */
	exitNodeStringTextNoTags?: (ctx: NodeStringTextNoTagsContext) => void;

	/**
	 * Enter a parse tree produced by the `SquareVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterSquareVertex?: (ctx: SquareVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `SquareVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitSquareVertex?: (ctx: SquareVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `DoubleCircleVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterDoubleCircleVertex?: (ctx: DoubleCircleVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `DoubleCircleVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitDoubleCircleVertex?: (ctx: DoubleCircleVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `CircleVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterCircleVertex?: (ctx: CircleVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `CircleVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitCircleVertex?: (ctx: CircleVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `EllipseVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterEllipseVertex?: (ctx: EllipseVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `EllipseVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitEllipseVertex?: (ctx: EllipseVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `StadiumVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterStadiumVertex?: (ctx: StadiumVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `StadiumVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitStadiumVertex?: (ctx: StadiumVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `SubroutineVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterSubroutineVertex?: (ctx: SubroutineVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `SubroutineVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitSubroutineVertex?: (ctx: SubroutineVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `CylinderVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterCylinderVertex?: (ctx: CylinderVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `CylinderVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitCylinderVertex?: (ctx: CylinderVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `RoundVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterRoundVertex?: (ctx: RoundVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `RoundVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitRoundVertex?: (ctx: RoundVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `DiamondVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterDiamondVertex?: (ctx: DiamondVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `DiamondVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitDiamondVertex?: (ctx: DiamondVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `HexagonVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterHexagonVertex?: (ctx: HexagonVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `HexagonVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitHexagonVertex?: (ctx: HexagonVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `OddVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterOddVertex?: (ctx: OddVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `OddVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitOddVertex?: (ctx: OddVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `TrapezoidVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterTrapezoidVertex?: (ctx: TrapezoidVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `TrapezoidVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitTrapezoidVertex?: (ctx: TrapezoidVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `InvTrapezoidVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterInvTrapezoidVertex?: (ctx: InvTrapezoidVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `InvTrapezoidVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitInvTrapezoidVertex?: (ctx: InvTrapezoidVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainIdVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterPlainIdVertex?: (ctx: PlainIdVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainIdVertex`
	 * labeled alternative in `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitPlainIdVertex?: (ctx: PlainIdVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `StatementLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	enterStatementLine?: (ctx: StatementLineContext) => void;
	/**
	 * Exit a parse tree produced by the `StatementLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	exitStatementLine?: (ctx: StatementLineContext) => void;

	/**
	 * Enter a parse tree produced by the `SemicolonLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	enterSemicolonLine?: (ctx: SemicolonLineContext) => void;
	/**
	 * Exit a parse tree produced by the `SemicolonLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	exitSemicolonLine?: (ctx: SemicolonLineContext) => void;

	/**
	 * Enter a parse tree produced by the `NewlineLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	enterNewlineLine?: (ctx: NewlineLineContext) => void;
	/**
	 * Exit a parse tree produced by the `NewlineLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	exitNewlineLine?: (ctx: NewlineLineContext) => void;

	/**
	 * Enter a parse tree produced by the `SpaceLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	enterSpaceLine?: (ctx: SpaceLineContext) => void;
	/**
	 * Exit a parse tree produced by the `SpaceLine`
	 * labeled alternative in `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	exitSpaceLine?: (ctx: SpaceLineContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	enterPlainText?: (ctx: PlainTextContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	exitPlainText?: (ctx: PlainTextContext) => void;

	/**
	 * Enter a parse tree produced by the `StringText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	enterStringText?: (ctx: StringTextContext) => void;
	/**
	 * Exit a parse tree produced by the `StringText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	exitStringText?: (ctx: StringTextContext) => void;

	/**
	 * Enter a parse tree produced by the `MarkdownText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	enterMarkdownText?: (ctx: MarkdownTextContext) => void;
	/**
	 * Exit a parse tree produced by the `MarkdownText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	exitMarkdownText?: (ctx: MarkdownTextContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeStringText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	enterNodeStringText?: (ctx: NodeStringTextContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeStringText`
	 * labeled alternative in `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	exitNodeStringText?: (ctx: NodeStringTextContext) => void;

	/**
	 * Enter a parse tree produced by the `EmptyDocument`
	 * labeled alternative in `FlowParser.document`.
	 * @param ctx the parse tree
	 */
	enterEmptyDocument?: (ctx: EmptyDocumentContext) => void;
	/**
	 * Exit a parse tree produced by the `EmptyDocument`
	 * labeled alternative in `FlowParser.document`.
	 * @param ctx the parse tree
	 */
	exitEmptyDocument?: (ctx: EmptyDocumentContext) => void;

	/**
	 * Enter a parse tree produced by the `DocumentWithLine`
	 * labeled alternative in `FlowParser.document`.
	 * @param ctx the parse tree
	 */
	enterDocumentWithLine?: (ctx: DocumentWithLineContext) => void;
	/**
	 * Exit a parse tree produced by the `DocumentWithLine`
	 * labeled alternative in `FlowParser.document`.
	 * @param ctx the parse tree
	 */
	exitDocumentWithLine?: (ctx: DocumentWithLineContext) => void;

	/**
	 * Enter a parse tree produced by the `LinkWithArrowText`
	 * labeled alternative in `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	enterLinkWithArrowText?: (ctx: LinkWithArrowTextContext) => void;
	/**
	 * Exit a parse tree produced by the `LinkWithArrowText`
	 * labeled alternative in `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	exitLinkWithArrowText?: (ctx: LinkWithArrowTextContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainLink`
	 * labeled alternative in `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	enterPlainLink?: (ctx: PlainLinkContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainLink`
	 * labeled alternative in `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	exitPlainLink?: (ctx: PlainLinkContext) => void;

	/**
	 * Enter a parse tree produced by the `StartLinkWithText`
	 * labeled alternative in `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	enterStartLinkWithText?: (ctx: StartLinkWithTextContext) => void;
	/**
	 * Exit a parse tree produced by the `StartLinkWithText`
	 * labeled alternative in `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	exitStartLinkWithText?: (ctx: StartLinkWithTextContext) => void;

	/**
	 * Enter a parse tree produced by the `TextId`
	 * labeled alternative in `FlowParser.idString`.
	 * @param ctx the parse tree
	 */
	enterTextId?: (ctx: TextIdContext) => void;
	/**
	 * Exit a parse tree produced by the `TextId`
	 * labeled alternative in `FlowParser.idString`.
	 * @param ctx the parse tree
	 */
	exitTextId?: (ctx: TextIdContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeStringId`
	 * labeled alternative in `FlowParser.idString`.
	 * @param ctx the parse tree
	 */
	enterNodeStringId?: (ctx: NodeStringIdContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeStringId`
	 * labeled alternative in `FlowParser.idString`.
	 * @param ctx the parse tree
	 */
	exitNodeStringId?: (ctx: NodeStringIdContext) => void;

	/**
	 * Enter a parse tree produced by the `SingleEdgeTextToken`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	enterSingleEdgeTextToken?: (ctx: SingleEdgeTextTokenContext) => void;
	/**
	 * Exit a parse tree produced by the `SingleEdgeTextToken`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	exitSingleEdgeTextToken?: (ctx: SingleEdgeTextTokenContext) => void;

	/**
	 * Enter a parse tree produced by the `MultipleEdgeTextTokens`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	enterMultipleEdgeTextTokens?: (ctx: MultipleEdgeTextTokensContext) => void;
	/**
	 * Exit a parse tree produced by the `MultipleEdgeTextTokens`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	exitMultipleEdgeTextTokens?: (ctx: MultipleEdgeTextTokensContext) => void;

	/**
	 * Enter a parse tree produced by the `StringEdgeText`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	enterStringEdgeText?: (ctx: StringEdgeTextContext) => void;
	/**
	 * Exit a parse tree produced by the `StringEdgeText`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	exitStringEdgeText?: (ctx: StringEdgeTextContext) => void;

	/**
	 * Enter a parse tree produced by the `MarkdownEdgeText`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	enterMarkdownEdgeText?: (ctx: MarkdownEdgeTextContext) => void;
	/**
	 * Exit a parse tree produced by the `MarkdownEdgeText`
	 * labeled alternative in `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	exitMarkdownEdgeText?: (ctx: MarkdownEdgeTextContext) => void;

	/**
	 * Enter a parse tree produced by the `PipedArrowText`
	 * labeled alternative in `FlowParser.arrowText`.
	 * @param ctx the parse tree
	 */
	enterPipedArrowText?: (ctx: PipedArrowTextContext) => void;
	/**
	 * Exit a parse tree produced by the `PipedArrowText`
	 * labeled alternative in `FlowParser.arrowText`.
	 * @param ctx the parse tree
	 */
	exitPipedArrowText?: (ctx: PipedArrowTextContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainCallbackArgs`
	 * labeled alternative in `FlowParser.callbackArgs`.
	 * @param ctx the parse tree
	 */
	enterPlainCallbackArgs?: (ctx: PlainCallbackArgsContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainCallbackArgs`
	 * labeled alternative in `FlowParser.callbackArgs`.
	 * @param ctx the parse tree
	 */
	exitPlainCallbackArgs?: (ctx: PlainCallbackArgsContext) => void;

	/**
	 * Enter a parse tree produced by the `EmptyCallbackArgs`
	 * labeled alternative in `FlowParser.callbackArgs`.
	 * @param ctx the parse tree
	 */
	enterEmptyCallbackArgs?: (ctx: EmptyCallbackArgsContext) => void;
	/**
	 * Exit a parse tree produced by the `EmptyCallbackArgs`
	 * labeled alternative in `FlowParser.callbackArgs`.
	 * @param ctx the parse tree
	 */
	exitEmptyCallbackArgs?: (ctx: EmptyCallbackArgsContext) => void;

	/**
	 * Enter a parse tree produced by the `RegularArrow`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterRegularArrow?: (ctx: RegularArrowContext) => void;
	/**
	 * Exit a parse tree produced by the `RegularArrow`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitRegularArrow?: (ctx: RegularArrowContext) => void;

	/**
	 * Enter a parse tree produced by the `SimpleArrow`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterSimpleArrow?: (ctx: SimpleArrowContext) => void;
	/**
	 * Exit a parse tree produced by the `SimpleArrow`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitSimpleArrow?: (ctx: SimpleArrowContext) => void;

	/**
	 * Enter a parse tree produced by the `BidirectionalArrow`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterBidirectionalArrow?: (ctx: BidirectionalArrowContext) => void;
	/**
	 * Exit a parse tree produced by the `BidirectionalArrow`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitBidirectionalArrow?: (ctx: BidirectionalArrowContext) => void;

	/**
	 * Enter a parse tree produced by the `RegularLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterRegularLink?: (ctx: RegularLinkContext) => void;
	/**
	 * Exit a parse tree produced by the `RegularLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitRegularLink?: (ctx: RegularLinkContext) => void;

	/**
	 * Enter a parse tree produced by the `ThickLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterThickLink?: (ctx: ThickLinkContext) => void;
	/**
	 * Exit a parse tree produced by the `ThickLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitThickLink?: (ctx: ThickLinkContext) => void;

	/**
	 * Enter a parse tree produced by the `DottedLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterDottedLink?: (ctx: DottedLinkContext) => void;
	/**
	 * Exit a parse tree produced by the `DottedLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitDottedLink?: (ctx: DottedLinkContext) => void;

	/**
	 * Enter a parse tree produced by the `InvisibleLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterInvisibleLink?: (ctx: InvisibleLinkContext) => void;
	/**
	 * Exit a parse tree produced by the `InvisibleLink`
	 * labeled alternative in `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitInvisibleLink?: (ctx: InvisibleLinkContext) => void;

	/**
	 * Enter a parse tree produced by the `VertexStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterVertexStmt?: (ctx: VertexStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `VertexStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitVertexStmt?: (ctx: VertexStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `StyleStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterStyleStmt?: (ctx: StyleStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `StyleStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitStyleStmt?: (ctx: StyleStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `LinkStyleStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterLinkStyleStmt?: (ctx: LinkStyleStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `LinkStyleStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitLinkStyleStmt?: (ctx: LinkStyleStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `ClassDefStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterClassDefStmt?: (ctx: ClassDefStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `ClassDefStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitClassDefStmt?: (ctx: ClassDefStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `ClassStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterClassStmt?: (ctx: ClassStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `ClassStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitClassStmt?: (ctx: ClassStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterClickStmt?: (ctx: ClickStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitClickStmt?: (ctx: ClickStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `SubgraphStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterSubgraphStmt?: (ctx: SubgraphStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `SubgraphStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitSubgraphStmt?: (ctx: SubgraphStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `DirectionStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterDirectionStmt?: (ctx: DirectionStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `DirectionStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitDirectionStmt?: (ctx: DirectionStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `AccessibilityStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterAccessibilityStmt?: (ctx: AccessibilityStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `AccessibilityStmt`
	 * labeled alternative in `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitAccessibilityStmt?: (ctx: AccessibilityStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainVertex`
	 * labeled alternative in `FlowParser.styledVertex`.
	 * @param ctx the parse tree
	 */
	enterPlainVertex?: (ctx: PlainVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainVertex`
	 * labeled alternative in `FlowParser.styledVertex`.
	 * @param ctx the parse tree
	 */
	exitPlainVertex?: (ctx: PlainVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `StyledVertexWithClass`
	 * labeled alternative in `FlowParser.styledVertex`.
	 * @param ctx the parse tree
	 */
	enterStyledVertexWithClass?: (ctx: StyledVertexWithClassContext) => void;
	/**
	 * Exit a parse tree produced by the `StyledVertexWithClass`
	 * labeled alternative in `FlowParser.styledVertex`.
	 * @param ctx the parse tree
	 */
	exitStyledVertexWithClass?: (ctx: StyledVertexWithClassContext) => void;

	/**
	 * Enter a parse tree produced by the `SingleTextToken`
	 * labeled alternative in `FlowParser.text`.
	 * @param ctx the parse tree
	 */
	enterSingleTextToken?: (ctx: SingleTextTokenContext) => void;
	/**
	 * Exit a parse tree produced by the `SingleTextToken`
	 * labeled alternative in `FlowParser.text`.
	 * @param ctx the parse tree
	 */
	exitSingleTextToken?: (ctx: SingleTextTokenContext) => void;

	/**
	 * Enter a parse tree produced by the `MultipleTextTokens`
	 * labeled alternative in `FlowParser.text`.
	 * @param ctx the parse tree
	 */
	enterMultipleTextTokens?: (ctx: MultipleTextTokensContext) => void;
	/**
	 * Exit a parse tree produced by the `MultipleTextTokens`
	 * labeled alternative in `FlowParser.text`.
	 * @param ctx the parse tree
	 */
	exitMultipleTextTokens?: (ctx: MultipleTextTokensContext) => void;

	/**
	 * Enter a parse tree produced by the `DirectionTD`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirectionTD?: (ctx: DirectionTDContext) => void;
	/**
	 * Exit a parse tree produced by the `DirectionTD`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirectionTD?: (ctx: DirectionTDContext) => void;

	/**
	 * Enter a parse tree produced by the `DirectionLR`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirectionLR?: (ctx: DirectionLRContext) => void;
	/**
	 * Exit a parse tree produced by the `DirectionLR`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirectionLR?: (ctx: DirectionLRContext) => void;

	/**
	 * Enter a parse tree produced by the `DirectionRL`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirectionRL?: (ctx: DirectionRLContext) => void;
	/**
	 * Exit a parse tree produced by the `DirectionRL`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirectionRL?: (ctx: DirectionRLContext) => void;

	/**
	 * Enter a parse tree produced by the `DirectionBT`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirectionBT?: (ctx: DirectionBTContext) => void;
	/**
	 * Exit a parse tree produced by the `DirectionBT`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirectionBT?: (ctx: DirectionBTContext) => void;

	/**
	 * Enter a parse tree produced by the `DirectionTB`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirectionTB?: (ctx: DirectionTBContext) => void;
	/**
	 * Exit a parse tree produced by the `DirectionTB`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirectionTB?: (ctx: DirectionTBContext) => void;

	/**
	 * Enter a parse tree produced by the `DirectionText`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirectionText?: (ctx: DirectionTextContext) => void;
	/**
	 * Exit a parse tree produced by the `DirectionText`
	 * labeled alternative in `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirectionText?: (ctx: DirectionTextContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainEdgeText`
	 * labeled alternative in `FlowParser.edgeTextToken`.
	 * @param ctx the parse tree
	 */
	enterPlainEdgeText?: (ctx: PlainEdgeTextContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainEdgeText`
	 * labeled alternative in `FlowParser.edgeTextToken`.
	 * @param ctx the parse tree
	 */
	exitPlainEdgeText?: (ctx: PlainEdgeTextContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeStringEdgeText`
	 * labeled alternative in `FlowParser.edgeTextToken`.
	 * @param ctx the parse tree
	 */
	enterNodeStringEdgeText?: (ctx: NodeStringEdgeTextContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeStringEdgeText`
	 * labeled alternative in `FlowParser.edgeTextToken`.
	 * @param ctx the parse tree
	 */
	exitNodeStringEdgeText?: (ctx: NodeStringEdgeTextContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainStyleDefinition`
	 * labeled alternative in `FlowParser.styleDefinition`.
	 * @param ctx the parse tree
	 */
	enterPlainStyleDefinition?: (ctx: PlainStyleDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainStyleDefinition`
	 * labeled alternative in `FlowParser.styleDefinition`.
	 * @param ctx the parse tree
	 */
	exitPlainStyleDefinition?: (ctx: PlainStyleDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by the `MultipleSpaces`
	 * labeled alternative in `FlowParser.spaceList`.
	 * @param ctx the parse tree
	 */
	enterMultipleSpaces?: (ctx: MultipleSpacesContext) => void;
	/**
	 * Exit a parse tree produced by the `MultipleSpaces`
	 * labeled alternative in `FlowParser.spaceList`.
	 * @param ctx the parse tree
	 */
	exitMultipleSpaces?: (ctx: MultipleSpacesContext) => void;

	/**
	 * Enter a parse tree produced by the `SingleSpace`
	 * labeled alternative in `FlowParser.spaceList`.
	 * @param ctx the parse tree
	 */
	enterSingleSpace?: (ctx: SingleSpaceContext) => void;
	/**
	 * Exit a parse tree produced by the `SingleSpace`
	 * labeled alternative in `FlowParser.spaceList`.
	 * @param ctx the parse tree
	 */
	exitSingleSpace?: (ctx: SingleSpaceContext) => void;

	/**
	 * Enter a parse tree produced by the `SpaceGraphConfig`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	enterSpaceGraphConfig?: (ctx: SpaceGraphConfigContext) => void;
	/**
	 * Exit a parse tree produced by the `SpaceGraphConfig`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	exitSpaceGraphConfig?: (ctx: SpaceGraphConfigContext) => void;

	/**
	 * Enter a parse tree produced by the `NewlineGraphConfig`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	enterNewlineGraphConfig?: (ctx: NewlineGraphConfigContext) => void;
	/**
	 * Exit a parse tree produced by the `NewlineGraphConfig`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	exitNewlineGraphConfig?: (ctx: NewlineGraphConfigContext) => void;

	/**
	 * Enter a parse tree produced by the `GraphNoDirection`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	enterGraphNoDirection?: (ctx: GraphNoDirectionContext) => void;
	/**
	 * Exit a parse tree produced by the `GraphNoDirection`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	exitGraphNoDirection?: (ctx: GraphNoDirectionContext) => void;

	/**
	 * Enter a parse tree produced by the `GraphWithDirection`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	enterGraphWithDirection?: (ctx: GraphWithDirectionContext) => void;
	/**
	 * Exit a parse tree produced by the `GraphWithDirection`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	exitGraphWithDirection?: (ctx: GraphWithDirectionContext) => void;

	/**
	 * Enter a parse tree produced by the `GraphWithDirectionNoSeparator`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	enterGraphWithDirectionNoSeparator?: (ctx: GraphWithDirectionNoSeparatorContext) => void;
	/**
	 * Exit a parse tree produced by the `GraphWithDirectionNoSeparator`
	 * labeled alternative in `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	exitGraphWithDirectionNoSeparator?: (ctx: GraphWithDirectionNoSeparatorContext) => void;

	/**
	 * Enter a parse tree produced by the `AccTitleStmt`
	 * labeled alternative in `FlowParser.accessibilityStatement`.
	 * @param ctx the parse tree
	 */
	enterAccTitleStmt?: (ctx: AccTitleStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `AccTitleStmt`
	 * labeled alternative in `FlowParser.accessibilityStatement`.
	 * @param ctx the parse tree
	 */
	exitAccTitleStmt?: (ctx: AccTitleStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `AccDescrStmt`
	 * labeled alternative in `FlowParser.accessibilityStatement`.
	 * @param ctx the parse tree
	 */
	enterAccDescrStmt?: (ctx: AccDescrStmtContext) => void;
	/**
	 * Exit a parse tree produced by the `AccDescrStmt`
	 * labeled alternative in `FlowParser.accessibilityStatement`.
	 * @param ctx the parse tree
	 */
	exitAccDescrStmt?: (ctx: AccDescrStmtContext) => void;

	/**
	 * Enter a parse tree produced by the `VertexWithShapeData`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	enterVertexWithShapeData?: (ctx: VertexWithShapeDataContext) => void;
	/**
	 * Exit a parse tree produced by the `VertexWithShapeData`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	exitVertexWithShapeData?: (ctx: VertexWithShapeDataContext) => void;

	/**
	 * Enter a parse tree produced by the `VertexWithLink`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	enterVertexWithLink?: (ctx: VertexWithLinkContext) => void;
	/**
	 * Exit a parse tree produced by the `VertexWithLink`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	exitVertexWithLink?: (ctx: VertexWithLinkContext) => void;

	/**
	 * Enter a parse tree produced by the `VertexWithLinkAndSpace`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	enterVertexWithLinkAndSpace?: (ctx: VertexWithLinkAndSpaceContext) => void;
	/**
	 * Exit a parse tree produced by the `VertexWithLinkAndSpace`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	exitVertexWithLinkAndSpace?: (ctx: VertexWithLinkAndSpaceContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeWithSpace`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	enterNodeWithSpace?: (ctx: NodeWithSpaceContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeWithSpace`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	exitNodeWithSpace?: (ctx: NodeWithSpaceContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeWithShapeData`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	enterNodeWithShapeData?: (ctx: NodeWithShapeDataContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeWithShapeData`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	exitNodeWithShapeData?: (ctx: NodeWithShapeDataContext) => void;

	/**
	 * Enter a parse tree produced by the `SingleNode`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	enterSingleNode?: (ctx: SingleNodeContext) => void;
	/**
	 * Exit a parse tree produced by the `SingleNode`
	 * labeled alternative in `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	exitSingleNode?: (ctx: SingleNodeContext) => void;

	/**
	 * Enter a parse tree produced by the `SubgraphWithTitle`
	 * labeled alternative in `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	enterSubgraphWithTitle?: (ctx: SubgraphWithTitleContext) => void;
	/**
	 * Exit a parse tree produced by the `SubgraphWithTitle`
	 * labeled alternative in `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	exitSubgraphWithTitle?: (ctx: SubgraphWithTitleContext) => void;

	/**
	 * Enter a parse tree produced by the `SubgraphWithTextNoTags`
	 * labeled alternative in `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	enterSubgraphWithTextNoTags?: (ctx: SubgraphWithTextNoTagsContext) => void;
	/**
	 * Exit a parse tree produced by the `SubgraphWithTextNoTags`
	 * labeled alternative in `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	exitSubgraphWithTextNoTags?: (ctx: SubgraphWithTextNoTagsContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainSubgraph`
	 * labeled alternative in `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	enterPlainSubgraph?: (ctx: PlainSubgraphContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainSubgraph`
	 * labeled alternative in `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	exitPlainSubgraph?: (ctx: PlainSubgraphContext) => void;

	/**
	 * Enter a parse tree produced by the `StyleRule`
	 * labeled alternative in `FlowParser.styleStatement`.
	 * @param ctx the parse tree
	 */
	enterStyleRule?: (ctx: StyleRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `StyleRule`
	 * labeled alternative in `FlowParser.styleStatement`.
	 * @param ctx the parse tree
	 */
	exitStyleRule?: (ctx: StyleRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClassRule`
	 * labeled alternative in `FlowParser.classStatement`.
	 * @param ctx the parse tree
	 */
	enterClassRule?: (ctx: ClassRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClassRule`
	 * labeled alternative in `FlowParser.classStatement`.
	 * @param ctx the parse tree
	 */
	exitClassRule?: (ctx: ClassRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `MultipleShapeData`
	 * labeled alternative in `FlowParser.shapeData`.
	 * @param ctx the parse tree
	 */
	enterMultipleShapeData?: (ctx: MultipleShapeDataContext) => void;
	/**
	 * Exit a parse tree produced by the `MultipleShapeData`
	 * labeled alternative in `FlowParser.shapeData`.
	 * @param ctx the parse tree
	 */
	exitMultipleShapeData?: (ctx: MultipleShapeDataContext) => void;

	/**
	 * Enter a parse tree produced by the `SingleShapeData`
	 * labeled alternative in `FlowParser.shapeData`.
	 * @param ctx the parse tree
	 */
	enterSingleShapeData?: (ctx: SingleShapeDataContext) => void;
	/**
	 * Exit a parse tree produced by the `SingleShapeData`
	 * labeled alternative in `FlowParser.shapeData`.
	 * @param ctx the parse tree
	 */
	exitSingleShapeData?: (ctx: SingleShapeDataContext) => void;

	/**
	 * Enter a parse tree produced by the `PlainCallbackName`
	 * labeled alternative in `FlowParser.callbackName`.
	 * @param ctx the parse tree
	 */
	enterPlainCallbackName?: (ctx: PlainCallbackNameContext) => void;
	/**
	 * Exit a parse tree produced by the `PlainCallbackName`
	 * labeled alternative in `FlowParser.callbackName`.
	 * @param ctx the parse tree
	 */
	exitPlainCallbackName?: (ctx: PlainCallbackNameContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeStringCallbackName`
	 * labeled alternative in `FlowParser.callbackName`.
	 * @param ctx the parse tree
	 */
	enterNodeStringCallbackName?: (ctx: NodeStringCallbackNameContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeStringCallbackName`
	 * labeled alternative in `FlowParser.callbackName`.
	 * @param ctx the parse tree
	 */
	exitNodeStringCallbackName?: (ctx: NodeStringCallbackNameContext) => void;

	/**
	 * Enter a parse tree produced by the `LinkStyleRule`
	 * labeled alternative in `FlowParser.linkStyleStatement`.
	 * @param ctx the parse tree
	 */
	enterLinkStyleRule?: (ctx: LinkStyleRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `LinkStyleRule`
	 * labeled alternative in `FlowParser.linkStyleStatement`.
	 * @param ctx the parse tree
	 */
	exitLinkStyleRule?: (ctx: LinkStyleRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClassDefRule`
	 * labeled alternative in `FlowParser.classDefStatement`.
	 * @param ctx the parse tree
	 */
	enterClassDefRule?: (ctx: ClassDefRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClassDefRule`
	 * labeled alternative in `FlowParser.classDefStatement`.
	 * @param ctx the parse tree
	 */
	exitClassDefRule?: (ctx: ClassDefRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `SingleStyledVertex`
	 * labeled alternative in `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	enterSingleStyledVertex?: (ctx: SingleStyledVertexContext) => void;
	/**
	 * Exit a parse tree produced by the `SingleStyledVertex`
	 * labeled alternative in `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	exitSingleStyledVertex?: (ctx: SingleStyledVertexContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeWithShapeDataAndAmp`
	 * labeled alternative in `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	enterNodeWithShapeDataAndAmp?: (ctx: NodeWithShapeDataAndAmpContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeWithShapeDataAndAmp`
	 * labeled alternative in `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	exitNodeWithShapeDataAndAmp?: (ctx: NodeWithShapeDataAndAmpContext) => void;

	/**
	 * Enter a parse tree produced by the `NodeWithAmp`
	 * labeled alternative in `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	enterNodeWithAmp?: (ctx: NodeWithAmpContext) => void;
	/**
	 * Exit a parse tree produced by the `NodeWithAmp`
	 * labeled alternative in `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	exitNodeWithAmp?: (ctx: NodeWithAmpContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickCallbackRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickCallbackRule?: (ctx: ClickCallbackRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickCallbackRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickCallbackRule?: (ctx: ClickCallbackRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickCallbackTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickCallbackTooltipRule?: (ctx: ClickCallbackTooltipRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickCallbackTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickCallbackTooltipRule?: (ctx: ClickCallbackTooltipRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickCallbackArgsRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickCallbackArgsRule?: (ctx: ClickCallbackArgsRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickCallbackArgsRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickCallbackArgsRule?: (ctx: ClickCallbackArgsRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickCallbackArgsTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickCallbackArgsTooltipRule?: (ctx: ClickCallbackArgsTooltipRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickCallbackArgsTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickCallbackArgsTooltipRule?: (ctx: ClickCallbackArgsTooltipRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickHrefRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickHrefRule?: (ctx: ClickHrefRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickHrefRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickHrefRule?: (ctx: ClickHrefRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickHrefTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickHrefTooltipRule?: (ctx: ClickHrefTooltipRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickHrefTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickHrefTooltipRule?: (ctx: ClickHrefTooltipRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickHrefTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickHrefTargetRule?: (ctx: ClickHrefTargetRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickHrefTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickHrefTargetRule?: (ctx: ClickHrefTargetRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickHrefTooltipTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickHrefTooltipTargetRule?: (ctx: ClickHrefTooltipTargetRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickHrefTooltipTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickHrefTooltipTargetRule?: (ctx: ClickHrefTooltipTargetRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickLinkRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickLinkRule?: (ctx: ClickLinkRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickLinkRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickLinkRule?: (ctx: ClickLinkRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickLinkTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickLinkTooltipRule?: (ctx: ClickLinkTooltipRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickLinkTooltipRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickLinkTooltipRule?: (ctx: ClickLinkTooltipRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickLinkTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickLinkTargetRule?: (ctx: ClickLinkTargetRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickLinkTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickLinkTargetRule?: (ctx: ClickLinkTargetRuleContext) => void;

	/**
	 * Enter a parse tree produced by the `ClickLinkTooltipTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickLinkTooltipTargetRule?: (ctx: ClickLinkTooltipTargetRuleContext) => void;
	/**
	 * Exit a parse tree produced by the `ClickLinkTooltipTargetRule`
	 * labeled alternative in `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickLinkTooltipTargetRule?: (ctx: ClickLinkTooltipTargetRuleContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.start`.
	 * @param ctx the parse tree
	 */
	enterStart?: (ctx: StartContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.start`.
	 * @param ctx the parse tree
	 */
	exitStart?: (ctx: StartContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.document`.
	 * @param ctx the parse tree
	 */
	enterDocument?: (ctx: DocumentContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.document`.
	 * @param ctx the parse tree
	 */
	exitDocument?: (ctx: DocumentContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	enterLine?: (ctx: LineContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.line`.
	 * @param ctx the parse tree
	 */
	exitLine?: (ctx: LineContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	enterGraphConfig?: (ctx: GraphConfigContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.graphConfig`.
	 * @param ctx the parse tree
	 */
	exitGraphConfig?: (ctx: GraphConfigContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirection?: (ctx: DirectionContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirection?: (ctx: DirectionContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	enterStatement?: (ctx: StatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.statement`.
	 * @param ctx the parse tree
	 */
	exitStatement?: (ctx: StatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	enterVertexStatement?: (ctx: VertexStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.vertexStatement`.
	 * @param ctx the parse tree
	 */
	exitVertexStatement?: (ctx: VertexStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	enterNode?: (ctx: NodeContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.node`.
	 * @param ctx the parse tree
	 */
	exitNode?: (ctx: NodeContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.styledVertex`.
	 * @param ctx the parse tree
	 */
	enterStyledVertex?: (ctx: StyledVertexContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.styledVertex`.
	 * @param ctx the parse tree
	 */
	exitStyledVertex?: (ctx: StyledVertexContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	enterVertex?: (ctx: VertexContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.vertex`.
	 * @param ctx the parse tree
	 */
	exitVertex?: (ctx: VertexContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	enterLink?: (ctx: LinkContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.link`.
	 * @param ctx the parse tree
	 */
	exitLink?: (ctx: LinkContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	enterLinkStatement?: (ctx: LinkStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.linkStatement`.
	 * @param ctx the parse tree
	 */
	exitLinkStatement?: (ctx: LinkStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.text`.
	 * @param ctx the parse tree
	 */
	enterText?: (ctx: TextContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.text`.
	 * @param ctx the parse tree
	 */
	exitText?: (ctx: TextContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	enterTextToken?: (ctx: TextTokenContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.textToken`.
	 * @param ctx the parse tree
	 */
	exitTextToken?: (ctx: TextTokenContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.idString`.
	 * @param ctx the parse tree
	 */
	enterIdString?: (ctx: IdStringContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.idString`.
	 * @param ctx the parse tree
	 */
	exitIdString?: (ctx: IdStringContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	enterEdgeText?: (ctx: EdgeTextContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.edgeText`.
	 * @param ctx the parse tree
	 */
	exitEdgeText?: (ctx: EdgeTextContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.edgeTextToken`.
	 * @param ctx the parse tree
	 */
	enterEdgeTextToken?: (ctx: EdgeTextTokenContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.edgeTextToken`.
	 * @param ctx the parse tree
	 */
	exitEdgeTextToken?: (ctx: EdgeTextTokenContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.arrowText`.
	 * @param ctx the parse tree
	 */
	enterArrowText?: (ctx: ArrowTextContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.arrowText`.
	 * @param ctx the parse tree
	 */
	exitArrowText?: (ctx: ArrowTextContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	enterSubgraphStatement?: (ctx: SubgraphStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.subgraphStatement`.
	 * @param ctx the parse tree
	 */
	exitSubgraphStatement?: (ctx: SubgraphStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.accessibilityStatement`.
	 * @param ctx the parse tree
	 */
	enterAccessibilityStatement?: (ctx: AccessibilityStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.accessibilityStatement`.
	 * @param ctx the parse tree
	 */
	exitAccessibilityStatement?: (ctx: AccessibilityStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.styleStatement`.
	 * @param ctx the parse tree
	 */
	enterStyleStatement?: (ctx: StyleStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.styleStatement`.
	 * @param ctx the parse tree
	 */
	exitStyleStatement?: (ctx: StyleStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.linkStyleStatement`.
	 * @param ctx the parse tree
	 */
	enterLinkStyleStatement?: (ctx: LinkStyleStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.linkStyleStatement`.
	 * @param ctx the parse tree
	 */
	exitLinkStyleStatement?: (ctx: LinkStyleStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.classDefStatement`.
	 * @param ctx the parse tree
	 */
	enterClassDefStatement?: (ctx: ClassDefStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.classDefStatement`.
	 * @param ctx the parse tree
	 */
	exitClassDefStatement?: (ctx: ClassDefStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.classStatement`.
	 * @param ctx the parse tree
	 */
	enterClassStatement?: (ctx: ClassStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.classStatement`.
	 * @param ctx the parse tree
	 */
	exitClassStatement?: (ctx: ClassStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	enterClickStatement?: (ctx: ClickStatementContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.clickStatement`.
	 * @param ctx the parse tree
	 */
	exitClickStatement?: (ctx: ClickStatementContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.separator`.
	 * @param ctx the parse tree
	 */
	enterSeparator?: (ctx: SeparatorContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.separator`.
	 * @param ctx the parse tree
	 */
	exitSeparator?: (ctx: SeparatorContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.firstStmtSeparator`.
	 * @param ctx the parse tree
	 */
	enterFirstStmtSeparator?: (ctx: FirstStmtSeparatorContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.firstStmtSeparator`.
	 * @param ctx the parse tree
	 */
	exitFirstStmtSeparator?: (ctx: FirstStmtSeparatorContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.spaceList`.
	 * @param ctx the parse tree
	 */
	enterSpaceList?: (ctx: SpaceListContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.spaceList`.
	 * @param ctx the parse tree
	 */
	exitSpaceList?: (ctx: SpaceListContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.textNoTags`.
	 * @param ctx the parse tree
	 */
	enterTextNoTags?: (ctx: TextNoTagsContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.textNoTags`.
	 * @param ctx the parse tree
	 */
	exitTextNoTags?: (ctx: TextNoTagsContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.shapeData`.
	 * @param ctx the parse tree
	 */
	enterShapeData?: (ctx: ShapeDataContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.shapeData`.
	 * @param ctx the parse tree
	 */
	exitShapeData?: (ctx: ShapeDataContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.styleDefinition`.
	 * @param ctx the parse tree
	 */
	enterStyleDefinition?: (ctx: StyleDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.styleDefinition`.
	 * @param ctx the parse tree
	 */
	exitStyleDefinition?: (ctx: StyleDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.callbackName`.
	 * @param ctx the parse tree
	 */
	enterCallbackName?: (ctx: CallbackNameContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.callbackName`.
	 * @param ctx the parse tree
	 */
	exitCallbackName?: (ctx: CallbackNameContext) => void;

	/**
	 * Enter a parse tree produced by `FlowParser.callbackArgs`.
	 * @param ctx the parse tree
	 */
	enterCallbackArgs?: (ctx: CallbackArgsContext) => void;
	/**
	 * Exit a parse tree produced by `FlowParser.callbackArgs`.
	 * @param ctx the parse tree
	 */
	exitCallbackArgs?: (ctx: CallbackArgsContext) => void;
}

