import { ClassParserVisitor } from './generated/ClassParserVisitor.js';
import { ClassParserCore, type ClassDbLike } from './ClassParserCore.js';
import type {
  ClassIdentifierContext,
  ClassMembersContext,
  ClassStatementContext,
  NamespaceIdentifierContext,
  NamespaceStatementContext,
  RelationStatementContext,
  NoteStatementContext,
  AnnotationStatementContext,
  MemberStatementContext,
  ClassDefStatementContext,
  StyleStatementContext,
  CssClassStatementContext,
  DirectionStatementContext,
  AccTitleStatementContext,
  AccDescrStatementContext,
  AccDescrMultilineStatementContext,
  CallbackStatementContext,
  ClickStatementContext,
  LinkStatementContext,
  CallStatementContext,
} from './generated/ClassParser.js';

/**
 * Class diagram visitor implementation using the visitor pattern
 * Extends ClassParserCore for common parsing logic
 */
export class ClassVisitor extends ClassParserCore {
  private visitor: ClassParserVisitor<any>;

  constructor(db: ClassDbLike) {
    super(db);
    this.visitor = new ClassParserVisitor<any>();
    
    // Override visitor methods to call our processing methods
    this.visitor.visitNamespaceStatement = this.visitNamespaceStatement.bind(this);
    this.visitor.visitNamespaceIdentifier = this.visitNamespaceIdentifier.bind(this);
    this.visitor.visitClassIdentifier = this.visitClassIdentifier.bind(this);
    this.visitor.visitClassMembers = this.visitClassMembers.bind(this);
    this.visitor.visitClassStatement = this.visitClassStatement.bind(this);
    this.visitor.visitRelationStatement = this.visitRelationStatement.bind(this);
    this.visitor.visitNoteStatement = this.visitNoteStatement.bind(this);
    this.visitor.visitAnnotationStatement = this.visitAnnotationStatement.bind(this);
    this.visitor.visitMemberStatement = this.visitMemberStatement.bind(this);
    this.visitor.visitClassDefStatement = this.visitClassDefStatement.bind(this);
    this.visitor.visitStyleStatement = this.visitStyleStatement.bind(this);
    this.visitor.visitCssClassStatement = this.visitCssClassStatement.bind(this);
    this.visitor.visitDirectionStatement = this.visitDirectionStatement.bind(this);
    this.visitor.visitAccTitleStatement = this.visitAccTitleStatement.bind(this);
    this.visitor.visitAccDescrStatement = this.visitAccDescrStatement.bind(this);
    this.visitor.visitAccDescrMultilineStatement = this.visitAccDescrMultilineStatement.bind(this);
    this.visitor.visitCallbackStatement = this.visitCallbackStatement.bind(this);
    this.visitor.visitClickStatement = this.visitClickStatement.bind(this);
    this.visitor.visitLinkStatement = this.visitLinkStatement.bind(this);
    this.visitor.visitCallStatement = this.visitCallStatement.bind(this);
    this.visitor.visitErrorNode = this.visitErrorNode.bind(this);
  }

  /**
   * Visit the parse tree using the visitor pattern
   */
  visit(tree: any): any {
    return this.visitor.visit(tree);
  }

  // Visitor method implementations that delegate to the core processing methods

  visitNamespaceStatement(ctx: NamespaceStatementContext): any {
    console.log('🔧 ClassVisitor: Processing namespace statement');
    try {
      this.processNamespaceStatementEnter();
      
      // Visit children first
      const result = this.visitor.visitChildren?.(ctx);
      
      this.processNamespaceStatementExit();
      return result;
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing namespace statement:', error);
      throw error;
    }
  }

