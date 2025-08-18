/**
 * ANTLR Visitor Implementation for Flowchart Parser
 *
 * This visitor implements semantic actions to generate the same AST/data structures
 * as the existing Jison parser by calling FlowDB methods during parse tree traversal.
 */

import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import { FlowVisitor as IFlowVisitor } from './generated/src/diagrams/flowchart/parser/FlowVisitor';
import { FlowDB } from '../flowDb';
import type { FlowText } from '../types';

// Import all the context types from generated parser
import {
  StartContext,
  GraphConfigContext,
  DocumentContext,
  LineContext,
  StatementContext,
  VertexStatementContext,
  NodeContext,
  StyledVertexContext,
  VertexContext,
  TextContext,
  DirectionContext,
  AccessibilityStatementContext,
  StyleStatementContext,
  LinkStyleStatementContext,
  ClassDefStatementContext,
  ClassStatementContext,
  ClickStatementContext,
  LinkContext,
  EdgeContext,
  EdgeTextContext,
  ArrowTypeContext,
  SeparatorContext,
  FirstStmtSeparatorContext,
  SpaceListContext,
  TextTokenContext,
  TextNoTagsContext,
  TextNoTagsTokenContext,
  IdStringContext,
  StylesOptContext,
  StylesContext,
  StyleContext,
  LinkTargetContext,
  ShapeDataContext,
} from './generated/src/diagrams/flowchart/parser/FlowParser';

/**
 * FlowVisitor implements semantic actions for ANTLR flowchart parser
 *
 * This visitor traverses the ANTLR parse tree and calls appropriate FlowDB methods
 * to build the same data structures as the Jison parser.
 */
export class FlowVisitor extends AbstractParseTreeVisitor<any> implements IFlowVisitor<any> {
  private db: FlowDB;

  constructor(db: FlowDB) {
    super();
    this.db = db;
  }

  /**
   * Entry point - start rule
   */
  visitStart(ctx: StartContext): any {
    // Visit graph configuration first
    if (ctx.graphConfig()) {
      this.visit(ctx.graphConfig());
    }

    // Visit document content
    if (ctx.document()) {
      const result = this.visit(ctx.document());
      return result;
    }

    return [];
  }

  /**
   * Graph configuration - handles graph/flowchart declarations and directions
   */
  visitGraphConfig(ctx: GraphConfigContext): any {
    // Handle direction if present
    if (ctx.direction()) {
      const direction = this.visit(ctx.direction());
      this.db.setDirection(direction);
    }

    return null;
  }

  /**
   * Document - collection of statements
   */
  visitDocument(ctx: DocumentContext): any {
    const statements: any[] = [];

    // Process all lines in the document
    for (const lineCtx of ctx.line()) {
      const lineResult = this.visit(lineCtx);
      if (lineResult && Array.isArray(lineResult) && lineResult.length > 0) {
        statements.push(...lineResult);
      } else if (lineResult) {
        statements.push(lineResult);
      }
    }

    return statements;
  }

  /**
   * Line - individual line in document
   */
  visitLine(ctx: LineContext): any {
    if (ctx.statement()) {
      return this.visit(ctx.statement());
    }

    // Empty lines, semicolons, newlines, spaces, EOF return empty
    return [];
  }

  /**
   * Statement - main statement types
   */
  visitStatement(ctx: StatementContext): any {
    if (ctx.vertexStatement()) {
      const result = this.visit(ctx.vertexStatement());
      return result?.nodes || [];
    }

    if (ctx.styleStatement()) {
      this.visit(ctx.styleStatement());
      return [];
    }

    if (ctx.linkStyleStatement()) {
      this.visit(ctx.linkStyleStatement());
      return [];
    }

    if (ctx.classDefStatement()) {
      this.visit(ctx.classDefStatement());
      return [];
    }

    if (ctx.classStatement()) {
      this.visit(ctx.classStatement());
      return [];
    }

    if (ctx.clickStatement()) {
      this.visit(ctx.clickStatement());
      return [];
    }

    if (ctx.accessibilityStatement()) {
      this.visit(ctx.accessibilityStatement());
      return [];
    }

    if (ctx.direction()) {
      const direction = this.visit(ctx.direction());
      this.db.setDirection(direction);
      return [];
    }

    // Handle subgraph statements
    if (ctx.SUBGRAPH() && ctx.END()) {
      const textNoTags = ctx.textNoTags() ? this.visit(ctx.textNoTags()) : undefined;
      const text = ctx.text() ? this.visit(ctx.text()) : textNoTags;
      const document = ctx.document() ? this.visit(ctx.document()) : [];

      const subGraphId = this.db.addSubGraph(textNoTags, document, text);
      return [];
    }

    return [];
  }

