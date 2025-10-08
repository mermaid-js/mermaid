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
} from './generated/UsecaseParser.js';
import { ARROW_TYPE } from './types.js';
import type {
  Actor,
  UseCase,
  SystemBoundary,
  Relationship,
  UsecaseParseResult,
  ArrowType,
} from './types.js';

export class UsecaseAntlrVisitor extends UsecaseVisitor<void> {
  private actors: Actor[] = [];
  private useCases: UseCase[] = [];
  private systemBoundaries: SystemBoundary[] = [];
  private relationships: Relationship[] = [];
  private relationshipCounter = 0;
  private direction = 'TB'; // Default direction

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
   * Grammar: statement : actorStatement | relationshipStatement | systemBoundaryStatement | systemBoundaryTypeStatement | directionStatement | NEWLINE ;
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
   * Grammar: usecaseInBoundary : IDENTIFIER | STRING ;
   */
  private visitUsecaseInBoundaryImpl(ctx: UsecaseInBoundaryContext): string {
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
   * Grammar: entityName : IDENTIFIER | STRING | nodeIdWithLabel ;
   */
  private visitEntityNameImpl(ctx: EntityNameContext): string {
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

    const nodeIdWithLabel = ctx.nodeIdWithLabel?.();
    if (nodeIdWithLabel) {
      return this.visitNodeIdWithLabelImpl(nodeIdWithLabel);
    }

    return '';
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
   * Grammar: arrow : SOLID_ARROW | BACK_ARROW | LINE_SOLID | labeledArrow ;
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
    }

    // Fallback (should not happen with proper grammar)
    return { arrowType: ARROW_TYPE.SOLID_ARROW };
  }

  /**
   * Visit labeled arrow rule
   * Grammar: labeledArrow : LINE_SOLID edgeLabel SOLID_ARROW | BACK_ARROW edgeLabel LINE_SOLID | LINE_SOLID edgeLabel LINE_SOLID ;
   */
  private visitLabeledArrowImpl(ctx: LabeledArrowContext): { arrowType: ArrowType; label: string } {
    const label = this.visitEdgeLabelImpl(ctx.edgeLabel());

    // Determine arrow type based on the tokens present
    if (ctx.SOLID_ARROW()) {
      return { arrowType: ARROW_TYPE.SOLID_ARROW, label };
    } else if (ctx.BACK_ARROW()) {
      return { arrowType: ARROW_TYPE.BACK_ARROW, label };
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
   * Get the parse result after visiting the diagram
   */
  getParseResult(): UsecaseParseResult {
    return {
      actors: this.actors,
      useCases: this.useCases,
      systemBoundaries: this.systemBoundaries,
      relationships: this.relationships,
      direction: this.direction,
    };
  }
}
