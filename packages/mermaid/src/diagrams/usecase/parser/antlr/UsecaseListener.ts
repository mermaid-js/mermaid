import type { ParseTreeListener } from 'antlr4ng';
import { UsecaseParserCore } from './UsecaseParserCore.js';
import { log } from '../../../../logger.js';
import type { UsecaseDB } from '../../usecaseTypes.js';

/**
 * Listener implementation that builds the usecase model
 * Extends the core logic to ensure consistency with Visitor pattern
 */
export class UsecaseListener extends UsecaseParserCore implements ParseTreeListener {
  constructor(db: UsecaseDB) {
    super(db);
    log.debug('👂 UsecaseListener: Constructor called');
  }

  // Standard ParseTreeListener methods
  enterEveryRule = (ctx: any) => {
    if (this.getEnvVar('ANTLR_DEBUG') === 'true') {
      const ruleName = ctx.constructor.name;
      log.debug('🔍 UsecaseListener: Entering rule:', ruleName);
    }
  };

  exitEveryRule = (ctx: any) => {
    if (this.getEnvVar('ANTLR_DEBUG') === 'true') {
      const ruleName = ctx.constructor.name;
      log.debug('🔍 UsecaseListener: Exiting rule:', ruleName);
    }
  };

  visitTerminal = (_node: any) => {
    // Optional: Handle terminal nodes
  };

  visitErrorNode = (_node: any) => {
    log.debug('❌ UsecaseListener: Error node encountered');
  };

  // Actor statement
  exitActorName = (ctx: any) => {
    let actorName = '';

    if (ctx.IDENTIFIER()) {
      actorName = ctx.IDENTIFIER().getText();
    } else if (ctx.STRING()) {
      actorName = this.extractString(ctx.STRING().getText());
    }

    const actorId = this.generateId(actorName);

    // Process metadata if present
    let metadata: Record<string, string> | undefined;
    if (ctx.metadata()) {
      metadata = this.extractMetadata(ctx.metadata());
    }

    this.processActorStatement(actorId, actorName, metadata);
  };

  // Relationship statement
  exitRelationshipStatement = (ctx: any) => {
    let from = '';
    let to = '';
    let arrowType = 0;
    let label: string | undefined;

    // Get entity names
    const entityNames = ctx.entityName();
    if (entityNames && entityNames.length >= 2) {
      from = this.extractEntityName(entityNames[0]);
      to = this.extractEntityName(entityNames[1]);
    } else if (ctx.actorDeclaration()) {
      from = this.extractActorDeclaration(ctx.actorDeclaration());
      if (entityNames && entityNames.length >= 1) {
        to = this.extractEntityName(entityNames[0]);
      }
    }

    // Get arrow type
    const arrow = ctx.arrow();
    if (arrow) {
      const arrowResult = this.extractArrow(arrow);
      arrowType = arrowResult.type;
      label = arrowResult.label;
    }

    this.processRelationship(from, to, arrowType, label);
  };

  // System boundary statement
  enterSystemBoundaryStatement = (ctx: any) => {
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
  };

  exitSystemBoundaryStatement = (_ctx: any) => {
    this.processSystemBoundaryEnd();
  };

  exitUsecaseInBoundary = (ctx: any) => {
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
  };

  // System boundary type statement
  exitSystemBoundaryTypeStatement = (ctx: any) => {
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
  };

  // Direction statement
  exitDirectionStatement = (ctx: any) => {
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
  };

  // Class definition statement
  exitClassDefStatement = (ctx: any) => {
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
  };

  // Class statement
  exitClassStatement = (ctx: any) => {
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
  };

  // Style statement
  exitStyleStatement = (ctx: any) => {
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
  };

  // Usecase statement
  exitUsecaseStatement = (ctx: any) => {
    const entityName = ctx.entityName();
    if (entityName) {
      const useCaseId = this.extractEntityName(entityName);
      this.processUseCaseStatement(useCaseId, useCaseId);
    }
  };

  // Helper methods
  private extractMetadata(ctx: any): Record<string, string> {
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

  private extractEntityName(ctx: any): string {
    if (ctx.nodeIdWithLabel()) {
      const nodeId = ctx.nodeIdWithLabel();
      if (nodeId.IDENTIFIER()) {
        return nodeId.IDENTIFIER().getText();
      }
    }

    if (ctx.IDENTIFIER()) {
      const identifiers = ctx.IDENTIFIER();
      if (Array.isArray(identifiers) && identifiers.length >= 2) {
        return identifiers[0].getText();
      }
      return identifiers.getText ? identifiers.getText() : identifiers[0].getText();
    }

    if (ctx.STRING()) {
      const strings = ctx.STRING();
      const text = strings.getText ? strings.getText() : strings[0].getText();
      return this.extractString(text);
    }

    return '';
  }

  private extractActorDeclaration(ctx: any): string {
    const actorName = ctx.actorName();
    if (actorName) {
      if (actorName.IDENTIFIER()) {
        return actorName.IDENTIFIER().getText();
      } else if (actorName.STRING()) {
        return this.extractString(actorName.STRING().getText());
      }
    }
    return '';
  }

  private extractArrow(ctx: any): { type: number; label?: string } {
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

  private collectStyles(ctx: any, styles: string[]): void {
    if (!ctx) {
      return;
    }

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