  /**
   * Vertex statement - node definitions and connections
   */
  visitVertexStatement(ctx: VertexStatementContext): any {
    // Handle different vertex statement patterns
    if (ctx.node() && ctx.link() && ctx.node().length === 2) {
      // Pattern: node link node (A-->B)
      const startNodes = this.visit(ctx.node(0));
      const endNodes = this.visit(ctx.node(1));
      const linkData = this.visit(ctx.link());

      this.db.addLink(startNodes, endNodes, linkData);

      return {
        stmt: [...startNodes, ...endNodes],
        nodes: [...startNodes, ...endNodes],
      };
    }

    if (ctx.node() && ctx.node().length === 1) {
      // Pattern: single node or node with shape data
      const nodes = this.visit(ctx.node(0));

      if (ctx.shapeData()) {
        const shapeData = this.visit(ctx.shapeData());
        // Apply shape data to the last node
        const lastNode = nodes[nodes.length - 1];
        this.db.addVertex(
          lastNode,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          shapeData
        );

        return {
          stmt: nodes,
          nodes: nodes,
          shapeData: shapeData,
        };
      }

      return {
        stmt: nodes,
        nodes: nodes,
      };
    }

    return { stmt: [], nodes: [] };
  }

  /**
   * Node - collection of styled vertices
   */
  visitNode(ctx: NodeContext): any {
    const nodes: string[] = [];

    // Process all styled vertices
    for (const styledVertexCtx of ctx.styledVertex()) {
      const vertex = this.visit(styledVertexCtx);
      nodes.push(vertex);
    }

    // Handle shape data for intermediate nodes
    if (ctx.shapeData()) {
      for (let i = 0; i < ctx.shapeData().length; i++) {
        const shapeData = this.visit(ctx.shapeData(i));
        if (i < nodes.length - 1) {
          this.db.addVertex(
            nodes[i],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            shapeData
          );
        }
      }
    }

    return nodes;
  }

  /**
   * Styled vertex - vertex with optional style class
   */
  visitStyledVertex(ctx: StyledVertexContext): any {
    const vertex = this.visit(ctx.vertex());

    if (ctx.idString()) {
      const className = this.visit(ctx.idString());
      this.db.setClass(vertex, className);
    }

    return vertex;
  }

  /**
   * Vertex - node with shape and text
   */
  visitVertex(ctx: VertexContext): any {
    const id = this.visit(ctx.idString());

    // Handle different vertex shapes
    if (ctx.SQS() && ctx.SQE()) {
      // Square brackets [text]
      const text = ctx.text() ? this.visit(ctx.text()) : undefined;
      this.db.addVertex(id, text, 'square');
    } else if (ctx.PS() && ctx.PE() && ctx.PS().length === 2) {
      // Double parentheses ((text))
      const text = ctx.text() ? this.visit(ctx.text()) : undefined;
      this.db.addVertex(id, text, 'circle');
    } else if (ctx.PS() && ctx.PE()) {
      // Single parentheses (text)
      const text = ctx.text() ? this.visit(ctx.text()) : undefined;
      this.db.addVertex(id, text, 'round');
    } else if (ctx.DIAMOND_START() && ctx.DIAMOND_STOP()) {
      // Diamond {text}
      const text = ctx.text() ? this.visit(ctx.text()) : undefined;
      this.db.addVertex(id, text, 'diamond');
    } else {
      // Default vertex - just the id
      this.db.addVertex(id, undefined, undefined);
    }

    return id;
  }

