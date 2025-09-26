import type { SequenceParserVisitor } from './generated/SequenceParserVisitor.js';
import {
  SequenceAST,
  SequenceStatement,
  ParticipantData,
  MessageData,
  NoteData,
  SequenceASTHelper,
} from './SequenceAST.js';

/**
 * AST-to-Code Generator for Sequence Diagrams
 *
 * This visitor traverses the ANTLR parse tree and reconstructs the original
 * sequence diagram code with proper line numbers and formatting.
 *
 * Main objective: Enable UI editing of rendered diagrams with AST updates
 * that can be regenerated back to code.
 *
 * Now also builds a structured AST for the hybrid editor approach.
 */
export class SequenceCodeGenerator implements SequenceParserVisitor<string> {
  private lines: string[] = [];
  private currentIndent = 0;
  private indentSize = 2;

  // AST building properties
  private ast: SequenceAST;
  private currentIndex = 0;

  constructor() {
    // Initialize with empty lines array
    this.lines = [];
    // Initialize AST
    this.ast = SequenceASTHelper.createEmpty();
    this.currentIndex = 0;
  }

  /**
   * Generate code from the parse tree
   */
  generateCode(tree: any): { code: string; lines: string[]; ast: SequenceAST } {
    this.lines = [];
    this.currentIndent = 0;
    this.ast = SequenceASTHelper.createEmpty();
    this.currentIndex = 0;

    console.log('🎯 Starting code generation with AST building');

    // Visit the tree to generate code and build AST
    this.visit(tree);

    // Join lines and return both full code, line array, and AST
    const code = this.lines.join('\n');

    console.log('✅ Code generation complete:', {
      lines: this.lines.length,
      statements: this.ast.statements.length,
    });

    return {
      code,
      lines: [...this.lines], // Return copy of lines array
      ast: this.ast, // Return the built AST
    };
  }

  /**
   * Get the current AST (for external access)
   */
  getAST(): SequenceAST {
    return this.ast;
  }

  /**
   * Add a line with current indentation
   */
  private addLine(text: string): void {
    const indent = ' '.repeat(this.currentIndent);
    this.lines.push(indent + text);
  }

  /**
   * Add a line without indentation
   */
  private addRawLine(text: string): void {
    this.lines.push(text);
  }

  /**
   * Increase indentation level
   */
  private indent(): void {
    this.currentIndent += this.indentSize;
  }

  /**
   * Decrease indentation level
   */
  private unindent(): void {
    this.currentIndent = Math.max(0, this.currentIndent - this.indentSize);
  }

  /**
   * Extract text from terminal nodes
   */
  private getTerminalText(ctx: any): string {
    if (!ctx) return '';

    // If it's a terminal node, return its text
    if (ctx.symbol?.text) {
      return ctx.symbol.text;
    }

    // If it has children, collect text from all terminal children
    if (ctx.children) {
      return ctx.children
        .map((child: any) => this.getTerminalText(child))
        .filter((text: string) => text.trim() !== '')
        .join(' ');
    }

    return '';
  }

  /**
   * Get text content from a context, handling both terminal and non-terminal nodes
   */
  private getContextText(ctx: any): string {
    if (!ctx) return '';

    // Use ANTLR's built-in getText() method which is most reliable
    if (ctx.getText) {
      return ctx.getText();
    }

    return this.getTerminalText(ctx);
  }

  /**
   * Simple approach: extract all text from the parse tree and reconstruct line by line
   * This is more reliable than trying to handle each rule type individually
   */
  private extractAllText(ctx: any): string[] {
    const lines: string[] = [];

    if (!ctx) return lines;

    // Get the full text content
    const fullText = ctx.getText ? ctx.getText() : '';

    if (fullText) {
      // Split by common sequence diagram patterns and clean up
      const rawLines = fullText.split(/\n+/);

      for (const line of rawLines) {
        const trimmed = line.trim();
        if (trimmed && trimmed !== 'sequenceDiagram') {
          lines.push(trimmed);
        }
      }
    }

    return lines;
  }

  // Default visit method
  visit(tree: any): string {
    if (!tree) return '';

    try {
      return tree.accept(this) || '';
    } catch (error) {
      console.error('Error visiting node:', error);
      return '';
    }
  }

  // Default visit methods
  visitChildren(node: any): string {
    if (!node || !node.children) {
      return '';
    }

    const results: string[] = [];
    for (const child of node.children) {
      const result = child.accept(this);
      if (result) {
        results.push(result);
      }
    }
    return results.join(' ');
  }

  visitTerminal(node: any): string {
    return node.symbol?.text || '';
  }

  visitErrorNode(_node: any): string {
    return '';
  }

  // Start rule - the root of the parse tree
  visitStart(ctx: any): string {
    // Proper visitor approach: use the AST structure
    console.log('🎯 visitStart: Starting AST traversal');

    // Add the header
    this.addRawLine('sequenceDiagram');

    // Visit header first (if any)
    if (ctx.header?.()) {
      this.visit(ctx.header());
    }

    // Visit document content
    if (ctx.document?.()) {
      this.visit(ctx.document());
    }

    console.log('📋 Final generated lines:', this.lines);
    return '';
  }

