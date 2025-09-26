import { DiagramAST, DiagramStatement } from './HybridDiagramEditor.js';

/**
 * Sequence diagram specific AST interfaces
 */

export interface ParticipantData {
  id: string;
  alias?: string;
  displayName?: string;
}

export interface MessageData {
  from: string;
  to: string;
  arrow: string; // ->>, -->, ->, etc.
  message: string;
  activate?: boolean;
  deactivate?: boolean;
}

export interface LoopData {
  condition: string;
  statements: DiagramStatement[];
}

export interface NoteData {
  position: 'left' | 'right' | 'over';
  participant: string;
  message: string;
}

export interface ActivateData {
  participant: string;
}

export interface DeactivateData {
  participant: string;
}

export interface AltData {
  condition: string;
  statements: DiagramStatement[];
  elseStatements?: DiagramStatement[];
}

export interface OptData {
  condition: string;
  statements: DiagramStatement[];
}

export interface ParData {
  statements: DiagramStatement[][];
}

export interface RectData {
  color?: string;
  statements: DiagramStatement[];
}

/**
 * Sequence diagram statement types
 */
export type SequenceStatementType = 
  | 'participant'
  | 'message' 
  | 'note'
  | 'activate'
  | 'deactivate'
  | 'loop'
  | 'alt'
  | 'opt'
  | 'par'
  | 'rect'
  | 'break'
  | 'critical'
  | 'autonumber';

export interface SequenceStatement extends DiagramStatement {
  type: SequenceStatementType;
  data: ParticipantData | MessageData | LoopData | NoteData | ActivateData | DeactivateData | AltData | OptData | ParData | RectData;
}

/**
 * Complete sequence diagram AST
 */
export interface SequenceAST extends DiagramAST {
  header: 'sequenceDiagram';
  statements: SequenceStatement[];
  metadata?: {
    title?: string;
    participants?: Map<string, ParticipantData>;
    theme?: string;
    config?: any;
  };
}

/**
 * Helper functions for working with sequence AST
 */
export class SequenceASTHelper {
  /**
   * Get all participants from the AST
   */
  static getParticipants(ast: SequenceAST): ParticipantData[] {
    return ast.statements
      .filter(stmt => stmt.type === 'participant')
      .map(stmt => stmt.data as ParticipantData);
  }

  /**
   * Get all messages from the AST
   */
  static getMessages(ast: SequenceAST): MessageData[] {
    return ast.statements
      .filter(stmt => stmt.type === 'message')
      .map(stmt => stmt.data as MessageData);
  }

  /**
   * Get all participants mentioned in messages (even if not explicitly declared)
   */
  static getAllMentionedParticipants(ast: SequenceAST): Set<string> {
    const participants = new Set<string>();
    
    // Add explicitly declared participants
    this.getParticipants(ast).forEach(p => participants.add(p.id));
    
    // Add participants from messages
    this.getMessages(ast).forEach(m => {
      participants.add(m.from);
      participants.add(m.to);
    });
    
    return participants;
  }

  /**
   * Find participant by ID
   */
  static findParticipant(ast: SequenceAST, id: string): ParticipantData | undefined {
    const stmt = ast.statements.find(stmt => 
      stmt.type === 'participant' && (stmt.data as ParticipantData).id === id
    );
    return stmt ? stmt.data as ParticipantData : undefined;
  }

  /**
   * Get display name for a participant (alias if available, otherwise ID)
   */
  static getParticipantDisplayName(ast: SequenceAST, id: string): string {
    const participant = this.findParticipant(ast, id);
    return participant?.alias || participant?.displayName || id;
  }

  /**
   * Check if a participant is explicitly declared
   */
  static isParticipantDeclared(ast: SequenceAST, id: string): boolean {
    return this.findParticipant(ast, id) !== undefined;
  }

  /**
   * Get the index of the first message involving a participant
   */
  static getFirstMessageIndex(ast: SequenceAST, participantId: string): number {
    return ast.statements.findIndex(stmt => 
      stmt.type === 'message' && 
      ((stmt.data as MessageData).from === participantId || (stmt.data as MessageData).to === participantId)
    );
  }

  /**
   * Validate AST structure
   */
  static validate(ast: SequenceAST): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for duplicate participant declarations
    const participantIds = new Set<string>();
    ast.statements
      .filter(stmt => stmt.type === 'participant')
      .forEach(stmt => {
        const participant = stmt.data as ParticipantData;
        if (participantIds.has(participant.id)) {
          errors.push(`Duplicate participant declaration: ${participant.id}`);
        }
        participantIds.add(participant.id);
      });
    
    // Check for messages with undefined participants
    const allMentioned = this.getAllMentionedParticipants(ast);
    this.getMessages(ast).forEach(message => {
      if (!allMentioned.has(message.from)) {
        errors.push(`Message references undefined participant: ${message.from}`);
      }
      if (!allMentioned.has(message.to)) {
        errors.push(`Message references undefined participant: ${message.to}`);
      }
    });
    
    // Check for valid arrow types
    const validArrows = ['->', '-->>', '->>', '-->', '-x', '--x', '-)', '--)', '<<->>', '<<-->>'];
    this.getMessages(ast).forEach(message => {
      if (!validArrows.includes(message.arrow)) {
        errors.push(`Invalid arrow type: ${message.arrow}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get statistics about the AST
   */
  static getStatistics(ast: SequenceAST): {
    totalStatements: number;
    participants: number;
    messages: number;
    notes: number;
    loops: number;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const stats = {
      totalStatements: ast.statements.length,
      participants: ast.statements.filter(s => s.type === 'participant').length,
      messages: ast.statements.filter(s => s.type === 'message').length,
      notes: ast.statements.filter(s => s.type === 'note').length,
      loops: ast.statements.filter(s => s.type === 'loop').length,
      complexity: 'simple' as 'simple' | 'moderate' | 'complex'
    };
    
    // Determine complexity
    if (stats.totalStatements > 50 || stats.loops > 3) {
      stats.complexity = 'complex';
    } else if (stats.totalStatements > 20 || stats.loops > 1) {
      stats.complexity = 'moderate';
    }
    
    return stats;
  }

  /**
   * Create a minimal valid sequence AST
   */
  static createEmpty(): SequenceAST {
    return {
      header: 'sequenceDiagram',
      statements: [],
      metadata: {
        participants: new Map()
      }
    };
  }

  /**
   * Clone an AST (deep copy)
   */
  static clone(ast: SequenceAST): SequenceAST {
    return {
      header: ast.header,
      statements: ast.statements.map(stmt => ({
        type: stmt.type,
        originalIndex: stmt.originalIndex,
        data: { ...stmt.data },
        sourceTokens: stmt.sourceTokens
      })),
      metadata: ast.metadata ? {
        title: ast.metadata.title,
        participants: new Map(ast.metadata.participants),
        theme: ast.metadata.theme,
        config: ast.metadata.config ? { ...ast.metadata.config } : undefined
      } : undefined
    };
  }
}
