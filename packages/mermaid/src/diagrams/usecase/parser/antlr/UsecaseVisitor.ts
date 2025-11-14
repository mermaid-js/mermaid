import { UsecaseParserCore } from './UsecaseParserCore.js';
import { log } from '../../../../logger.js';
import type { UsecaseDB } from '../../usecaseTypes.js';

/**
 * Visitor implementation that builds the usecase model
 * Uses the same core logic as the Listener for consistency
 */
export class UsecaseVisitor extends UsecaseParserCore {
  private visitCount = 0;

  constructor(db: UsecaseDB) {
    super(db);

    if (this.getEnvVar('ANTLR_DEBUG') === 'true') {
      log.debug('🎯 UsecaseVisitor: Constructor called');
    }
  }

  // Default visitor methods
  visit(tree: any): any {
    const shouldLog = this.getEnvVar('ANTLR_DEBUG') === 'true';

    this.visitCount++;

    if (shouldLog) {
      log.debug(`🔍 UsecaseVisitor: Visiting node type: ${tree.constructor.name}`);
    }

    let result;
    try {
      result = tree.accept(this);
      if (shouldLog) {
        log.debug(`✅ UsecaseVisitor: Successfully visited ${tree.constructor.name}`);
      }
    } catch (error) {
      log.error(`❌ UsecaseVisitor: Error visiting ${tree.constructor.name}:`, error);
      throw error;
    }

    return result;
  }

  visitChildren(node: any): any {
    if (!node) {
      return null;
    }

    let result = null;
    const n = node.getChildCount();
    for (let i = 0; i < n; i++) {
      const child = node.getChild(i);
      if (child) {
        const childResult = child.accept(this);
        if (childResult !== null) {
          result = childResult;
        }
      }
    }

    return result;
  }

  visitTerminal(_node: any): any {
    return null;
  }

  visitErrorNode(_node: any): any {
    log.error('❌ UsecaseVisitor: Error node encountered');
    return null;
  }

  // Start rule
  visitStart(ctx: any): any {
    return this.visitChildren(ctx);
  }

  // Statement rule
  visitStatement(ctx: any): any {
    return this.visitChildren(ctx);
  }

  // Actor statement
  visitActorStatement(ctx: any): any {
    const actorList = ctx.actorList();
    if (actorList) {
      this.visitActorList(actorList);
    }
    return null;
  }

  visitActorList(ctx: any): any {
    const actorNames = ctx.actorName();
    if (actorNames) {
      const names = Array.isArray(actorNames) ? actorNames : [actorNames];
      for (const actorName of names) {
        this.visitActorName(actorName);
      }
    }
    return null;
  }

  visitActorName(ctx: any): any {
    let actorName = '';

    const identifier = ctx.IDENTIFIER();
    if (identifier) {
      actorName = identifier.getText();
    } else {
      const stringToken = ctx.STRING();
      if (stringToken) {
        actorName = this.extractString(stringToken.getText());
      }
    }

    const actorId = this.generateId(actorName);

    // Process metadata if present
    let metadata: Record<string, string> | undefined;
    const metadataCtx = ctx.metadata();
    if (metadataCtx) {
      metadata = this.visitMetadata(metadataCtx);
    }

    this.processActorStatement(actorId, actorName, metadata);
    return null;
  }

  visitMetadata(ctx: any): Record<string, string> {
    const metadata: Record<string, string> = {};
    const content = ctx.metadataContent();
    if (content) {
      const properties = content.metadataProperty();
      const props = Array.isArray(properties) ? properties : [properties];

      for (const prop of props) {
        const strings = prop.STRING();
        if (strings && strings.length >= 2) {
          const key = this.extractString(strings[0].getText());
          const value = this.extractString(strings[1].getText());
          metadata[key] = value;
        }
      }
    }
    return metadata;
  }

  // Relationship statement
  visitRelationshipStatement(ctx: any): any {
    let from = '';
    let to = '';
    let arrowType = 0;
    let label: string | undefined;

    // Get entity names
    const entityNames = ctx.entityName();
    if (entityNames && entityNames.length >= 2) {
      from = this.visitEntityName(entityNames[0]);
      to = this.visitEntityName(entityNames[1]);
    } else if (ctx.actorDeclaration()) {
      from = this.visitActorDeclaration(ctx.actorDeclaration());
      if (entityNames && entityNames.length >= 1) {
        to = this.visitEntityName(entityNames[0]);
      }
    }

    // Get arrow type
    const arrow = ctx.arrow();
    if (arrow) {
      const arrowResult = this.visitArrow(arrow);
      arrowType = arrowResult.type;
      label = arrowResult.label;
    }

    this.processRelationship(from, to, arrowType, label);
    return null;
  }

