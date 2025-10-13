/**
 * ANTLR Visitor Implementation for UseCase Diagrams
 *
 * This visitor traverses the ANTLR parse tree and builds the AST
 * according to the grammar rules defined in Usecase.g4
 */

import { UsecaseVisitor } from './generated/UsecaseVisitor.js';
import type {
  UsecaseDiagramContext,
  StatementContext,
  ActorStatementContext,
  ActorListContext,
  RelationshipStatementContext,
  SystemBoundaryStatementContext,
  SystemBoundaryTypeStatementContext,
  SystemBoundaryNameContext,
  SystemBoundaryTypeContentContext,
  SystemBoundaryTypePropertyContext,
  SystemBoundaryTypeContext,
  UsecaseInBoundaryContext,
  UsecaseWithClassContext,
  UsecaseStatementContext,
  ActorNameContext,
  ActorDeclarationContext,
  NodeIdWithLabelContext,
  NodeLabelContext,
  MetadataContext,
  MetadataContentContext,
  MetadataPropertyContext,
  EntityNameContext,
  ArrowContext,
  LabeledArrowContext,
  EdgeLabelContext,
  DirectionStatementContext,
  DirectionContext,
  ClassDefStatementContext,
  ClassStatementContext,
  NodeListContext,
} from './generated/UsecaseParser.js';
import { ARROW_TYPE } from './types.js';
import type {
  Actor,
  UseCase,
  SystemBoundary,
  Relationship,
  UsecaseParseResult,
  ArrowType,
  ClassDef,
} from './types.js';

export class UsecaseAntlrVisitor extends UsecaseVisitor<void> {
  private actors: Actor[] = [];
  private useCases: UseCase[] = [];
  private systemBoundaries: SystemBoundary[] = [];
  private relationships: Relationship[] = [];
  private relationshipCounter = 0;
  private direction = 'TB'; // Default direction
  private classDefs = new Map<string, ClassDef>();

  constructor() {
    super();

    // Assign visitor functions as properties
    this.visitUsecaseDiagram = this.visitUsecaseDiagramImpl.bind(this);
    this.visitStatement = this.visitStatementImpl.bind(this);
    this.visitActorStatement = this.visitActorStatementImpl.bind(this);
    this.visitRelationshipStatement = this.visitRelationshipStatementImpl.bind(this);
    this.visitSystemBoundaryStatement = this.visitSystemBoundaryStatementImpl.bind(this);
    this.visitSystemBoundaryTypeStatement = this.visitSystemBoundaryTypeStatementImpl.bind(this);
    this.visitDirectionStatement = this.visitDirectionStatementImpl.bind(this);
    this.visitClassDefStatement = this.visitClassDefStatementImpl.bind(this);
    this.visitClassStatement = this.visitClassStatementImpl.bind(this);
    this.visitStyleStatement = this.visitStyleStatementImpl.bind(this);
    this.visitUsecaseStatement = this.visitUsecaseStatementImpl.bind(this);
    this.visitActorName = this.visitActorNameImpl.bind(this);
    this.visitArrow = this.visitArrowImpl.bind(this);
  }

  /**
   * Visit the root usecaseDiagram rule
   * Grammar: usecaseDiagram : 'usecase' statement* EOF ;
   */
  visitUsecaseDiagramImpl(ctx: UsecaseDiagramContext): void {
    // Reset state
    this.actors = [];
    this.useCases = [];
    this.relationships = [];
    this.relationshipCounter = 0;
    this.direction = 'TB'; // Reset direction to default

    // Visit all statement children
    if (ctx.statement) {
      const statements = Array.isArray(ctx.statement()) ? ctx.statement() : [ctx.statement()];
      for (const statementCtx of statements) {
        if (Array.isArray(statementCtx)) {
          for (const stmt of statementCtx) {
            this.visitStatementImpl(stmt);
          }
        } else {
          this.visitStatementImpl(statementCtx);
        }
      }
    }
  }

