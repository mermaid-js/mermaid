import { CommonTokenStream, TokenStreamRewriter } from 'antlr4ng';

/**
 * Base interfaces for diagram editing
 */
export interface DiagramStatement {
  type: string;
  originalIndex: number;
  data: any;
  sourceTokens?: { start: any; stop: any }; // Reference to original tokens
}

export interface DiagramAST {
  header: string;
  statements: DiagramStatement[];
  metadata?: any;
}

export interface EditOperation {
  type: 'insert' | 'update' | 'delete' | 'move';
  index: number;
  data?: any;
  targetIndex?: number; // for move operations
  timestamp: number;
}

/**
 * Abstract base class for hybrid diagram editors
 * Combines AST-based structural editing with TokenStreamRewriter for performance
 */
export abstract class HybridDiagramEditor<T extends DiagramAST> {
  protected ast: T;
  protected tokenRewriter: TokenStreamRewriter;
  protected originalTokenStream: CommonTokenStream;
  protected pendingOperations: EditOperation[] = [];
  protected operationHistory: EditOperation[][] = []; // For undo/redo

  constructor(protected input: string, protected diagramType: string) {
    console.log(`🏗️ Initializing ${diagramType} hybrid editor`);
    this.parseAndBuildAST();
  }

  /**
   * Parse input and build both token stream and AST
   */
  private parseAndBuildAST(): void {
    try {
      const { parser, tokenStream } = this.createParser(this.input);
      this.originalTokenStream = tokenStream;
      this.tokenRewriter = new TokenStreamRewriter(tokenStream);
      
      console.log(`🌳 Building AST for ${this.diagramType}`);
      this.ast = this.buildAST(parser);
      
      console.log(`✅ ${this.diagramType} AST built successfully:`, {
        statements: this.ast.statements.length,
        header: this.ast.header
      });
    } catch (error) {
      console.error(`❌ Failed to parse ${this.diagramType}:`, error);
      throw error;
    }
  }

  /**
   * Abstract methods each diagram type must implement
   */
  protected abstract createParser(input: string): { parser: any; tokenStream: CommonTokenStream };
  protected abstract buildAST(parser: any): T;
  protected abstract regenerateFromAST(): string;
  protected abstract getStatementCount(): number;

  /**
   * Get current AST (read-only)
   */
  getAST(): Readonly<T> {
    return this.ast;
  }

  /**
   * Get statement by index
   */
  getStatement(index: number): DiagramStatement | undefined {
    return this.ast.statements.find(stmt => stmt.originalIndex === index);
  }

  /**
   * Get all statements of a specific type
   */
  getStatementsByType(type: string): DiagramStatement[] {
    return this.ast.statements.filter(stmt => stmt.type === type);
  }

  /**
   * Insert a new statement at the specified position
   */
  insertStatement(afterIndex: number, statement: Omit<DiagramStatement, 'originalIndex'>): void {
    console.log(`📝 Inserting ${statement.type} statement after index ${afterIndex}`);
    
    // Update indices of statements after insertion point
    this.ast.statements.forEach(stmt => {
      if (stmt.originalIndex > afterIndex) {
        stmt.originalIndex++;
      }
    });
    
    const newStatement: DiagramStatement = {
      ...statement,
      originalIndex: afterIndex + 1
    };
    
    // Find insertion position in array
    const insertPos = this.ast.statements.findIndex(stmt => stmt.originalIndex > afterIndex + 1);
    if (insertPos === -1) {
      this.ast.statements.push(newStatement);
    } else {
      this.ast.statements.splice(insertPos, 0, newStatement);
    }
    
    // Record operation
    this.recordOperation({
      type: 'insert',
      index: afterIndex + 1,
      data: statement,
      timestamp: Date.now()
    });
  }

  /**
   * Update an existing statement
   */
  updateStatement(index: number, newData: Partial<any>): void {
    console.log(`✏️ Updating statement at index ${index}`);
    
    const statement = this.ast.statements.find(stmt => stmt.originalIndex === index);
    if (!statement) {
      console.warn(`⚠️ Statement at index ${index} not found`);
      return;
    }
    
    const oldData = { ...statement.data };
    statement.data = { ...statement.data, ...newData };
    
    // Record operation
    this.recordOperation({
      type: 'update',
      index,
      data: { old: oldData, new: statement.data },
      timestamp: Date.now()
    });
  }