  visitEntityName(ctx: any): string {
    if (!ctx) {
      return '';
    }

    const nodeIdWithLabel = ctx.nodeIdWithLabel();
    if (nodeIdWithLabel) {
      return this.visitNodeIdWithLabel(nodeIdWithLabel);
    }

    const identifiers = ctx.IDENTIFIER();
    if (identifiers) {
      if (Array.isArray(identifiers) && identifiers.length >= 2) {
        // Has class separator (:::)
        return identifiers[0].getText();
      } else if (Array.isArray(identifiers) && identifiers.length === 1) {
        return identifiers[0].getText();
      }
    }

    const stringToken = ctx.STRING();
    if (stringToken) {
      return this.extractString(stringToken.getText());
    }

    return '';
  }

  visitActorDeclaration(ctx: any): string {
    const actorName = ctx.actorName();
    if (actorName) {
      return this.visitActorName(actorName);
    }
    return '';
  }

  visitNodeIdWithLabel(ctx: any): string {
    if (ctx.IDENTIFIER()) {
      return ctx.IDENTIFIER().getText();
    }
    return '';
  }

  visitArrow(ctx: any): { type: number; label?: string } {
    let arrowText = '';
    let label: string | undefined;

    if (ctx.labeledArrow()) {
      const labeledArrow = ctx.labeledArrow();
      const edgeLabel = labeledArrow.edgeLabel();
      if (edgeLabel) {
        if (edgeLabel.IDENTIFIER()) {
          label = edgeLabel.IDENTIFIER().getText();
        } else if (edgeLabel.STRING()) {
          label = this.extractString(edgeLabel.STRING().getText());
        }
      }

      // Determine arrow type from labeled arrow structure
      if (labeledArrow.SOLID_ARROW()) {
        arrowText = '-->';
      } else if (labeledArrow.BACK_ARROW()) {
        arrowText = '<--';
      } else if (labeledArrow.CIRCLE_ARROW()) {
        arrowText = '--o';
      } else if (labeledArrow.CROSS_ARROW()) {
        arrowText = '--x';
      } else if (labeledArrow.CIRCLE_ARROW_REVERSED()) {
        arrowText = 'o--';
      } else if (labeledArrow.CROSS_ARROW_REVERSED()) {
        arrowText = 'x--';
      } else {
        arrowText = '--';
      }
    } else {
      // Simple arrow
      if (ctx.SOLID_ARROW()) {
        arrowText = '-->';
      } else if (ctx.BACK_ARROW()) {
        arrowText = '<--';
      } else if (ctx.LINE_SOLID()) {
        arrowText = '--';
      } else if (ctx.CIRCLE_ARROW()) {
        arrowText = '--o';
      } else if (ctx.CROSS_ARROW()) {
        arrowText = '--x';
      } else if (ctx.CIRCLE_ARROW_REVERSED()) {
        arrowText = 'o--';
      } else if (ctx.CROSS_ARROW_REVERSED()) {
        arrowText = 'x--';
      }
    }

    return {
      type: this.parseArrowType(arrowText),
      label,
    };
  }

  // System boundary statement
  visitSystemBoundaryStatement(ctx: any): any {
    const boundaryName = ctx.systemBoundaryName();
    let boundaryId = '';
    let boundaryNameText = '';

    if (boundaryName) {
      if (boundaryName.IDENTIFIER()) {
        boundaryNameText = boundaryName.IDENTIFIER().getText();
      } else if (boundaryName.STRING()) {
        boundaryNameText = this.extractString(boundaryName.STRING().getText());
      }
      boundaryId = this.generateId(boundaryNameText);
    }

    this.processSystemBoundaryStart(boundaryId, boundaryNameText);

    // Visit boundary content
    const contents = ctx.systemBoundaryContent();
    if (contents) {
      const contentList = Array.isArray(contents) ? contents : [contents];
      for (const content of contentList) {
        this.visitSystemBoundaryContent(content);
      }
    }

    this.processSystemBoundaryEnd();
    return null;
  }

  visitSystemBoundaryContent(ctx: any): any {
    const usecaseInBoundary = ctx.usecaseInBoundary();
    if (usecaseInBoundary) {
      this.visitUsecaseInBoundary(usecaseInBoundary);
    }
    return null;
  }

  visitUsecaseInBoundary(ctx: any): any {
    let useCaseId = '';
    let useCaseName = '';
    let classes: string[] | undefined;

    if (ctx.usecaseWithClass()) {
      const withClass = ctx.usecaseWithClass();
      if (withClass.IDENTIFIER()) {
        const identifiers = withClass.IDENTIFIER();
        if (Array.isArray(identifiers) && identifiers.length >= 2) {
          useCaseId = identifiers[0].getText();
          useCaseName = useCaseId;
          classes = [identifiers[1].getText()];
        }
      } else if (withClass.STRING()) {
        useCaseName = this.extractString(withClass.STRING().getText());
        useCaseId = this.generateId(useCaseName);
        const identifiers = withClass.IDENTIFIER();
        if (identifiers) {
          classes = [identifiers.getText()];
        }
      }
    } else if (ctx.IDENTIFIER()) {
      useCaseId = ctx.IDENTIFIER().getText();
      useCaseName = useCaseId;
    } else if (ctx.STRING()) {
      useCaseName = this.extractString(ctx.STRING().getText());
      useCaseId = this.generateId(useCaseName);
    }

    if (useCaseId && useCaseName) {
      this.processUseCaseStatement(useCaseId, useCaseName, undefined, classes);
    }

    return null;
  }

