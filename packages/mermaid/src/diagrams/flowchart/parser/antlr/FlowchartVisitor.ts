import type { FlowParserVisitor } from './generated/FlowParser.js';
import type { VertexStatementContext } from './generated/FlowParser.js';
import { FlowchartParserCore } from './FlowchartParserCore.js';

/**
 * Visitor implementation that builds the flowchart model
 * Uses the same core logic as the Listener for 99.1% test compatibility
 */
export class FlowchartVisitor extends FlowchartParserCore implements FlowParserVisitor<any> {
  private visitCount = 0;
  private vertexStatementCount = 0;
  private edgeCount = 0;
  private performanceLog: { [key: string]: { count: number; totalTime: number } } = {};

  constructor(db: any) {
    super(db);
    // Only log for debug mode
    if (process.env.ANTLR_DEBUG === 'true') {
      console.log('🎯 FlowchartVisitor: Constructor called');
    }
  }

  private logPerformance(methodName: string, startTime: number) {
    // Only track performance in debug mode to reduce overhead
    if (process.env.ANTLR_DEBUG === 'true') {
      const duration = performance.now() - startTime;
      if (!this.performanceLog[methodName]) {
        this.performanceLog[methodName] = { count: 0, totalTime: 0 };
      }
      this.performanceLog[methodName].count++;
      this.performanceLog[methodName].totalTime += duration;
    }
  }

  private printPerformanceReport() {
    console.log('📊 FlowchartVisitor Performance Report:');
    console.log(`  Total visits: ${this.visitCount}`);
    console.log(`  Vertex statements: ${this.vertexStatementCount}`);
    console.log(`  Edges processed: ${this.edgeCount}`);

    const sortedMethods = Object.entries(this.performanceLog)
      .sort(([, a], [, b]) => b.totalTime - a.totalTime)
      .slice(0, 10); // Top 10 slowest methods

    console.log('  Top time-consuming methods:');
    for (const [method, stats] of sortedMethods) {
      const avgTime = stats.totalTime / stats.count;
      console.log(
        `    ${method}: ${stats.totalTime.toFixed(2)}ms total (${stats.count} calls, ${avgTime.toFixed(2)}ms avg)`
      );
    }
  }

  // Default visitor methods
  visit(tree: any): any {
    // Only track performance in debug mode to reduce overhead
    const shouldTrackPerformance = process.env.ANTLR_DEBUG === 'true';
    const startTime = shouldTrackPerformance ? performance.now() : 0;

    this.visitCount++;
    const result = tree.accept(this);

    if (shouldTrackPerformance) {
      this.logPerformance('visit', startTime);
    }

    // Print performance report every 20,000 visits for huge diagrams (less frequent)
    if (this.visitCount % 20000 === 0) {
      console.log(`🔄 Progress: ${this.visitCount} visits completed`);
    }

    // Print final performance report after visiting the entire tree (only for root visit)
    if (
      shouldTrackPerformance &&
      this.visitCount > 1000 &&
      tree.constructor.name === 'StartContext'
    ) {
      this.printPerformanceReport();
    }

    return result;
  }

  visitChildren(node: any): any {
    // Only track performance in debug mode to reduce overhead
    const shouldTrackPerformance = process.env.ANTLR_DEBUG === 'true';
    const startTime = shouldTrackPerformance ? performance.now() : 0;

    let result = null;
    const n = node.getChildCount();
    for (let i = 0; i < n; i++) {
      const childResult = node.getChild(i).accept(this);
      if (childResult !== null) {
        result = childResult;
      }
    }

    if (shouldTrackPerformance) {
      this.logPerformance('visitChildren', startTime);
    }
    return result;
  }

  // Required visitor methods for terminal nodes and errors
  visitTerminal(node: any): any {
    return null;
  }

  visitErrorNode(node: any): any {
    console.log('❌ FlowchartVisitor: Error node encountered');
    return null;
  }

  // Additional required methods for the visitor interface
  defaultResult(): any {
    return null;
  }

  shouldVisitNextChild(node: any, currentResult: any): boolean {
    return true;
  }