  /**
   * Text - text content with type
   */
  visitText(ctx: TextContext): FlowText {
    let textContent = '';
    let textType = 'text';

    // Collect all text tokens
    for (const tokenCtx of ctx.textToken()) {
      textContent += this.visit(tokenCtx);
    }

    // Handle string literals
    if (ctx.STR()) {
      textContent = ctx.STR().text;
      textType = 'string';
    }

    // Handle markdown strings
    if (ctx.MD_STR()) {
      textContent = ctx.MD_STR().text;
      textType = 'markdown';
    }

    return {
      text: textContent,
      type: textType as 'text',
    };
  }

  /**
   * Direction - graph direction
   */
  visitDirection(ctx: DirectionContext): string {
    if (ctx.DIRECTION_TD()) return 'TD';
    if (ctx.DIRECTION_LR()) return 'LR';
    if (ctx.DIRECTION_RL()) return 'RL';
    if (ctx.DIRECTION_BT()) return 'BT';
    if (ctx.DIRECTION_TB()) return 'TB';
    if (ctx.TEXT()) return ctx.TEXT().text;

    return 'TD'; // default
  }

  /**
   * Link - edge between nodes
   */
  visitLink(ctx: LinkContext): any {
    const linkData: any = {};

    if (ctx.edgeText()) {
      const edgeText = this.visit(ctx.edgeText());
      linkData.text = edgeText;
    }

    if (ctx.arrowType()) {
      const arrowType = this.visit(ctx.arrowType());
      linkData.type = arrowType;
    }

    return linkData;
  }

  /**
   * Default visitor - handles simple text extraction
   */
  protected defaultResult(): any {
    return null;
  }

  /**
   * Aggregate results - combines child results
   */
  protected aggregateResult(aggregate: any, nextResult: any): any {
    if (nextResult === null || nextResult === undefined) {
      return aggregate;
    }
    if (aggregate === null || aggregate === undefined) {
      return nextResult;
    }
    return nextResult;
  }

  // Helper methods for common operations

  /**
   * Extract text content from terminal nodes
   */
  private extractText(ctx: any): string {
    if (!ctx) return '';
    if (typeof ctx.text === 'string') return ctx.text;
    if (ctx.getText) return ctx.getText();
    return '';
  }

  /**
   * Visit text tokens and combine them
   */
  visitTextToken(ctx: TextTokenContext): string {
    return this.extractText(ctx);
  }

  /**
   * Visit ID strings
   */
  visitIdString(ctx: IdStringContext): string {
    return this.extractText(ctx);
  }

  /**
   * Visit text without tags
   */
  visitTextNoTags(ctx: TextNoTagsContext): FlowText {
    let textContent = '';

    for (const tokenCtx of ctx.textNoTagsToken()) {
      textContent += this.visit(tokenCtx);
    }

    if (ctx.STR()) {
      textContent = ctx.STR().text;
    }

    if (ctx.MD_STR()) {
      textContent = ctx.MD_STR().text;
    }

    return {
      text: textContent,
      type: 'text',
    };
  }

  visitTextNoTagsToken(ctx: TextNoTagsTokenContext): string {
    return this.extractText(ctx);
  }

  /**
   * Style statement - applies styles to vertices
   */
  visitStyleStatement(ctx: StyleStatementContext): any {
    if (ctx.idString() && ctx.stylesOpt()) {
      const id = this.visit(ctx.idString());
      const styles = this.visit(ctx.stylesOpt());
      this.db.addVertex(id, undefined, undefined, styles);
    }
    return null;
  }

  /**
   * Link style statement - applies styles to edges
   */
  visitLinkStyleStatement(ctx: LinkStyleStatementContext): any {
    // Extract position and styles for link styling
    // Implementation depends on the specific grammar rules
    return null;
  }