  // System boundary type statement
  visitSystemBoundaryTypeStatement(ctx: any): any {
    const boundaryName = ctx.systemBoundaryName();
    let boundaryId = '';

    if (boundaryName) {
      if (boundaryName.IDENTIFIER()) {
        boundaryId = boundaryName.IDENTIFIER().getText();
      } else if (boundaryName.STRING()) {
        boundaryId = this.generateId(this.extractString(boundaryName.STRING().getText()));
      }
    }

    const typeContent = ctx.systemBoundaryTypeContent();
    if (typeContent) {
      const properties = typeContent.systemBoundaryTypeProperty();
      const props = Array.isArray(properties) ? properties : [properties];

      for (const prop of props) {
        const type = prop.systemBoundaryType();
        if (type) {
          let typeValue: 'package' | 'rect' = 'rect';
          if (type.PACKAGE()) {
            typeValue = 'package';
          } else if (type.RECT()) {
            typeValue = 'rect';
          }
          this.processSystemBoundaryType(boundaryId, typeValue);
        }
      }
    }

    return null;
  }

  // Direction statement
  visitDirectionStatement(ctx: any): any {
    const direction = ctx.direction();
    if (direction) {
      let directionText = '';
      if (direction.TB()) {
        directionText = 'TB';
      } else if (direction.TD()) {
        directionText = 'TD';
      } else if (direction.BT()) {
        directionText = 'BT';
      } else if (direction.RL()) {
        directionText = 'RL';
      } else if (direction.LR()) {
        directionText = 'LR';
      }
      this.processDirectionStatement(directionText);
    }
    return null;
  }

  // Class definition statement
  visitClassDefStatement(ctx: any): any {
    let classId = '';
    if (ctx.IDENTIFIER()) {
      classId = ctx.IDENTIFIER().getText();
    }

    const styles: string[] = [];
    const stylesOpt = ctx.stylesOpt();
    if (stylesOpt) {
      this.collectStyles(stylesOpt, styles);
    }

    this.processClassDefStatement(classId, styles);
    return null;
  }

  // Class statement
  visitClassStatement(ctx: any): any {
    const nodeList = ctx.nodeList();
    const nodeIds: string[] = [];

    if (nodeList) {
      const identifiers = nodeList.IDENTIFIER();
      const ids = Array.isArray(identifiers) ? identifiers : [identifiers];
      for (const id of ids) {
        nodeIds.push(id.getText());
      }
    }

    let classId = '';
    const identifiers = ctx.IDENTIFIER();
    if (identifiers) {
      const ids = Array.isArray(identifiers) ? identifiers : [identifiers];
      if (ids.length > 0) {
        classId = ids[ids.length - 1].getText();
      }
    }

    this.processClassStatement(nodeIds, classId);
    return null;
  }

  // Style statement
  visitStyleStatement(ctx: any): any {
    let nodeId = '';
    if (ctx.IDENTIFIER()) {
      nodeId = ctx.IDENTIFIER().getText();
    }

    const styles: string[] = [];
    const stylesOpt = ctx.stylesOpt();
    if (stylesOpt) {
      this.collectStyles(stylesOpt, styles);
    }

    this.processStyleStatement(nodeId, styles);
    return null;
  }

  // Usecase statement
  visitUsecaseStatement(ctx: any): any {
    const entityName = ctx.entityName();
    if (entityName) {
      const useCaseId = this.visitEntityName(entityName);
      this.processUseCaseStatement(useCaseId, useCaseId);
    }
    return null;
  }

  // Helper method to collect styles
  private collectStyles(ctx: any, styles: string[]): void {
    if (!ctx) {
      return;
    }

    // Visit all style components
    const styleComponents = this.getAllStyleComponents(ctx);
    for (const component of styleComponents) {
      styles.push(component.getText());
    }
  }

  private getAllStyleComponents(ctx: any): any[] {
    const components: any[] = [];

    if (ctx.style) {
      const styleCtx = ctx.style();
      if (styleCtx) {
        this.collectStyleComponents(styleCtx, components);
      }
    }

    if (ctx.stylesOpt) {
      const stylesOptList = Array.isArray(ctx.stylesOpt()) ? ctx.stylesOpt() : [ctx.stylesOpt()];
      for (const opt of stylesOptList) {
        if (opt) {
          this.collectStyleComponents(opt, components);
        }
      }
    }

    return components;
  }

  private collectStyleComponents(ctx: any, components: any[]): void {
    if (!ctx) {
      return;
    }

    if (ctx.styleComponent) {
      const comp = ctx.styleComponent();
      if (comp) {
        components.push(comp);
      }
    }

    if (ctx.style) {
      const styleCtx = ctx.style();
      if (styleCtx) {
        this.collectStyleComponents(styleCtx, components);
      }
    }
  }
}