  // Header - handle front matter, comments, etc.
  visitHeader(ctx: any): string {
    // Process header directives, front matter, etc.
    if (ctx.children) {
      for (const child of ctx.children) {
        const text = this.getContextText(child);
        if (text && text.trim() !== '' && text !== '\n') {
          this.addRawLine(text);
        }
      }
    }
    return '';
  }

  // Document - main content
  visitDocument(ctx: any): string {
    this.visitChildren(ctx);
    return '';
  }

  // Line - individual lines in the document
  visitLine(ctx: any): string {
    this.visitChildren(ctx);
    return '';
  }

  // Statement - individual statements
  visitStatement(ctx: any): string {
    this.visitChildren(ctx);
    return '';
  }

  // Participant statement
  visitParticipantStatement(ctx: any): string {
    console.log('🎯 visitParticipantStatement:', ctx);

    // Use the simpler approach: get the full text and clean it up
    const fullText = ctx.getText ? ctx.getText() : '';
    console.log('  - Full participant text:', fullText);

    if (fullText) {
      let id = '';
      let alias = '';

      // Parse the participant pattern: participant + id + as + alias
      const participantMatch = fullText.match(/^participant(\w+)as(.+)$/);
      if (participantMatch) {
        [, id, alias] = participantMatch;
        alias = alias.trim();
        this.addLine(`participant ${id} as ${alias}`);
      } else {
        // Try simple participant without alias
        const simpleMatch = fullText.match(/^participant(\w+)$/);
        if (simpleMatch) {
          [, id] = simpleMatch;
          this.addLine(`participant ${id}`);
        } else {
          // Fallback: just use the text as-is with proper indentation
          this.addLine(fullText);
          return '';
        }
      }

      // Build AST entry
      const participantData: ParticipantData = { id, alias: alias || undefined };
      this.ast.statements.push({
        type: 'participant',
        originalIndex: this.currentIndex++,
        data: participantData,
        sourceTokens: { start: ctx.start, stop: ctx.stop },
      });

      console.log('📝 Added participant to AST:', participantData);
    }

    return '';
  }