  aggregateResult(aggregate: any, nextResult: any): any {
    return nextResult !== null ? nextResult : aggregate;
  }

  // Handle graph config (graph >, flowchart ^, etc.)
  visitGraphConfig(ctx: any): any {
    // Only log for debug mode - this is called frequently
    if (process.env.ANTLR_DEBUG === 'true') {
      console.log('🎯 FlowchartVisitor: Visiting graph config');
    }
    this.processGraphDeclaration(ctx);
    return this.visitChildren(ctx);
  }

  // Implement key visitor methods using the same logic as the Listener
  visitVertexStatement(ctx: VertexStatementContext): any {
    // Only track performance in debug mode to reduce overhead
    const shouldTrackPerformance = process.env.ANTLR_DEBUG === 'true';
    const startTime = shouldTrackPerformance ? performance.now() : 0;

    this.vertexStatementCount++;

    // Log progress for huge diagrams - less frequent logging
    if (this.vertexStatementCount % 10000 === 0) {
      console.log(`🔄 Progress: ${this.vertexStatementCount} vertex statements processed`);
    }

    // For left-recursive vertexStatement grammar, we need to visit children first
    // to process the chain in the correct order (A->B->C should process A first)
    const result = this.visitChildren(ctx);

    // Then process this vertex statement using core logic
    // This ensures identical behavior and test compatibility with Listener pattern
    this.processVertexStatementCore(ctx);

    this.logPerformance('visitVertexStatement', startTime);
    return result;
  }

  // Default implementation for all other visit methods
  visitStart(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitDocument(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitLine(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitStatement(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitStyleStatement(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting style statement');

    // Use core processing method
    this.processStyleStatementCore(ctx);

    return this.visitChildren(ctx);
  }

  visitLinkStyleStatement(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting linkStyle statement');

    // Use core processing method
    this.processLinkStyleStatementCore(ctx);

    return this.visitChildren(ctx);
  }

  visitClassStatement(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting class statement');

    // Use core processing method
    this.processClassStatementCore(ctx);

    return this.visitChildren(ctx);
  }

  visitClickStatement(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting click statement');

    // Use core processing method
    this.processClickStatementCore(ctx);

    return this.visitChildren(ctx);
  }

  // Handle direction statements
  visitDirection(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting direction statement');
    this.processDirectionStatementCore(ctx);
    return this.visitChildren(ctx);
  }

  // Handle accessibility statements - method names must match grammar rule names

  // Handle subgraph statements - matches Listener pattern logic
  visitSubgraphStatement(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting subgraph statement');

    // Handle subgraph entry using core method
    this.processSubgraphStatementCore(ctx);

    // Visit children
    const result = this.visitChildren(ctx);

    // Handle subgraph exit using core method
    this.processSubgraphEndCore();

    return result;
  }

  // Note: Helper methods are now in FlowchartParserCore base class

  // Add implementations for additional visitor methods (avoiding duplicates)
  visitStandaloneVertex(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitNode(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitStyledVertex(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitVertex(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitText(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitIdString(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitLink(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitLinkStatement(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitEdgeText(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitArrowText(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitShapeData(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitShapeDataContent(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitClassDefStatement(ctx: any): any {
    console.log('🔍 FlowchartVisitor: Processing class definition statement');

    // Use core processing method
    this.processClassDefStatementCore(ctx);

    return this.visitChildren(ctx);
  }

  visitStringLiteral(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitAccTitle(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting accTitle statement');
    this.processAccTitleStatementCore(ctx);
    return this.visitChildren(ctx);
  }

  visitAccDescr(ctx: any): any {
    console.log('🎯 FlowchartVisitor: Visiting accDescr statement');
    this.processAccDescStatementCore(ctx);
    return this.visitChildren(ctx);
  }

  visitNumList(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitStylesOpt(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitStyle(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitStyleComponent(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitAlphaNum(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitTextNoTags(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitIdStringToken(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitTextToken(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitTextNoTagsToken(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitEdgeTextToken(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitAlphaNumToken(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitKeywords(ctx: any): any {
    return this.visitChildren(ctx);
  }
}
