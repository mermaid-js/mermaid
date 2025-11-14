import type {
  UsecaseDB,
  Actor,
  UseCase,
  SystemBoundary,
  Relationship,
  ClassDef,
  ArrowType,
} from '../../usecaseTypes.js';
import { ARROW_TYPE } from '../../usecaseTypes.js';
import { log } from '../../../../logger.js';

/**
 * Core shared logic for both Listener and Visitor patterns
 * Contains all the proven parsing logic for usecase diagrams
 */
export class UsecaseParserCore {
  protected db: UsecaseDB;
  protected relationshipCounter = 0;
  protected currentSystemBoundary: string | null = null;
  protected currentSystemBoundaryUseCases: string[] = [];

  constructor(db: UsecaseDB) {
    this.db = db;
  }

  /**
   * Browser-safe environment variable access
   */
  protected getEnvVar(name: string): string | undefined {
    try {
      if (typeof process !== 'undefined' && process.env) {
        return process.env[name];
      }
    } catch (_e) {
      // process is not defined in browser
    }

    // Browser fallback
    if (typeof window !== 'undefined' && (window as any).MERMAID_CONFIG) {
      return (window as any).MERMAID_CONFIG[name];
    }
    return undefined;
  }

  /**
   * Process actor statement
   */
  protected processActorStatement(
    actorId: string,
    actorName: string,
    metadata?: Record<string, string>
  ): void {
    const actor: Actor = {
      id: actorId,
      name: actorName,
      metadata,
    };

    this.db.addActor(actor);
    log.debug(`Processed actor: ${actorId} (${actorName})`);
  }

  /**
   * Process use case statement
   */
  protected processUseCaseStatement(
    useCaseId: string,
    useCaseName: string,
    nodeId?: string,
    classes?: string[]
  ): void {
    const useCase: UseCase = {
      id: useCaseId,
      name: useCaseName,
      nodeId,
      classes,
      systemBoundary: this.currentSystemBoundary ?? undefined,
    };

    this.db.addUseCase(useCase);

    // Add to current system boundary if we're inside one
    if (this.currentSystemBoundary) {
      this.currentSystemBoundaryUseCases.push(useCaseId);
    }

    log.debug(`Processed use case: ${useCaseId} (${useCaseName})`);
  }

  /**
   * Process relationship statement
   */
  protected processRelationship(from: string, to: string, arrowType: number, label?: string): void {
    // Generate IDs for checking if entities exist
    const fromId = this.generateId(from);
    const toId = this.generateId(to);

    // Ensure entities exist - if they're not actors, create them as use cases
    if (!this.db.getActor(fromId) && !this.db.getUseCase(fromId)) {
      this.db.addUseCase({ id: fromId, name: from });
      log.debug(`Auto-created use case: ${fromId} (${from})`);
    }
    if (!this.db.getActor(toId) && !this.db.getUseCase(toId)) {
      this.db.addUseCase({ id: toId, name: to });
      log.debug(`Auto-created use case: ${toId} (${to})`);
    }

    const relationshipId = `rel_${this.relationshipCounter++}`;

    // Determine relationship type based on arrow type and label
    let type: 'association' | 'include' | 'extend' = 'association';
    if (label) {
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('include')) {
        type = 'include';
      } else if (lowerLabel.includes('extend')) {
        type = 'extend';
      }
    }

    const relationship: Relationship = {
      id: relationshipId,
      from: fromId,
      to: toId,
      type,
      arrowType: arrowType as ArrowType,
      label,
    };