  /**
   * Visit statement rule
   * Grammar: statement : actorStatement | relationshipStatement | systemBoundaryStatement | systemBoundaryTypeStatement | directionStatement | classDefStatement | classStatement | usecaseStatement | NEWLINE ;
   */
  private visitStatementImpl(ctx: StatementContext): void {
    if (ctx.actorStatement?.()) {
      this.visitActorStatementImpl(ctx.actorStatement()!);
    } else if (ctx.relationshipStatement?.()) {
      this.visitRelationshipStatementImpl(ctx.relationshipStatement()!);
    } else if (ctx.systemBoundaryStatement?.()) {
      this.visitSystemBoundaryStatementImpl(ctx.systemBoundaryStatement()!);
    } else if (ctx.systemBoundaryTypeStatement?.()) {
      this.visitSystemBoundaryTypeStatementImpl(ctx.systemBoundaryTypeStatement()!);
    } else if (ctx.directionStatement?.()) {
      this.visitDirectionStatementImpl(ctx.directionStatement()!);
    } else if (ctx.classDefStatement?.()) {
      const classDefStmt = ctx.classDefStatement();
      if (classDefStmt) {
        this.visitClassDefStatementImpl(classDefStmt);
      }
    } else if (ctx.classStatement?.()) {
      const classStmt = ctx.classStatement();
      if (classStmt) {
        this.visitClassStatementImpl(classStmt);
      }
    } else if (ctx.styleStatement?.()) {
      this.visitStyleStatementImpl(ctx.styleStatement());
    } else if (ctx.usecaseStatement?.()) {
      const usecaseStmt = ctx.usecaseStatement();
      if (usecaseStmt) {
        this.visitUsecaseStatementImpl(usecaseStmt);
      }
    }
    // NEWLINE is ignored
  }

  /**
   * Visit actorStatement rule
   * Grammar: actorStatement : 'actor' actorList NEWLINE* ;
   */
  visitActorStatementImpl(ctx: ActorStatementContext): void {
    if (ctx.actorList?.()) {
      this.visitActorListImpl(ctx.actorList());
    }
  }

  /**
   * Visit actorList rule
   * Grammar: actorList : actorName (',' actorName)* ;
   */
  visitActorListImpl(ctx: ActorListContext): void {
    // Get all actorName contexts from the list
    const actorNameContexts = ctx.actorName();

    for (const actorNameCtx of actorNameContexts) {
      const actorResult = this.visitActorNameImpl(actorNameCtx);
      this.actors.push({
        id: actorResult.name,
        name: actorResult.name,
        metadata: actorResult.metadata,
      });
    }
  }

  /**
   * Visit relationshipStatement rule
   * Grammar: relationshipStatement : entityName arrow entityName NEWLINE* | actorDeclaration arrow entityName NEWLINE* ;
   */
  visitRelationshipStatementImpl(ctx: RelationshipStatementContext): void {
    let from = '';
    let to = '';

    // Handle different relationship patterns
    if (ctx.actorDeclaration?.()) {
      // Pattern: actor ActorName --> entityName
      from = this.visitActorDeclarationImpl(ctx.actorDeclaration()!);
      to = this.visitEntityNameImpl(ctx.entityName(0)!);
    } else if (ctx.entityName && ctx.entityName().length >= 2) {
      // Pattern: entityName --> entityName
      from = this.visitEntityNameImpl(ctx.entityName(0)!);
      to = this.visitEntityNameImpl(ctx.entityName(1)!);
    }

    // Get arrow information (type and optional label)
    const arrowInfo = this.visitArrowImpl(ctx.arrow());

    // Auto-create use cases for entities that are not actors
    this.ensureUseCaseExists(from);
    this.ensureUseCaseExists(to);

    const relationship: Relationship = {
      id: `rel_${this.relationshipCounter++}`,
      from,
      to,
      type: 'association',
      arrowType: arrowInfo.arrowType,
    };

    // Add label if present
    if (arrowInfo.label) {
      relationship.label = arrowInfo.label;
    }

    this.relationships.push(relationship);
  }

  /**
   * Ensure a use case exists for the given entity name if it's not an actor
   */
  private ensureUseCaseExists(entityName: string): void {
    // Check if it's already an actor
    const isActor = this.actors.some((actor) => actor.id === entityName);

    // If it's not an actor, create it as a use case (if not already exists)
    if (!isActor) {
      const existingUseCase = this.useCases.some((useCase) => useCase.id === entityName);
      if (!existingUseCase) {
        this.useCases.push({
          id: entityName,
          name: entityName,
        });
      }
    }
  }

