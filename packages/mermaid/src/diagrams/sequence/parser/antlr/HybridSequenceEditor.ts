import { CommonTokenStream } from 'antlr4ng';
import { HybridDiagramEditor } from './HybridDiagramEditor.js';
import { 
  SequenceAST, 
  SequenceStatement, 
  ParticipantData, 
  MessageData, 
  NoteData, 
  LoopData,
  SequenceASTHelper 
} from './SequenceAST.js';
import { createSequenceParser } from './antlr-parser.js';

/**
 * Hybrid editor specifically for sequence diagrams
 * Combines AST-based editing with TokenStreamRewriter for optimal performance
 */
export class HybridSequenceEditor extends HybridDiagramEditor<SequenceAST> {
  
  constructor(input: string) {
    super(input, 'sequence');
  }

  /**
   * Create ANTLR parser for sequence diagrams
   */
  protected createParser(input: string): { parser: any; tokenStream: CommonTokenStream } {
    console.log('🔧 Creating sequence diagram parser');
    return createSequenceParser(input);
  }

  /**
   * Build sequence-specific AST from parse tree
   */
  protected buildAST(parser: any): SequenceAST {
    console.log('🌳 Building sequence AST from parse tree');
    
    const builder = new SequenceASTBuilder();
    const parseTree = parser.start();
    
    // Visit the parse tree to build our AST
    builder.visit(parseTree);
    
    const ast = builder.getAST();
    console.log('✅ Sequence AST built:', SequenceASTHelper.getStatistics(ast));
    
    return ast;
  }

  /**
   * Regenerate sequence diagram code from AST
   */
  protected regenerateFromAST(): string {
    console.log('🔄 Regenerating sequence code from AST');
    
    let code = this.ast.header + '\n';
    
    // Sort statements by original index to maintain order
    const sortedStatements = [...this.ast.statements]
      .sort((a, b) => a.originalIndex - b.originalIndex);
    
    for (const stmt of sortedStatements) {
      const line = this.generateStatementCode(stmt);
      if (line) {
        code += '  ' + line + '\n';
      }
    }
    
    return code.trim();
  }

  /**
   * Generate code for a single statement
   */
  private generateStatementCode(stmt: SequenceStatement): string {
    switch (stmt.type) {
      case 'participant':
        const p = stmt.data as ParticipantData;
        return p.alias ? `participant ${p.id} as ${p.alias}` : `participant ${p.id}`;
      
      case 'message':
        const m = stmt.data as MessageData;
        return `${m.from}${m.arrow}${m.to}: ${m.message}`;
      
      case 'note':
        const n = stmt.data as NoteData;
        return `Note ${n.position} of ${n.participant}: ${n.message}`;
      
      case 'activate':
        return `activate ${(stmt.data as any).participant}`;
      
      case 'deactivate':
        return `deactivate ${(stmt.data as any).participant}`;
      
      case 'loop':
        const l = stmt.data as LoopData;
        // For now, simplified loop handling - would need more complex logic for nested statements
        return `loop ${l.condition}`;
      
      default:
        console.warn(`⚠️ Unknown statement type: ${stmt.type}`);
        return '';
    }
  }

  /**
   * Get statement count for strategy selection
   */
  protected getStatementCount(): number {
    return this.ast.statements.length;
  }

  // ========================================
  // High-level sequence diagram operations
  // ========================================

  /**
   * Add a new participant
   */
  addParticipant(id: string, alias?: string, afterIndex?: number): void {
    console.log(`👤 Adding participant: ${id}${alias ? ` as ${alias}` : ''}`);
    
    // Check if participant already exists
    if (SequenceASTHelper.findParticipant(this.ast, id)) {
      console.warn(`⚠️ Participant ${id} already exists`);
      return;
    }
    
    const participantData: ParticipantData = { id, alias };
    
    // If no position specified, add at the beginning (common pattern)
    const insertIndex = afterIndex ?? -1;
    
    this.insertStatement(insertIndex, {
      type: 'participant',
      data: participantData
    });
  }

  /**
   * Update participant alias
   */
  updateParticipantAlias(participantId: string, newAlias: string): void {
    console.log(`✏️ Updating participant ${participantId} alias to: ${newAlias}`);
    
    const stmt = this.ast.statements.find(s => 
      s.type === 'participant' && (s.data as ParticipantData).id === participantId
    );
    
    if (!stmt) {
      console.warn(`⚠️ Participant ${participantId} not found`);
      return;
    }
    
    this.updateStatement(stmt.originalIndex, { alias: newAlias });
  }