  /**
   * Class definition statement
   */
  visitClassDefStatement(ctx: ClassDefStatementContext): any {
    if (ctx.idString() && ctx.stylesOpt()) {
      const className = this.visit(ctx.idString());
      const styles = this.visit(ctx.stylesOpt());
      this.db.addClass(className, styles);
    }
    return null;
  }

  /**
   * Class statement - applies class to nodes
   */
  visitClassStatement(ctx: ClassStatementContext): any {
    // Extract node IDs and class name to apply
    // Implementation depends on the specific grammar rules
    return null;
  }

  /**
   * Click statement - adds click events to nodes
   */
  visitClickStatement(ctx: ClickStatementContext): any {
    // Handle all click statement variants based on the rule context
    const nodeId = this.visit(ctx.idString());

    // Check which specific click rule this is
    if (ctx.constructor.name.includes('ClickCallback')) {
      return this.handleClickCallback(ctx, nodeId);
    } else if (ctx.constructor.name.includes('ClickHref')) {
      return this.handleClickHref(ctx, nodeId);
    } else if (ctx.constructor.name.includes('ClickLink')) {
      return this.handleClickLink(ctx, nodeId);
    }

    return null;
  }

  /**
   * Handle click callback variants
   */
  private handleClickCallback(ctx: any, nodeId: string): any {
    const callbackName = this.extractCallbackName(ctx);
    const callbackArgs = this.extractCallbackArgs(ctx);
    const tooltip = this.extractTooltip(ctx);

    // Call setClickEvent with appropriate parameters
    if (callbackArgs) {
      this.db.setClickEvent(nodeId, callbackName, callbackArgs);
    } else {
      this.db.setClickEvent(nodeId, callbackName);
    }

    // Add tooltip if present
    if (tooltip) {
      this.db.setTooltip(nodeId, tooltip);
    }

    return null;
  }

  /**
   * Handle click href variants
   */
  private handleClickHref(ctx: any, nodeId: string): any {
    const link = this.extractLink(ctx);
    const tooltip = this.extractTooltip(ctx);
    const target = this.extractTarget(ctx);

    // Call setLink with appropriate parameters
    if (target) {
      this.db.setLink(nodeId, link, target);
    } else {
      this.db.setLink(nodeId, link);
    }

    // Add tooltip if present
    if (tooltip) {
      this.db.setTooltip(nodeId, tooltip);
    }

    return null;
  }

  /**
   * Handle click link variants (direct string links)
   */
  private handleClickLink(ctx: any, nodeId: string): any {
    const link = this.extractLink(ctx);
    const tooltip = this.extractTooltip(ctx);
    const target = this.extractTarget(ctx);

    // Call setLink with appropriate parameters
    if (target) {
      this.db.setLink(nodeId, link, target);
    } else {
      this.db.setLink(nodeId, link);
    }

    // Add tooltip if present
    if (tooltip) {
      this.db.setTooltip(nodeId, tooltip);
    }

    return null;
  }

  /**
   * Extract callback name from context
   */
  private extractCallbackName(ctx: any): string {
    if (ctx.callbackName && ctx.callbackName()) {
      return this.visit(ctx.callbackName());
    }
    return '';
  }

  /**
   * Extract callback arguments from context
   */
  private extractCallbackArgs(ctx: any): string | undefined {
    if (ctx.callbackArgs && ctx.callbackArgs()) {
      const args = this.visit(ctx.callbackArgs());
      // Remove parentheses and return the inner content
      return args ? args.replace(/^\(|\)$/g, '') : undefined;
    }
    return undefined;
  }

  /**
   * Extract link URL from context
   */
  private extractLink(ctx: any): string {
    // Look for STR tokens that represent the link
    const strTokens = ctx.STR ? ctx.STR() : [];
    if (strTokens && strTokens.length > 0) {
      // Remove quotes from the string
      return strTokens[0].text.replace(/^"|"$/g, '');
    }
    return '';
  }

  /**
   * Extract tooltip from context
   */
  private extractTooltip(ctx: any): string | undefined {
    // Look for the second STR token which would be the tooltip
    const strTokens = ctx.STR ? ctx.STR() : [];
    if (strTokens && strTokens.length > 1) {
      // Remove quotes from the string
      return strTokens[1].text.replace(/^"|"$/g, '');
    }
    return undefined;
  }