  /**
   * Visit systemBoundaryStatement rule
   * Grammar: systemBoundaryStatement : 'systemBoundary' systemBoundaryName NEWLINE* systemBoundaryContent* 'end' NEWLINE* ;
   */
  visitSystemBoundaryStatementImpl(ctx: SystemBoundaryStatementContext): void {
    let boundaryName = '';

    // Get the system boundary name
    if (ctx.systemBoundaryName?.()) {
      boundaryName = this.visitSystemBoundaryNameImpl(ctx.systemBoundaryName());
    }

    // Collect use cases within this boundary
    const useCasesInBoundary: string[] = [];

    if (ctx.systemBoundaryContent?.()?.length > 0) {
      for (const contentCtx of ctx.systemBoundaryContent()) {
        const usecaseInBoundary = contentCtx.usecaseInBoundary?.();
        if (usecaseInBoundary) {
          const useCaseName = this.visitUsecaseInBoundaryImpl(usecaseInBoundary);
          useCasesInBoundary.push(useCaseName);

          // Create the use case and mark it as being in this boundary
          const existingUseCase = this.useCases.find((uc) => uc.id === useCaseName);
          if (existingUseCase) {
            existingUseCase.systemBoundary = boundaryName;
          } else {
            this.useCases.push({
              id: useCaseName,
              name: useCaseName,
              systemBoundary: boundaryName,
            });
          }
        }
      }
    }

    // Create the system boundary with default type
    this.systemBoundaries.push({
      id: boundaryName,
      name: boundaryName,
      useCases: useCasesInBoundary,
      type: 'rect', // default type
    });
  }

  /**
   * Visit systemBoundaryName rule
   * Grammar: systemBoundaryName : IDENTIFIER | STRING ;
   */
  private visitSystemBoundaryNameImpl(ctx: SystemBoundaryNameContext): string {
    const identifier = ctx.IDENTIFIER?.();
    if (identifier) {
      return identifier.getText();
    }

    const string = ctx.STRING?.();
    if (string) {
      const text = string.getText();
      // Remove quotes from string
      return text.slice(1, -1);
    }

    return '';
  }

  /**
   * Visit usecaseInBoundary rule
   * Grammar: usecaseInBoundary : usecaseWithClass | IDENTIFIER | STRING ;
   */
  private visitUsecaseInBoundaryImpl(ctx: UsecaseInBoundaryContext): string {
    // Check for usecaseWithClass (e.g., "debugging:::case1")
    const usecaseWithClass = ctx.usecaseWithClass?.();
    if (usecaseWithClass) {
      return this.visitUsecaseWithClassImpl(usecaseWithClass);
    }

    const identifier = ctx.IDENTIFIER?.();
    if (identifier) {
      return identifier.getText();
    }

    const string = ctx.STRING?.();
    if (string) {
      const text = string.getText();
      // Remove quotes from string
      return text.slice(1, -1);
    }

    return '';
  }

  /**
   * Visit usecaseWithClass rule
   * Grammar: usecaseWithClass : IDENTIFIER CLASS_SEPARATOR IDENTIFIER | STRING CLASS_SEPARATOR IDENTIFIER ;
   */
  private visitUsecaseWithClassImpl(ctx: UsecaseWithClassContext): string {
    let usecaseName = '';
    let className = '';

    const identifier0 = ctx.IDENTIFIER(0);
    const identifier1 = ctx.IDENTIFIER(1);
    const string = ctx.STRING();

    if (identifier0 && identifier1) {
      // IDENTIFIER:::IDENTIFIER
      usecaseName = identifier0.getText();
      className = identifier1.getText();
    } else if (string && identifier0) {
      // STRING:::IDENTIFIER
      const text = string.getText();
      usecaseName = text.slice(1, -1); // Remove quotes
      className = identifier0.getText();
    }

    // Apply class to the use case
    if (usecaseName && className) {
      this.applyClassToEntity(usecaseName, className);
    }

    return usecaseName;
  }

  /**
   * Visit systemBoundaryTypeStatement rule
   * Grammar: systemBoundaryTypeStatement : systemBoundaryName '\@' '\{' systemBoundaryTypeContent '\}' NEWLINE* ;
   */
  visitSystemBoundaryTypeStatementImpl(ctx: SystemBoundaryTypeStatementContext): void {
    let boundaryName = '';

    // Get the system boundary name
    const systemBoundaryName = ctx.systemBoundaryName?.();
    if (systemBoundaryName) {
      boundaryName = this.visitSystemBoundaryNameImpl(systemBoundaryName);
    }

    // Get the type configuration
    let boundaryType: 'package' | 'rect' = 'rect'; // default
    const systemBoundaryTypeContent = ctx.systemBoundaryTypeContent?.();
    if (systemBoundaryTypeContent) {
      boundaryType = this.visitSystemBoundaryTypeContentImpl(systemBoundaryTypeContent);
    }

    // Find the existing system boundary and update its type
    const existingBoundary = this.systemBoundaries.find((b) => b.id === boundaryName);
    if (existingBoundary) {
      existingBoundary.type = boundaryType;
    }
  }

