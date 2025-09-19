import type { ParseTreeListener } from 'antlr4ng';
import { ClassParserListener } from './generated/ClassParserListener.js';
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
 * Class diagram listener implementation using the listener pattern
 * Extends ClassParserCore for common parsing logic
 */
export class ClassListener extends ClassParserCore implements ParseTreeListener {
  constructor(db: ClassDbLike) {
    super(db);
  }

  // Standard ParseTreeListener methods
  enterEveryRule = (_ctx: any) => {
    // Optional: Add debug logging for rule entry
  };

  exitEveryRule = (_ctx: any) => {
    // Optional: Add debug logging for rule exit
  };

  visitTerminal = (_node: any) => {
    // Optional: Handle terminal nodes
  };

  visitErrorNode = (_node: any) => {
    console.log('❌ ClassListener: Error node encountered');
    // Throw error to match Jison parser behavior for syntax errors
    throw new Error('Syntax error in class diagram');
  };

  // Listener method implementations that delegate to the core processing methods

  enterNamespaceStatement = (_ctx: NamespaceStatementContext): void => {
    console.log('🔧 ClassListener: Entering namespace statement');
    try {
      this.processNamespaceStatementEnter();
    } catch (error) {
      console.error('❌ ClassListener: Error entering namespace statement:', error);
      throw error;
    }
  };

  exitNamespaceIdentifier = (ctx: NamespaceIdentifierContext): void => {
    console.log('🔧 ClassListener: Exiting namespace identifier');
    try {
      this.processNamespaceIdentifier(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing namespace identifier:', error);
      throw error;
    }
  };

  exitNamespaceStatement = (_ctx: NamespaceStatementContext): void => {
    console.log('🔧 ClassListener: Exiting namespace statement');
    try {
      this.processNamespaceStatementExit();
    } catch (error) {
      console.error('❌ ClassListener: Error exiting namespace statement:', error);
      throw error;
    }
  };

  exitClassIdentifier = (ctx: ClassIdentifierContext): void => {
    console.log('🔧 ClassListener: Exiting class identifier');
    try {
      this.processClassIdentifier(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing class identifier:', error);
      throw error;
    }
  };

  exitClassMembers = (ctx: ClassMembersContext): void => {
    console.log('🔧 ClassListener: Exiting class members');
    try {
      this.processClassMembers(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing class members:', error);
      throw error;
    }
  };

  exitClassStatement = (ctx: ClassStatementContext): void => {
    console.log('🔧 ClassListener: Exiting class statement');
    try {
      this.processClassStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing class statement:', error);
      throw error;
    }
  };

  exitRelationStatement = (ctx: RelationStatementContext): void => {
    console.log('🔧 ClassListener: Exiting relation statement');
    try {
      this.processRelationStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing relation statement:', error);
      throw error;
    }
  };

  exitNoteStatement = (ctx: NoteStatementContext): void => {
    console.log('🔧 ClassListener: Exiting note statement');
    try {
      this.processNoteStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing note statement:', error);
      throw error;
    }
  };

  exitAnnotationStatement = (ctx: AnnotationStatementContext): void => {
    console.log('🔧 ClassListener: Exiting annotation statement');
    try {
      this.processAnnotationStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing annotation statement:', error);
      throw error;
    }
  };

  exitMemberStatement = (ctx: MemberStatementContext): void => {
    console.log('🔧 ClassListener: Exiting member statement');
    try {
      this.processMemberStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing member statement:', error);
      throw error;
    }
  };

  exitClassDefStatement = (ctx: ClassDefStatementContext): void => {
    console.log('🔧 ClassListener: Exiting classDef statement');
    try {
      this.processClassDefStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing classDef statement:', error);
      throw error;
    }
  };

  exitStyleStatement = (ctx: StyleStatementContext): void => {
    console.log('🔧 ClassListener: Exiting style statement');
    try {
      this.processStyleStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing style statement:', error);
      throw error;
    }
  };

  exitCssClassStatement = (ctx: CssClassStatementContext): void => {
    console.log('🔧 ClassListener: Exiting cssClass statement');
    try {
      this.processCssClassStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing cssClass statement:', error);
      throw error;
    }
  };

  exitDirectionStatement = (ctx: DirectionStatementContext): void => {
    console.log('🔧 ClassListener: Exiting direction statement');
    try {
      this.processDirectionStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing direction statement:', error);
      throw error;
    }
  };

  exitAccTitleStatement = (ctx: AccTitleStatementContext): void => {
    console.log('🔧 ClassListener: Exiting accTitle statement');
    try {
      this.processAccTitleStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing accTitle statement:', error);
      throw error;
    }
  };

  exitAccDescrStatement = (ctx: AccDescrStatementContext): void => {
    console.log('🔧 ClassListener: Exiting accDescr statement');
    try {
      this.processAccDescrStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing accDescr statement:', error);
      throw error;
    }
  };

  exitAccDescrMultilineStatement = (ctx: AccDescrMultilineStatementContext): void => {
    console.log('🔧 ClassListener: Exiting accDescr multiline statement');
    try {
      this.processAccDescrMultilineStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing accDescr multiline statement:', error);
      throw error;
    }
  };

  exitCallbackStatement = (ctx: CallbackStatementContext): void => {
    console.log('🔧 ClassListener: Exiting callback statement');
    try {
      this.processCallbackStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing callback statement:', error);
      throw error;
    }
  };

  exitClickStatement = (ctx: ClickStatementContext): void => {
    console.log('🔧 ClassListener: Exiting click statement');
    try {
      this.processClickStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing click statement:', error);
      throw error;
    }
  };

  exitLinkStatement = (ctx: LinkStatementContext): void => {
    console.log('🔧 ClassListener: Exiting link statement');
    try {
      this.processLinkStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing link statement:', error);
      throw error;
    }
  };

  exitCallStatement = (ctx: CallStatementContext): void => {
    console.log('🔧 ClassListener: Exiting call statement');
    try {
      this.processCallStatement(ctx);
    } catch (error) {
      console.error('❌ ClassListener: Error processing call statement:', error);
      throw error;
    }
  };
}