  /**
   * Remove a statement
   */
  removeStatement(index: number): void {
    console.log(`🗑️ Removing statement at index ${index}`);
    
    const stmtIndex = this.ast.statements.findIndex(stmt => stmt.originalIndex === index);
    if (stmtIndex === -1) {
      console.warn(`⚠️ Statement at index ${index} not found`);
      return;
    }
    
    const removedStatement = this.ast.statements[stmtIndex];
    this.ast.statements.splice(stmtIndex, 1);
    
    // Update indices of statements after removal
    this.ast.statements.forEach(stmt => {
      if (stmt.originalIndex > index) {
        stmt.originalIndex--;
      }
    });
    
    // Record operation
    this.recordOperation({
      type: 'delete',
      index,
      data: removedStatement,
      timestamp: Date.now()
    });
  }

  /**
   * Move a statement from one position to another
   */
  moveStatement(fromIndex: number, toIndex: number): void {
    console.log(`🔄 Moving statement from index ${fromIndex} to ${toIndex}`);
    
    if (fromIndex === toIndex) return;
    
    const statement = this.ast.statements.find(stmt => stmt.originalIndex === fromIndex);
    if (!statement) {
      console.warn(`⚠️ Statement at index ${fromIndex} not found`);
      return;
    }
    
    // Remove from current position
    this.removeStatement(fromIndex);
    
    // Adjust target index if necessary
    const adjustedToIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
    
    // Insert at new position
    this.insertStatement(adjustedToIndex, {
      type: statement.type,
      data: statement.data,
      sourceTokens: statement.sourceTokens
    });
    
    // Record operation (override the individual remove/insert operations)
    this.pendingOperations.pop(); // Remove insert
    this.pendingOperations.pop(); // Remove delete
    this.recordOperation({
      type: 'move',
      index: fromIndex,
      targetIndex: toIndex,
      timestamp: Date.now()
    });
  }

  /**
   * Smart code regeneration with automatic strategy selection
   */
  regenerateCode(strategy: 'ast' | 'tokens' | 'auto' = 'auto'): string {
    console.log(`🔄 Regenerating code using ${strategy} strategy`);
    
    if (strategy === 'auto') {
      strategy = this.chooseOptimalStrategy();
      console.log(`🤖 Auto-selected strategy: ${strategy}`);
    }

    try {
      const result = strategy === 'tokens' 
        ? this.regenerateUsingTokens()
        : this.regenerateFromAST();
      
      console.log(`✅ Code regenerated successfully (${result.split('\n').length} lines)`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to regenerate code using ${strategy} strategy:`, error);
      
      // Fallback to AST if tokens fail
      if (strategy === 'tokens') {
        console.log('🔄 Falling back to AST regeneration');
        return this.regenerateFromAST();
      }
      
      throw error;
    }
  }

  /**
   * Choose optimal regeneration strategy based on file size and changes
   */
  protected chooseOptimalStrategy(): 'ast' | 'tokens' {
    const fileSize = this.input.length;
    const statementCount = this.getStatementCount();
    const changeRatio = this.pendingOperations.length / Math.max(statementCount, 1);
    
    const hasStructuralChanges = this.pendingOperations.some(op => 
      op.type === 'insert' || op.type === 'delete' || op.type === 'move'
    );
    
    console.log(`📊 Strategy selection metrics:`, {
      fileSize,
      statementCount,
      pendingOperations: this.pendingOperations.length,
      changeRatio: changeRatio.toFixed(2),
      hasStructuralChanges
    });
    
    // Use tokens for large files with minimal text-only changes
    if (fileSize > 10000 && changeRatio < 0.1 && !hasStructuralChanges) {
      return 'tokens';
    }
    
    // Use AST for structural changes or smaller files
    return 'ast';
  }

  /**
   * Regenerate using TokenStreamRewriter (preserves original formatting)
   */
  protected regenerateUsingTokens(): string {
    // Apply pending token-level operations
    // This would be implemented by subclasses for specific token manipulations
    return this.tokenRewriter.getText();
  }

  /**
   * Record an operation for history/undo functionality
   */
  private recordOperation(operation: EditOperation): void {
    this.pendingOperations.push(operation);
    
    // Limit history size to prevent memory issues
    if (this.pendingOperations.length > 1000) {
      this.pendingOperations = this.pendingOperations.slice(-500);
    }
  }

  /**
   * Get operation history for debugging
   */
  getOperationHistory(): ReadonlyArray<EditOperation> {
    return this.pendingOperations;
  }

  /**
   * Clear all pending operations (useful after successful save)
   */
  clearOperations(): void {
    console.log(`🧹 Clearing ${this.pendingOperations.length} pending operations`);
    this.pendingOperations = [];
  }
}