  visitNamespaceIdentifier(ctx: NamespaceIdentifierContext): any {
    console.log('🔧 ClassVisitor: Processing namespace identifier');
    try {
      this.processNamespaceIdentifier(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing namespace identifier:', error);
      throw error;
    }
  }

  visitClassIdentifier(ctx: ClassIdentifierContext): any {
    console.log('🔧 ClassVisitor: Processing class identifier');
    try {
      this.processClassIdentifier(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing class identifier:', error);
      throw error;
    }
  }

  visitClassMembers(ctx: ClassMembersContext): any {
    console.log('🔧 ClassVisitor: Processing class members');
    try {
      this.processClassMembers(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing class members:', error);
      throw error;
    }
  }

  visitClassStatement(ctx: ClassStatementContext): any {
    console.log('🔧 ClassVisitor: Processing class statement');
    try {
      // Visit children first to populate member lists
      const result = this.visitor.visitChildren?.(ctx);
      
      this.processClassStatement(ctx);
      return result;
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing class statement:', error);
      throw error;
    }
  }

  visitRelationStatement(ctx: RelationStatementContext): any {
    console.log('🔧 ClassVisitor: Processing relation statement');
    try {
      this.processRelationStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing relation statement:', error);
      throw error;
    }
  }

  visitNoteStatement(ctx: NoteStatementContext): any {
    console.log('🔧 ClassVisitor: Processing note statement');
    try {
      this.processNoteStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing note statement:', error);
      throw error;
    }
  }

  visitAnnotationStatement(ctx: AnnotationStatementContext): any {
    console.log('🔧 ClassVisitor: Processing annotation statement');
    try {
      this.processAnnotationStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing annotation statement:', error);
      throw error;
    }
  }

  visitMemberStatement(ctx: MemberStatementContext): any {
    console.log('🔧 ClassVisitor: Processing member statement');
    try {
      this.processMemberStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing member statement:', error);
      throw error;
    }
  }

  visitClassDefStatement(ctx: ClassDefStatementContext): any {
    console.log('🔧 ClassVisitor: Processing classDef statement');
    try {
      this.processClassDefStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing classDef statement:', error);
      throw error;
    }
  }

  visitStyleStatement(ctx: StyleStatementContext): any {
    console.log('🔧 ClassVisitor: Processing style statement');
    try {
      this.processStyleStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing style statement:', error);
      throw error;
    }
  }

  visitCssClassStatement(ctx: CssClassStatementContext): any {
    console.log('🔧 ClassVisitor: Processing cssClass statement');
    try {
      this.processCssClassStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing cssClass statement:', error);
      throw error;
    }
  }

  visitDirectionStatement(ctx: DirectionStatementContext): any {
    console.log('🔧 ClassVisitor: Processing direction statement');
    try {
      this.processDirectionStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing direction statement:', error);
      throw error;
    }
  }

  visitAccTitleStatement(ctx: AccTitleStatementContext): any {
    console.log('🔧 ClassVisitor: Processing accTitle statement');
    try {
      this.processAccTitleStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing accTitle statement:', error);
      throw error;
    }
  }

  visitAccDescrStatement(ctx: AccDescrStatementContext): any {
    console.log('🔧 ClassVisitor: Processing accDescr statement');
    try {
      this.processAccDescrStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing accDescr statement:', error);
      throw error;
    }
  }

  visitAccDescrMultilineStatement(ctx: AccDescrMultilineStatementContext): any {
    console.log('🔧 ClassVisitor: Processing accDescr multiline statement');
    try {
      this.processAccDescrMultilineStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing accDescr multiline statement:', error);
      throw error;
    }
  }

  visitCallbackStatement(ctx: CallbackStatementContext): any {
    console.log('🔧 ClassVisitor: Processing callback statement');
    try {
      this.processCallbackStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing callback statement:', error);
      throw error;
    }
  }

  visitClickStatement(ctx: ClickStatementContext): any {
    console.log('🔧 ClassVisitor: Processing click statement');
    try {
      this.processClickStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing click statement:', error);
      throw error;
    }
  }

  visitLinkStatement(ctx: LinkStatementContext): any {
    console.log('🔧 ClassVisitor: Processing link statement');
    try {
      this.processLinkStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing link statement:', error);
      throw error;
    }
  }

  visitCallStatement(ctx: CallStatementContext): any {
    console.log('🔧 ClassVisitor: Processing call statement');
    try {
      this.processCallStatement(ctx);
      return this.visitor.visitChildren?.(ctx);
    } catch (error) {
      console.error('❌ ClassVisitor: Error processing call statement:', error);
      throw error;
    }
  }

  visitErrorNode(_node: any): any {
    console.log('❌ ClassVisitor: Error node encountered');
    // Throw error to match Jison parser behavior for syntax errors
    throw new Error('Syntax error in class diagram');
  }
}