  /**
   * Visit systemBoundaryTypeContent rule
   * Grammar: systemBoundaryTypeContent : systemBoundaryTypeProperty (',' systemBoundaryTypeProperty)* ;
   */
  private visitSystemBoundaryTypeContentImpl(
    ctx: SystemBoundaryTypeContentContext
  ): 'package' | 'rect' {
    // Get all type properties
    const typeProperties = ctx.systemBoundaryTypeProperty();

    for (const propCtx of typeProperties) {
      const type = this.visitSystemBoundaryTypePropertyImpl(propCtx);
      if (type) {
        return type;
      }
    }

    return 'rect'; // default
  }

  /**
   * Visit systemBoundaryTypeProperty rule
   * Grammar: systemBoundaryTypeProperty : 'type' ':' systemBoundaryType ;
   */
  private visitSystemBoundaryTypePropertyImpl(
    ctx: SystemBoundaryTypePropertyContext
  ): 'package' | 'rect' | null {
    const systemBoundaryType = ctx.systemBoundaryType?.();
    if (systemBoundaryType) {
      return this.visitSystemBoundaryTypeImpl(systemBoundaryType);
    }
    return null;
  }

  /**
   * Visit systemBoundaryType rule
   * Grammar: systemBoundaryType : 'package' | 'rect' ;
   */
  private visitSystemBoundaryTypeImpl(ctx: SystemBoundaryTypeContext): 'package' | 'rect' {
    const text = ctx.getText();
    if (text === 'package') {
      return 'package';
    } else if (text === 'rect') {
      return 'rect';
    }
    return 'rect'; // default
  }

  /**
   * Visit actorName rule
   * Grammar: actorName : (IDENTIFIER | STRING) metadata? ;
   */
  private visitActorNameImpl(ctx: ActorNameContext): {
    name: string;
    metadata?: Record<string, string>;
  } {
    let name = '';

    if (ctx.IDENTIFIER?.()) {
      name = ctx.IDENTIFIER()!.getText();
    } else if (ctx.STRING?.()) {
      const text = ctx.STRING()!.getText();
      // Remove quotes from string
      name = text.slice(1, -1);
    }

    let metadata = undefined;
    if (ctx.metadata?.()) {
      metadata = this.visitMetadataImpl(ctx.metadata()!);
    }

    return { name, metadata };
  }

  /**
   * Visit metadata rule
   * Grammar: metadata : '\@' '\{' metadataContent '\}' ;
   */
  private visitMetadataImpl(ctx: MetadataContext): Record<string, string> {
    const metadataContent = ctx.metadataContent?.();
    if (metadataContent) {
      return this.visitMetadataContentImpl(metadataContent);
    }
    return {};
  }

  /**
   * Visit metadataContent rule
   * Grammar: metadataContent : metadataProperty (',' metadataProperty)* ;
   */
  private visitMetadataContentImpl(ctx: MetadataContentContext): Record<string, string> {
    const metadata: Record<string, string> = {};
    const properties = ctx.metadataProperty();

    for (const property of properties) {
      const { key, value } = this.visitMetadataPropertyImpl(property);
      metadata[key] = value;
    }

    return metadata;
  }

  /**
   * Visit metadataProperty rule
   * Grammar: metadataProperty : STRING ':' STRING ;
   */
  private visitMetadataPropertyImpl(ctx: MetadataPropertyContext): { key: string; value: string } {
    const strings = ctx.STRING();
    if (strings.length >= 2) {
      const key = strings[0].getText().slice(1, -1); // Remove quotes
      const value = strings[1].getText().slice(1, -1); // Remove quotes
      return { key, value };
    }
    return { key: '', value: '' };
  }

