import type {
  Actor,
  ArrowType,
  ClassDef,
  Relationship,
  SystemBoundary,
  UseCase,
  UsecaseDB,
} from '../usecaseTypes.js';
import { ARROW_TYPE } from '../usecaseTypes.js';

/** Stateful DB population shared by the stateless CST visitor methods during one parse. */
export class UsecaseModelBuilder {
  private relationshipCounter = 0;
  private currentSystemBoundary: string | null = null;
  private currentSystemBoundaryUseCases: string[] = [];

  constructor(private readonly db: UsecaseDB) {}

  reset(): void {
    this.relationshipCounter = 0;
    this.currentSystemBoundary = null;
    this.currentSystemBoundaryUseCases = [];
  }

  addActor(actorName: string, metadata?: Record<string, string>): string {
    const actorId = this.generateId(actorName);
    const actor: Actor = { id: actorId, name: actorName, metadata };
    this.db.addActor(actor);
    return actorName;
  }

  addUseCase(useCaseId: string, useCaseName: string, classes?: string[]): void {
    const useCase: UseCase = {
      id: useCaseId,
      name: useCaseName,
      classes,
      systemBoundary: this.currentSystemBoundary ?? undefined,
    };
    this.db.addUseCase(useCase);
    if (this.currentSystemBoundary) {
      this.currentSystemBoundaryUseCases.push(useCaseId);
    }
  }

  addRelationship(from: string, to: string, arrowType: ArrowType, label?: string): void {
    const fromId = this.generateId(from);
    const toId = this.generateId(to);

    if (!this.db.getActor(fromId) && !this.db.getUseCase(fromId)) {
      this.db.addUseCase({ id: fromId, name: from });
    }
    if (!this.db.getActor(toId) && !this.db.getUseCase(toId)) {
      this.db.addUseCase({ id: toId, name: to });
    }

    let type: Relationship['type'] = 'association';
    const normalizedLabel = label?.toLowerCase();
    if (normalizedLabel?.includes('include')) {
      type = 'include';
    } else if (normalizedLabel?.includes('extend')) {
      type = 'extend';
    }

    const relationship: Relationship = {
      id: `rel_${this.relationshipCounter++}`,
      from: fromId,
      to: toId,
      type,
      arrowType,
      label,
    };
    this.db.addRelationship(relationship);
  }

  startSystemBoundary(boundaryId: string): void {
    this.currentSystemBoundary = boundaryId;
    this.currentSystemBoundaryUseCases = [];
  }

  endSystemBoundary(): void {
    if (!this.currentSystemBoundary) {
      return;
    }
    const systemBoundary: SystemBoundary = {
      id: this.currentSystemBoundary,
      name: this.currentSystemBoundary,
      useCases: [...this.currentSystemBoundaryUseCases],
    };
    this.db.addSystemBoundary(systemBoundary);
    this.currentSystemBoundary = null;
    this.currentSystemBoundaryUseCases = [];
  }

  setSystemBoundaryType(boundaryId: string, type: 'package' | 'rect'): void {
    const boundary = this.db.getSystemBoundary(boundaryId);
    if (boundary) {
      boundary.type = type;
    }
  }

  setDirection(direction: string): void {
    this.db.setDirection(direction === 'TD' ? 'TB' : (direction as 'TB' | 'BT' | 'RL' | 'LR'));
  }

  addClassDef(classId: string, styles: string[]): void {
    const classDef: ClassDef = { id: classId, styles };
    this.db.addClassDef(classDef);
  }

  applyClass(nodeIds: string[], classId: string): void {
    for (const nodeId of nodeIds) {
      const useCase = this.db.getUseCase(nodeId);
      if (!useCase) {
        continue;
      }
      useCase.classes ??= [];
      if (!useCase.classes.includes(classId)) {
        useCase.classes.push(classId);
      }
    }
  }

  applyStyles(nodeId: string, styles: string[]): void {
    const useCase = this.db.getUseCase(nodeId);
    if (useCase) {
      useCase.styles = styles;
    }
    const actor = this.db.getActor(nodeId);
    if (actor) {
      actor.styles = styles;
    }
  }

  arrowType(arrowText: string): ArrowType {
    switch (arrowText) {
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

  generateId(name: string): string {
    return name.replace(/\W/g, '_');
  }
}
