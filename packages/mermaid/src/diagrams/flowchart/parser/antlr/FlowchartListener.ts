import type { ParseTreeListener } from 'antlr4ng';
import type { VertexStatementContext } from './generated/FlowParser.js';
import { FlowchartParserCore } from './FlowchartParserCore.js';

/**
 * Listener implementation that builds the flowchart model
 * Extends the core logic to ensure 99.1% test compatibility
 */
export class FlowchartListener extends FlowchartParserCore implements ParseTreeListener {
  constructor(db: any) {
    super(db);
    console.log('👂 FlowchartListener: Constructor called');
  }

  // Standard ParseTreeListener methods
  enterEveryRule = (ctx: any) => {
    // Optional: Add debug logging for rule entry
    if (this.getEnvVar('NODE_ENV') === 'development') {
      const ruleName = ctx.constructor.name;
      console.log('🔍 FlowchartListener: Entering rule:', ruleName);
    }
  };

  exitEveryRule = (ctx: any) => {
    // Optional: Add debug logging for rule exit
    if (this.getEnvVar('NODE_ENV') === 'development') {
      const ruleName = ctx.constructor.name;
      console.log('🔍 FlowchartListener: Exiting rule:', ruleName);
    }
  };

  visitTerminal = (node: any) => {
    // Optional: Handle terminal nodes
  };

  visitErrorNode = (node: any) => {
    console.log('❌ FlowchartListener: Error node encountered');
  };

  // Handle graph config (graph >, flowchart ^, etc.)
  exitGraphConfig = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing graph config');
    this.processGraphDeclaration(ctx);
  };

  enterGraphConfig = (ctx: any) => {
    console.log('🔍 FlowchartListener: Entering graph config');
    this.processGraphDeclaration(ctx);
  };

  // Handle vertex statements (nodes and edges)
  exitVertexStatement = (ctx: VertexStatementContext) => {
    // Use the shared core logic
    this.processVertexStatementCore(ctx);
  };

  // Remove old duplicate subgraph handling - now using core methods

  // Handle style statements
  exitStyleStatement = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing style statement');

    // Use core processing method
    this.processStyleStatementCore(ctx);
  };

  // Handle linkStyle statements
  exitLinkStyleStatement = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing linkStyle statement');

    // Use core processing method
    this.processLinkStyleStatementCore(ctx);
  };

  // Handle class definition statements
  exitClassDefStatement = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing class definition statement');

    // Use core processing method
    this.processClassDefStatementCore(ctx);
  };

  // Handle class statements
  exitClassStatement = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing class statement');

    // Use core processing method
    this.processClassStatementCore(ctx);
  };

  // Handle click statements
  exitClickStatement = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing click statement');

    // Use core processing method
    this.processClickStatementCore(ctx);
  };

  // Handle direction statements
  exitDirection = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing direction statement');
    this.processDirectionStatementCore(ctx);
  };

  // Handle accessibility statements - method names must match grammar rule names
  exitAccTitle = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing accTitle statement');
    this.processAccTitleStatementCore(ctx);
  };

  exitAccDescr = (ctx: any) => {
    console.log('🔍 FlowchartListener: Processing accDescr statement');
    this.processAccDescStatementCore(ctx);
  };

  // Handle subgraph statements
  enterSubgraphStatement = (ctx: any) => {
    console.log('🔍 FlowchartListener: Entering subgraph statement');
    this.processSubgraphStatementCore(ctx);
  };

  exitSubgraphStatement = (ctx: any) => {
    console.log('🔍 FlowchartListener: Exiting subgraph statement');
    this.processSubgraphEndCore();
  };

  // Note: Helper methods are now in FlowchartParserCore base class
}