  /**
   * Visit entityName rule
   * Grammar: entityName : IDENTIFIER CLASS_SEPARATOR IDENTIFIER | STRING CLASS_SEPARATOR IDENTIFIER | IDENTIFIER | STRING | nodeIdWithLabel ;
   */
  private visitEntityNameImpl(ctx: EntityNameContext): string {
    const classSeparator = ctx.CLASS_SEPARATOR?.();

    // Check for class application syntax (e.g., "debugging:::case1")
    if (classSeparator) {
      let entityName = '';
      let className = '';

      const identifier0 = ctx.IDENTIFIER(0);
      const identifier1 = ctx.IDENTIFIER(1);
      const string0 = ctx.STRING();

      if (identifier0 && identifier1) {
        // IDENTIFIER:::IDENTIFIER
        entityName = identifier0.getText();
        className = identifier1.getText();
      } else if (string0 && identifier0) {
        // STRING:::IDENTIFIER
        const text = string0.getText();
        entityName = text.slice(1, -1); // Remove quotes
        className = identifier0.getText();
      }

      // Apply class to the entity
      if (entityName && className) {
        this.applyClassToEntity(entityName, className);
      }

      return entityName;
    }

    // Regular entity name without class
    const identifier = ctx.IDENTIFIER(0);
    if (identifier) {
      return identifier.getText();
    }

    const string = ctx.STRING();
    if (string) {
      const text = string.getText();
      // Remove quotes from string
      return text.slice(1, -1);
    }

    const nodeIdWithLabel = ctx.nodeIdWithLabel?.();
    if (nodeIdWithLabel) {
      return this.visitNodeIdWithLabelImpl(nodeIdWithLabel);
    }

    return '';
  }

  /**
   * Apply a class to an entity (use case)
   */
  private applyClassToEntity(entityName: string, className: string): void {
    // Find or create the use case
    let useCase = this.useCases.find((uc) => uc.id === entityName);
    if (!useCase) {
      useCase = {
        id: entityName,
        name: entityName,
        classes: [],
      };
      this.useCases.push(useCase);
    }

    // Add the class if not already present
    if (!useCase.classes) {
      useCase.classes = [];
    }
    if (!useCase.classes.includes(className)) {
      useCase.classes.push(className);
    }
  }

  /**
   * Visit actorDeclaration rule
   * Grammar: actorDeclaration : 'actor' actorName ;
   */
  private visitActorDeclarationImpl(ctx: ActorDeclarationContext): string {
    const actorName = ctx.actorName?.();
    if (actorName) {
      const actorResult = this.visitActorNameImpl(actorName);

      // Add the actor if it doesn't already exist
      const existingActor = this.actors.find((actor) => actor.id === actorResult.name);
      if (!existingActor) {
        this.actors.push({
          id: actorResult.name,
          name: actorResult.name,
          metadata: actorResult.metadata,
        });
      }

      return actorResult.name;
    }
    return '';
  }

  /**
   * Visit nodeIdWithLabel rule
   * Grammar: nodeIdWithLabel : IDENTIFIER '(' nodeLabel ')' ;
   */
  private visitNodeIdWithLabelImpl(ctx: NodeIdWithLabelContext): string {
    let nodeId = '';
    let nodeLabel = '';

    const identifier = ctx.IDENTIFIER?.();
    if (identifier) {
      nodeId = identifier.getText();
    }

    const nodeLabelCtx = ctx.nodeLabel?.();
    if (nodeLabelCtx) {
      nodeLabel = this.visitNodeLabelImpl(nodeLabelCtx);
    }

    // Create or update the use case with nodeId and label
    const existingUseCase = this.useCases.find((uc) => uc.id === nodeLabel || uc.nodeId === nodeId);
    if (existingUseCase) {
      // Update existing use case with nodeId if not already set
      existingUseCase.nodeId ??= nodeId;
    } else {
      // Create new use case with nodeId and label
      this.useCases.push({
        id: nodeLabel,
        name: nodeLabel,
        nodeId: nodeId,
      });
    }

    return nodeLabel; // Return the label as the entity name for relationships
  }

  /**
   * Visit nodeLabel rule
   * Grammar: nodeLabel : IDENTIFIER | STRING | nodeLabel IDENTIFIER | nodeLabel STRING ;
   */
  private visitNodeLabelImpl(ctx: NodeLabelContext): string {
    const parts: string[] = [];

    // Handle recursive nodeLabel structure
    const nodeLabel = ctx.nodeLabel?.();
    if (nodeLabel) {
      parts.push(this.visitNodeLabelImpl(nodeLabel));
    }

    const identifier = ctx.IDENTIFIER?.();
    if (identifier) {
      parts.push(identifier.getText());
    } else {
      const string = ctx.STRING?.();
      if (string) {
        const text = string.getText();
        // Remove quotes from string
        parts.push(text.slice(1, -1));
      }
    }

    return parts.join(' ');
  }