  /**
   * Add a new message
   */
  addMessage(from: string, to: string, message: string, arrow: string = '->>', afterIndex?: number): void {
    console.log(`💬 Adding message: ${from}${arrow}${to}: ${message}`);
    
    const messageData: MessageData = { from, to, arrow, message };
    
    // If no position specified, add at the end
    const insertIndex = afterIndex ?? this.getLastStatementIndex();
    
    this.insertStatement(insertIndex, {
      type: 'message',
      data: messageData
    });
  }

  /**
   * Update message text
   */
  updateMessageText(messageIndex: number, newText: string): void {
    console.log(`✏️ Updating message at index ${messageIndex} to: ${newText}`);
    
    const stmt = this.getStatement(messageIndex);
    if (!stmt || stmt.type !== 'message') {
      console.warn(`⚠️ Message at index ${messageIndex} not found`);
      return;
    }
    
    this.updateStatement(messageIndex, { message: newText });
  }

  /**
   * Add a note
   */
  addNote(position: 'left' | 'right' | 'over', participant: string, message: string, afterIndex?: number): void {
    console.log(`📝 Adding note: Note ${position} of ${participant}: ${message}`);
    
    const noteData: NoteData = { position, participant, message };
    
    const insertIndex = afterIndex ?? this.getLastStatementIndex();
    
    this.insertStatement(insertIndex, {
      type: 'note',
      data: noteData
    });
  }

  /**
   * Add activation
   */
  addActivation(participant: string, afterIndex?: number): void {
    console.log(`⚡ Adding activation for: ${participant}`);
    
    const insertIndex = afterIndex ?? this.getLastStatementIndex();
    
    this.insertStatement(insertIndex, {
      type: 'activate',
      data: { participant }
    });
  }

  /**
   * Add deactivation
   */
  addDeactivation(participant: string, afterIndex?: number): void {
    console.log(`💤 Adding deactivation for: ${participant}`);
    
    const insertIndex = afterIndex ?? this.getLastStatementIndex();
    
    this.insertStatement(insertIndex, {
      type: 'deactivate',
      data: { participant }
    });
  }

  /**
   * Wrap statements in a loop
   */
  wrapInLoop(startIndex: number, endIndex: number, condition: string): void {
    console.log(`🔄 Wrapping statements ${startIndex}-${endIndex} in loop: ${condition}`);
    
    // This is a complex operation that would need careful implementation
    // For now, just add a loop statement
    const loopData: LoopData = { condition, statements: [] };
    
    this.insertStatement(startIndex - 1, {
      type: 'loop',
      data: loopData
    });
  }

  // ========================================
  // Helper methods
  // ========================================

  /**
   * Get the index of the last statement
   */
  private getLastStatementIndex(): number {
    if (this.ast.statements.length === 0) return -1;
    return Math.max(...this.ast.statements.map(s => s.originalIndex));
  }

  /**
   * Get all participants (declared and mentioned)
   */
  getAllParticipants(): Set<string> {
    return SequenceASTHelper.getAllMentionedParticipants(this.ast);
  }

  /**
   * Get sequence diagram statistics
   */
  getStatistics() {
    return SequenceASTHelper.getStatistics(this.ast);
  }

  /**
   * Validate the current AST
   */
  validate() {
    return SequenceASTHelper.validate(this.ast);
  }

  /**
   * Get a summary of the diagram for debugging
   */
  getSummary(): string {
    const stats = this.getStatistics();
    const participants = Array.from(this.getAllParticipants()).join(', ');
    
    return `Sequence Diagram Summary:
- ${stats.totalStatements} total statements
- ${stats.participants} declared participants: ${participants}
- ${stats.messages} messages
- ${stats.notes} notes
- ${stats.loops} loops
- Complexity: ${stats.complexity}`;
  }
}

/**
 * AST Builder for sequence diagrams
 * Converts ANTLR parse tree to our custom AST format
 */
class SequenceASTBuilder {
  private ast: SequenceAST;
  private currentIndex = 0;

  constructor() {
    this.ast = SequenceASTHelper.createEmpty();
  }

  getAST(): SequenceAST {
    return this.ast;
  }

  // This would be implemented with proper visitor pattern
  // For now, placeholder that would integrate with your existing SequenceCodeGenerator
  visit(parseTree: any): void {
    // TODO: Implement proper AST building from parse tree
    // This would use the visitor pattern to traverse the parse tree
    // and build the structured AST
    console.log('🚧 AST building from parse tree - to be implemented');
  }
}