  /**
   * Extract target from context
   */
  private extractTarget(ctx: any): string | undefined {
    if (ctx.LINK_TARGET && ctx.LINK_TARGET()) {
      return ctx.LINK_TARGET().text;
    }
    return undefined;
  }

  /**
   * Visit callback name
   */
  visitCallbackName(ctx: CallbackNameContext): string {
    if (ctx.TEXT()) {
      return ctx.TEXT().text;
    } else if (ctx.NODE_STRING()) {
      return ctx.NODE_STRING().text;
    }
    return '';
  }

  /**
   * Visit callback args
   */
  visitCallbackArgs(ctx: CallbackArgsContext): string {
    if (ctx.TEXT()) {
      return `(${ctx.TEXT().text})`;
    } else {
      return '()';
    }
  }

  /**
   * Accessibility statement - handles accTitle and accDescr
   */
  visitAccessibilityStatement(ctx: AccessibilityStatementContext): any {
    if (ctx.ACC_TITLE() && ctx.text()) {
      const title = this.visit(ctx.text());
      this.db.setAccTitle(title.text);
    }

    if (ctx.ACC_DESCR() && ctx.text()) {
      const description = this.visit(ctx.text());
      this.db.setAccDescription(description.text);
    }

    return null;
  }

  /**
   * Edge text - text on edges/links
   */
  visitEdgeText(ctx: EdgeTextContext): FlowText {
    if (ctx.text()) {
      return this.visit(ctx.text());
    }
    return { text: '', type: 'text' };
  }

  /**
   * Arrow type - determines edge/link type
   */
  visitArrowType(ctx: ArrowTypeContext): string {
    // Map ANTLR arrow tokens to link types
    if (ctx.ARROW_REGULAR()) return 'arrow_regular';
    if (ctx.ARROW_SIMPLE()) return 'arrow_simple';
    if (ctx.ARROW_BIDIRECTIONAL()) return 'arrow_bidirectional';
    if (ctx.ARROW_BIDIRECTIONAL_SIMPLE()) return 'arrow_bidirectional_simple';
    if (ctx.ARROW_THICK()) return 'arrow_thick';
    if (ctx.ARROW_DOTTED()) return 'arrow_dotted';

    return 'arrow_regular'; // default
  }

  /**
   * Styles optional - collection of style definitions
   */
  visitStylesOpt(ctx: StylesOptContext): string[] {
    if (ctx.styles()) {
      return this.visit(ctx.styles());
    }
    return [];
  }

  /**
   * Styles - collection of individual style definitions
   */
  visitStyles(ctx: StylesContext): string[] {
    const styles: string[] = [];

    for (const styleCtx of ctx.style()) {
      const style = this.visit(styleCtx);
      if (style) {
        styles.push(style);
      }
    }

    return styles;
  }

  /**
   * Style - individual style definition
   */
  visitStyle(ctx: StyleContext): string {
    return this.extractText(ctx);
  }

  /**
   * Shape data - metadata for node shapes
   */
  visitShapeData(ctx: ShapeDataContext): string {
    return this.extractText(ctx);
  }

  /**
   * Link target - target for clickable links
   */
  visitLinkTarget(ctx: LinkTargetContext): string {
    return this.extractText(ctx);
  }

  /**
   * Edge - connection between nodes
   */
  visitEdge(ctx: EdgeContext): any {
    // Handle edge patterns and types
    return this.visit(ctx.arrowType());
  }

  /**
   * Separator - statement separators
   */
  visitSeparator(ctx: SeparatorContext): any {
    return null; // Separators don't produce semantic content
  }

  /**
   * First statement separator
   */
  visitFirstStmtSeparator(ctx: FirstStmtSeparatorContext): any {
    return null; // Separators don't produce semantic content
  }

  /**
   * Space list - whitespace handling
   */
  visitSpaceList(ctx: SpaceListContext): any {
    return null; // Whitespace doesn't produce semantic content
  }
}