  /**
   * Visit arrow rule
   * Grammar: arrow : SOLID_ARROW | BACK_ARROW | LINE_SOLID | CIRCLE_ARROW | CROSS_ARROW | CIRCLE_ARROW_REVERSED | CROSS_ARROW_REVERSED | labeledArrow ;
   */
  private visitArrowImpl(ctx: ArrowContext): { arrowType: ArrowType; label?: string } {
    // Check if this is a labeled arrow
    if (ctx.labeledArrow()) {
      return this.visitLabeledArrowImpl(ctx.labeledArrow()!);
    }

    // Regular arrow without label - determine type from token
    if (ctx.SOLID_ARROW()) {
      return { arrowType: ARROW_TYPE.SOLID_ARROW };
    } else if (ctx.BACK_ARROW()) {
      return { arrowType: ARROW_TYPE.BACK_ARROW };
    } else if (ctx.LINE_SOLID()) {
      return { arrowType: ARROW_TYPE.LINE_SOLID };
    } else if (ctx.CIRCLE_ARROW()) {
      return { arrowType: ARROW_TYPE.CIRCLE_ARROW };
    } else if (ctx.CROSS_ARROW()) {
      return { arrowType: ARROW_TYPE.CROSS_ARROW };
    } else if (ctx.CIRCLE_ARROW_REVERSED()) {
      return { arrowType: ARROW_TYPE.CIRCLE_ARROW_REVERSED };
    } else if (ctx.CROSS_ARROW_REVERSED()) {
      return { arrowType: ARROW_TYPE.CROSS_ARROW_REVERSED };
    }

    // Fallback (should not happen with proper grammar)
    return { arrowType: ARROW_TYPE.SOLID_ARROW };
  }

  /**
   * Visit labeled arrow rule
   * Grammar: labeledArrow : LINE_SOLID edgeLabel SOLID_ARROW | BACK_ARROW edgeLabel LINE_SOLID | LINE_SOLID edgeLabel LINE_SOLID | LINE_SOLID edgeLabel CIRCLE_ARROW | LINE_SOLID edgeLabel CROSS_ARROW | CIRCLE_ARROW_REVERSED edgeLabel LINE_SOLID | CROSS_ARROW_REVERSED edgeLabel LINE_SOLID ;
   */
  private visitLabeledArrowImpl(ctx: LabeledArrowContext): { arrowType: ArrowType; label: string } {
    const label = this.visitEdgeLabelImpl(ctx.edgeLabel());

    // Determine arrow type based on the tokens present
    if (ctx.SOLID_ARROW()) {
      return { arrowType: ARROW_TYPE.SOLID_ARROW, label };
    } else if (ctx.BACK_ARROW()) {
      return { arrowType: ARROW_TYPE.BACK_ARROW, label };
    } else if (ctx.CIRCLE_ARROW()) {
      return { arrowType: ARROW_TYPE.CIRCLE_ARROW, label };
    } else if (ctx.CROSS_ARROW()) {
      return { arrowType: ARROW_TYPE.CROSS_ARROW, label };
    } else if (ctx.CIRCLE_ARROW_REVERSED()) {
      return { arrowType: ARROW_TYPE.CIRCLE_ARROW_REVERSED, label };
    } else if (ctx.CROSS_ARROW_REVERSED()) {
      return { arrowType: ARROW_TYPE.CROSS_ARROW_REVERSED, label };
    } else {
      return { arrowType: ARROW_TYPE.LINE_SOLID, label };
    }
  }

