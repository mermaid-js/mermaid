import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { MermaidAstType, MindmapDoc, MindmapRow } from '../generated/ast.js';
import type { MindmapServices } from './module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MindmapServices) {
  const validator = services.validation.MindmapValidator;
  const registry = services.validation.ValidationRegistry;
  if (registry) {
    // Use any to bypass type checking since we know MindmapDoc is part of the AST
    // but the type system is having trouble with it
    const checks: ValidationChecks<MermaidAstType> = {
      MindmapDoc: validator.checkSingleRoot.bind(validator),
      MindmapRow: (node: MindmapRow, accept: ValidationAcceptor) => {
        validator.checkSingleRootRow(node, accept);
      },
    };
    registry.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class MindmapValidator {
  constructor() {
    // eslint-disable-next-line no-console
    console.debug('MindmapValidator constructor');
  }
  checkSingleRootRow(_node: MindmapRow, _accept: ValidationAcceptor): void {
    // eslint-disable-next-line no-console
    console.debug('CHECKING SINGLE ROOT Row');
  }

  /**
   * Validates that a mindmap has only one root node.
   * A root node is defined as a node that has no indentation.
   */
  checkSingleRoot(doc: MindmapDoc, accept: ValidationAcceptor): void {
    // eslint-disable-next-line no-console
    console.debug('CHECKING SINGLE ROOT');
    let rootNodeIndentation;

    for (const row of doc.MindmapRows) {
      // Skip non-node items (e.g., class decorations, icon decorations)
      if (
        !row.item ||
        row.item.$type === 'ClassDecoration' ||
        row.item.$type === 'IconDecoration'
      ) {
        continue;
      }
      if (
        rootNodeIndentation === undefined && // Check if this is a root node (no indentation)
        row.indent === undefined
      ) {
        rootNodeIndentation = 0;
      } else if (row.indent === undefined) {
        // If we've already found a root node, report an error
        accept('error', 'Multiple root nodes are not allowed in a mindmap.', {
          node: row,
          property: 'item',
        });
      } else if (
        rootNodeIndentation !== undefined &&
        rootNodeIndentation >= parseInt(row.indent, 10)
      ) {
        accept('error', 'Multiple root nodes are not allowed in a mindmap.', {
          node: row,
          property: 'item',
        });
      }
    }
  }
}