  // Create statement
  visitCreateStatement(ctx: any): string {
    console.log('🎯 visitCreateStatement:', ctx);
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Destroy statement
  visitDestroyStatement(ctx: any): string {
    console.log('🎯 visitDestroyStatement:', ctx);
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Signal statement (messages between participants)
  visitSignalStatement(ctx: any): string {
    console.log('🎯 visitSignalStatement:', ctx);

    // Use the simpler approach: get the full text and clean it up
    const fullText = ctx.getText ? ctx.getText() : '';
    console.log('  - Full signal text:', fullText);

    if (fullText) {
      // Parse the signal pattern: from + arrow + to + : + message
      const signalMatch = fullText.match(/^(\w+)(->|-->>|->>|-->)(\w+):(.+)$/);
      if (signalMatch) {
        const [, from, arrow, to, message] = signalMatch;
        const cleanMessage = message.trim();
        this.addLine(`${from}${arrow}${to}: ${cleanMessage}`);

        // Build AST entry
        const messageData: MessageData = { from, arrow, to, message: cleanMessage };
        this.ast.statements.push({
          type: 'message',
          originalIndex: this.currentIndex++,
          data: messageData,
          sourceTokens: { start: ctx.start, stop: ctx.stop },
        });

        console.log('📝 Added message to AST:', messageData);
      } else {
        // Fallback: just use the text as-is with proper indentation
        this.addLine(fullText);
      }
    }

    return '';
  }

  // Note statement
  visitNoteStatement(ctx: any): string {
    console.log('🎯 visitNoteStatement:', ctx);

    // Use the simpler approach: get the full text and clean it up
    const fullText = ctx.getText ? ctx.getText() : '';
    console.log('  - Full note text:', fullText);

    if (fullText) {
      // Parse the note pattern: Note + position + of + participant + : + message
      const noteMatch = fullText.match(/^Note(left|right|over)of(\w+):(.+)$/);
      if (noteMatch) {
        const [, position, participant, message] = noteMatch;
        this.addLine(`Note ${position} of ${participant}: ${message.trim()}`);
      } else {
        // Fallback: just use the text as-is with proper indentation
        this.addLine(fullText);
      }
    }

    return '';
  }

  // Loop block
  visitLoopBlock(ctx: any): string {
    console.log('🎯 visitLoopBlock:', ctx);

    // Use the simpler approach: get the full text and extract loop condition
    const fullText = ctx.getText ? ctx.getText() : '';
    console.log('  - Full loop text:', fullText);

    if (fullText) {
      // Extract the loop condition - everything between "loop" and the first statement
      const loopMatch = fullText.match(/^loop([^]*?)(?=\w+(?:->|-->>|->>|-->)|$)/);
      if (loopMatch) {
        const condition = loopMatch[1].trim();
        this.addLine(`loop ${condition}`);
      } else {
        this.addLine('loop');
      }
    }

    this.indent();

    // Visit children (content inside loop)
    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Opt block
  visitOptBlock(ctx: any): string {
    const optText = this.getContextText(ctx);
    const optMatch = optText.match(/opt\s+(.+?)(?=\s|$)/);
    const condition = optMatch ? optMatch[1] : '';

    this.addLine(`opt ${condition}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Alt block
  visitAltBlock(ctx: any): string {
    const altText = this.getContextText(ctx);
    const altMatch = altText.match(/alt\s+(.+?)(?=\s|$)/);
    const condition = altMatch ? altMatch[1] : '';

    this.addLine(`alt ${condition}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Else section within alt block
  visitElseSection(ctx: any): string {
    this.unindent();

    const elseText = this.getContextText(ctx);
    const elseMatch = elseText.match(/else\s+(.+?)(?=\s|$)/);
    const condition = elseMatch ? elseMatch[1] : '';

    this.addLine(`else ${condition}`);
    this.indent();

    this.visitChildren(ctx);
    return '';
  }

  // Par block
  visitParBlock(ctx: any): string {
    const parText = this.getContextText(ctx);
    const parMatch = parText.match(/par\s+(.+?)(?=\s|$)/);
    const condition = parMatch ? parMatch[1] : '';

    this.addLine(`par ${condition}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // And section within par block
  visitAndSection(ctx: any): string {
    this.unindent();

    const andText = this.getContextText(ctx);
    const andMatch = andText.match(/and\s+(.+?)(?=\s|$)/);
    const condition = andMatch ? andMatch[1] : '';

    this.addLine(`and ${condition}`);
    this.indent();

    this.visitChildren(ctx);
    return '';
  }

  // Rect block
  visitRectBlock(ctx: any): string {
    const rectText = this.getContextText(ctx);
    const rectMatch = rectText.match(/rect\s+(.+?)(?=\s|$)/);
    const style = rectMatch ? rectMatch[1] : '';

    this.addLine(`rect ${style}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Box block
  visitBoxBlock(ctx: any): string {
    const boxText = this.getContextText(ctx);
    const boxMatch = boxText.match(/box\s+(.+?)(?=\s|$)/);
    const label = boxMatch ? boxMatch[1] : '';

    this.addLine(`box ${label}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Break block
  visitBreakBlock(ctx: any): string {
    const breakText = this.getContextText(ctx);
    const breakMatch = breakText.match(/break\s+(.+?)(?=\s|$)/);
    const condition = breakMatch ? breakMatch[1] : '';

    this.addLine(`break ${condition}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Critical block
  visitCriticalBlock(ctx: any): string {
    const criticalText = this.getContextText(ctx);
    const criticalMatch = criticalText.match(/critical\s+(.+?)(?=\s|$)/);
    const condition = criticalMatch ? criticalMatch[1] : '';

    this.addLine(`critical ${condition}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Option section within critical block
  visitOptionSection(ctx: any): string {
    this.unindent();

    const optionText = this.getContextText(ctx);
    const optionMatch = optionText.match(/option\s+(.+?)(?=\s|$)/);
    const condition = optionMatch ? optionMatch[1] : '';

    this.addLine(`option ${condition}`);
    this.indent();

    this.visitChildren(ctx);
    return '';
  }

  // ParOver block
  visitParOverBlock(ctx: any): string {
    const parOverText = this.getContextText(ctx);
    const parOverMatch = parOverText.match(/par\s+over\s+(.+?)(?=\s|$)/);
    const participants = parOverMatch ? parOverMatch[1] : '';

    this.addLine(`par over ${participants}`);
    this.indent();

    this.visitChildren(ctx);

    this.unindent();
    this.addLine('end');
    return '';
  }

  // Links statement
  visitLinksStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Link statement
  visitLinkStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Properties statement
  visitPropertiesStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Details statement
  visitDetailsStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Activation statement (activate/deactivate)
  visitActivationStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Autonumber statement
  visitAutonumberStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Title statement
  visitTitleStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Legacy title statement
  visitLegacyTitleStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Accessibility title statement
  visitAccTitleStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Accessibility description statement
  visitAccDescrStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Accessibility multiline description statement
  visitAccDescrMultilineStatement(ctx: any): string {
    const text = this.getContextText(ctx);
    this.addLine(text);
    return '';
  }

  // Additional visitor methods for completeness
  visitActorWithConfig(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitConfigObject(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitSignaltype(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitText2(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitRestOfLine(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitAltSections(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitParSections(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitOptionSections(ctx: any): string {
    return this.visitChildren(ctx);
  }

  visitActor(ctx: any): string {
    return this.visitChildren(ctx);
  }
}