  /**
   * Visit edge label rule
   * Grammar: edgeLabel : IDENTIFIER | STRING ;
   */
  private visitEdgeLabelImpl(ctx: EdgeLabelContext): string {
    const text = ctx.getText();
    // Remove quotes if it's a string
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      return text.slice(1, -1);
    }
    return text;
  }

  /**
   * Visit directionStatement rule
   * Grammar: directionStatement : 'direction' direction NEWLINE* ;
   */
  visitDirectionStatementImpl(ctx: DirectionStatementContext): void {
    const directionCtx = ctx.direction?.();
    if (directionCtx) {
      this.direction = this.visitDirectionImpl(directionCtx);
    }
  }

  /**
   * Visit direction rule
   * Grammar: direction : 'TB' | 'TD' | 'BT' | 'RL' | 'LR' ;
   */
  private visitDirectionImpl(ctx: DirectionContext): string {
    const text = ctx.getText();
    // Normalize TD to TB (same as flowchart)
    if (text === 'TD') {
      return 'TB';
    }
    return text;
  }

  /**
   * Visit classDefStatement rule
   * Grammar: classDefStatement : 'classDef' IDENTIFIER stylesOpt NEWLINE* ;
   */
  visitClassDefStatementImpl(ctx: ClassDefStatementContext): void {
    const className = ctx.IDENTIFIER().getText();
    const stylesOptCtx = ctx.stylesOpt();

    // Get all style properties as an array of strings
    const styles = this.visitStylesOptImpl(stylesOptCtx);

    this.classDefs.set(className, {
      id: className,
      styles,
    });
  }

  /**
   * Visit stylesOpt rule
   * Grammar: stylesOpt : style | stylesOpt COMMA style ;
   * Returns an array of style strings like ['stroke:#f00', 'fill:#ff0']
   */
  private visitStylesOptImpl(ctx: any): string[] {
    const styles: string[] = [];

    // Check if this is a recursive stylesOpt (stylesOpt COMMA style)
    const stylesOptCtx = ctx.stylesOpt?.();
    if (stylesOptCtx) {
      styles.push(...this.visitStylesOptImpl(stylesOptCtx));
    }

    // Get the style context
    const styleCtx = ctx.style();
    if (styleCtx) {
      const styleText = this.visitStyleImpl(styleCtx);
      styles.push(styleText);
    }

    return styles;
  }

  /**
   * Visit style rule
   * Grammar: style : styleComponent | style styleComponent ;
   * Returns a single style string like 'stroke:#f00'
   */
  private visitStyleImpl(ctx: any): string {
    // Get all text from the style context
    return ctx.getText();
  }

  /**
   * Visit classStatement rule
   * Grammar: classStatement : 'class' nodeList IDENTIFIER NEWLINE* ;
   */
  visitClassStatementImpl(ctx: ClassStatementContext): void {
    const nodeIds = this.visitNodeListImpl(ctx.nodeList());
    const className = ctx.IDENTIFIER().getText();

    // Apply class to each node
    nodeIds.forEach((nodeId) => {
      this.applyClassToEntity(nodeId, className);
    });
  }

  /**
   * Visit styleStatement rule
   * Grammar: styleStatement : 'style' IDENTIFIER stylesOpt NEWLINE* ;
   */
  visitStyleStatementImpl(ctx: any): void {
    const nodeId = ctx.IDENTIFIER().getText();
    const stylesOptCtx = ctx.stylesOpt();

    // Get all style properties as an array of strings
    const styles = this.visitStylesOptImpl(stylesOptCtx);

    // Apply styles directly to the entity
    let entity = this.useCases.find((uc) => uc.id === nodeId);
    if (!entity) {
      entity = this.actors.find((a) => a.id === nodeId);
    }
    if (!entity) {
      entity = this.systemBoundaries.find((sb) => sb.id === nodeId);
    }

    if (entity) {
      // Initialize styles array if it doesn't exist
      if (!entity.styles) {
        entity.styles = [];
      }
      // Add the new styles
      entity.styles.push(...styles);
    }
  }

  /**
   * Visit nodeList rule
   * Grammar: nodeList : IDENTIFIER (',' IDENTIFIER)* ;
   */
  private visitNodeListImpl(ctx: NodeListContext): string[] {
    const identifiers = ctx.IDENTIFIER();
    return identifiers.map((id) => id.getText());
  }

  /**
   * Visit usecaseStatement rule
   * Grammar: usecaseStatement : entityName NEWLINE* ;
   */
  visitUsecaseStatementImpl(ctx: UsecaseStatementContext): void {
    const entityName = this.visitEntityNameImpl(ctx.entityName());

    // Create a standalone use case if it doesn't already exist
    if (!this.useCases.some((uc) => uc.id === entityName)) {
      this.useCases.push({
        id: entityName,
        name: entityName,
      });
    }
  }

  /**
   * Get the parse result after visiting the diagram
   */
  getParseResult(): UsecaseParseResult {
    return {
      actors: this.actors,
      useCases: this.useCases,
      systemBoundaries: this.systemBoundaries,
      relationships: this.relationships,
      classDefs: this.classDefs,
      direction: this.direction,
    };
  }
}