    this.db.addRelationship(relationship);
    log.debug(`Processed relationship: ${fromId} -> ${toId} (${type})`);
  }

  /**
   * Process system boundary start
   */
  protected processSystemBoundaryStart(boundaryId: string, boundaryName: string): void {
    this.currentSystemBoundary = boundaryId;
    this.currentSystemBoundaryUseCases = [];
    log.debug(`Started system boundary: ${boundaryId} (${boundaryName})`);
  }

  /**
   * Process system boundary end
   */
  protected processSystemBoundaryEnd(): void {
    if (this.currentSystemBoundary) {
      const systemBoundary: SystemBoundary = {
        id: this.currentSystemBoundary,
        name: this.currentSystemBoundary,
        useCases: [...this.currentSystemBoundaryUseCases],
      };

      this.db.addSystemBoundary(systemBoundary);
      log.debug(`Ended system boundary: ${this.currentSystemBoundary}`);

      this.currentSystemBoundary = null;
      this.currentSystemBoundaryUseCases = [];
    }
  }

  /**
   * Process system boundary type
   */
  protected processSystemBoundaryType(boundaryId: string, type: 'package' | 'rect'): void {
    const boundary = this.db.getSystemBoundary(boundaryId);
    if (boundary) {
      boundary.type = type;
      log.debug(`Set system boundary type: ${boundaryId} -> ${type}`);
    }
  }

  /**
   * Process direction statement
   */
  protected processDirectionStatement(direction: string): void {
    const normalizedDirection = this.normalizeDirection(direction);
    this.db.setDirection(normalizedDirection as any);
    log.debug(`Set direction: ${normalizedDirection}`);
  }

  /**
   * Normalize direction
   */
  protected normalizeDirection(dir: string): string {
    switch (dir) {
      case 'TD':
        return 'TB';
      default:
        return dir;
    }
  }

  /**
   * Process class definition statement
   */
  protected processClassDefStatement(classId: string, styles: string[]): void {
    const classDef: ClassDef = {
      id: classId,
      styles,
    };

    this.db.addClassDef(classDef);
    log.debug(`Processed class definition: ${classId}`);
  }

  /**
   * Process class statement (apply class to nodes)
   */
  protected processClassStatement(nodeIds: string[], classId: string): void {
    for (const nodeId of nodeIds) {
      const useCase = this.db.getUseCase(nodeId);
      if (useCase) {
        if (!useCase.classes) {
          useCase.classes = [];
        }
        if (!useCase.classes.includes(classId)) {
          useCase.classes.push(classId);
        }
        log.debug(`Applied class ${classId} to use case ${nodeId}`);
      }
    }
  }

  /**
   * Process style statement (apply styles directly to node)
   */
  protected processStyleStatement(nodeId: string, styles: string[]): void {
    const useCase = this.db.getUseCase(nodeId);
    if (useCase) {
      useCase.styles = styles;
      log.debug(`Applied styles to use case ${nodeId}`);
    }

    const actor = this.db.getActor(nodeId);
    if (actor) {
      actor.styles = styles;
      log.debug(`Applied styles to actor ${nodeId}`);
    }
  }

  /**
   * Extract text from string (remove quotes)
   */
  protected extractString(text: string): string {
    if (!text) {
      return '';
    }

    // Remove surrounding quotes
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      return text.slice(1, -1);
    }

    return text;
  }

  /**
   * Parse arrow type from token
   */
  protected parseArrowType(arrowText: string): number {
    switch (arrowText) {
      case '-->':
        return ARROW_TYPE.SOLID_ARROW;
      case '<--':
        return ARROW_TYPE.BACK_ARROW;
      case '--':
        return ARROW_TYPE.LINE_SOLID;
      case '--o':
        return ARROW_TYPE.CIRCLE_ARROW;
      case '--x':
        return ARROW_TYPE.CROSS_ARROW;
      case 'o--':
        return ARROW_TYPE.CIRCLE_ARROW_REVERSED;
      case 'x--':
        return ARROW_TYPE.CROSS_ARROW_REVERSED;
      default:
        return ARROW_TYPE.SOLID_ARROW;
    }
  }

  /**
   * Generate unique ID from name
   */
  protected generateId(name: string): string {
    return name.replace(/\W/g, '_');
  }
}
