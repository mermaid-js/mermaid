import type { SequenceParserVisitor } from './generated/SequenceParserVisitor.js';
import { SequenceParserCore } from './SequenceParserCore.js';

/**
 * Visitor implementation that builds the sequence diagram model
 * Uses the same core logic as the Listener for compatibility
 */
export class SequenceVisitor extends SequenceParserCore implements SequenceParserVisitor<any> {
  private visitCount = 0;
  private performanceLog: { [key: string]: { count: number; totalTime: number } } = {};

  constructor(db: any) {
    super(db);
    // Only log for debug mode
    if (this.getEnvVar('ANTLR_DEBUG') === 'true') {
      // eslint-disable-next-line no-console
      console.log('🎯 SequenceVisitor: Constructor called');
    }
  }

  // Default visit method
  visit(tree: any): any {
    this.visitCount++;
    const startTime = performance.now();

    try {
      const result = tree.accept(this);

      // Performance tracking for debug mode
      if (this.getEnvVar('ANTLR_DEBUG') === 'true') {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const ruleName = tree.constructor.name;

        if (!this.performanceLog[ruleName]) {
          this.performanceLog[ruleName] = { count: 0, totalTime: 0 };
        }
        this.performanceLog[ruleName].count++;
        this.performanceLog[ruleName].totalTime += duration;
      }

      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ SequenceVisitor: Error visiting node:', error);
      throw error;
    }
  }

  // Default visit methods
  visitChildren(node: any): any {
    if (!node || !node.children) {
      return null;
    }

    let result = null;
    for (const child of node.children) {
      const childResult = child.accept(this);
      if (childResult !== null) {
        result = childResult;
      }
    }
    return result;
  }

  visitTerminal(_node: any): any {
    return null;
  }

  visitErrorNode(_node: any): any {
    // eslint-disable-next-line no-console
    console.log('❌ SequenceVisitor: Error node encountered');
    // Throw error to match Jison parser behavior for syntax errors
    throw new Error('Syntax error in sequence diagram');
  }

  // Loop block visitors
  visitLoopBlock(ctx: any): any {
    this.processLoopBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processLoopBlockExit();
    return null;
  }

  // Participant statement visitors
  visitParticipantStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processParticipantStatement(ctx);
    return null;
  }

  // Create statement visitors
  visitCreateStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processCreateStatement(ctx);
    return null;
  }

  // Destroy statement visitors
  visitDestroyStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processDestroyStatement(ctx);
    return null;
  }

  // Opt block visitors
  visitOptBlock(ctx: any): any {
    this.processOptBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processOptBlockExit();
    return null;
  }

  // Alt block visitors
  visitAltBlock(ctx: any): any {
    this.processAltBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processAltBlockExit();
    return null;
  }

  visitElseSection(ctx: any): any {
    this.processElseSection(ctx);
    this.visitChildren(ctx);
    return null;
  }

  // Par block visitors
  visitParBlock(ctx: any): any {
    this.processParBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processParBlockExit();
    return null;
  }

  visitAndSection(ctx: any): any {
    this.processAndSection(ctx);
    this.visitChildren(ctx);
    return null;
  }

  // ParOver block visitors
  visitParOverBlock(ctx: any): any {
    this.processParOverBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processParOverBlockExit();
    return null;
  }

  // Rect block visitors
  visitRectBlock(ctx: any): any {
    this.processRectBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processRectBlockExit();
    return null;
  }

  // Box block visitors
  visitBoxBlock(ctx: any): any {
    this.processBoxBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processBoxBlockExit();
    return null;
  }

  // Break block visitors
  visitBreakBlock(ctx: any): any {
    this.processBreakBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processBreakBlockExit();
    return null;
  }

  // Critical block visitors
  visitCriticalBlock(ctx: any): any {
    this.processCriticalBlockEnter(ctx);
    this.visitChildren(ctx);
    this.processCriticalBlockExit();
    return null;
  }

  visitOptionSection(ctx: any): any {
    this.processOptionSection(ctx);
    this.visitChildren(ctx);
    return null;
  }

  // Signal statement visitors
  visitSignalStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processSignalStatement(ctx);
    return null;
  }

  // Note statement visitors
  visitNoteStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processNoteStatement(ctx);
    return null;
  }

  // Links statement visitors
  visitLinksStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processLinksStatement(ctx);
    return null;
  }

  // Link statement visitors
  visitLinkStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processLinkStatement(ctx);
    return null;
  }

  // Properties statement visitors
  visitPropertiesStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processPropertiesStatement(ctx);
    return null;
  }

  // Details statement visitors
  visitDetailsStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processDetailsStatement(ctx);
    return null;
  }

  // Activation statement visitors
  visitActivationStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processActivationStatement(ctx);
    return null;
  }

  // Autonumber statement visitors
  visitAutonumberStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processAutonumberStatement(ctx);
    return null;
  }

  // Title statement visitors
  visitTitleStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processTitleStatement(ctx);
    return null;
  }

  // Legacy title statement visitors
  visitLegacyTitleStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processLegacyTitleStatement(ctx);
    return null;
  }

  // Accessibility title statement visitors
  visitAccTitleStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processAccTitleStatement(ctx);
    return null;
  }

  // Accessibility description statement visitors
  visitAccDescrStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processAccDescrStatement(ctx);
    return null;
  }

  // Accessibility multiline description statement visitors
  visitAccDescrMultilineStatement(ctx: any): any {
    this.visitChildren(ctx);
    this.processAccDescrMultilineStatement(ctx);
    return null;
  }

  // Default visitors for other rules
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

  visitActorWithConfig(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitConfigObject(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitSignaltype(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitText2(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitRestOfLine(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitAltSections(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitParSections(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitOptionSections(ctx: any): any {
    return this.visitChildren(ctx);
  }

  visitActor(ctx: any): any {
    return this.visitChildren(ctx);
  }
}
