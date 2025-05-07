import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { MermaidAstType, TreemapDoc, TreemapRow } from '../generated/ast.js';
import type { TreemapServices } from './module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TreemapServices) {
  const validator = services.validation.TreemapValidator;
  const registry = services.validation.ValidationRegistry;
  if (registry) {
    // Use any to bypass type checking since we know TreemapDoc is part of the AST
    // but the type system is having trouble with it
    const checks: ValidationChecks<MermaidAstType> = {
      TreemapDoc: validator.checkSingleRoot.bind(validator),
      TreemapRow: (node: TreemapRow, accept: ValidationAcceptor) => {
        validator.checkSingleRootRow(node, accept);
      },
    };
    registry.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class TreemapValidator {
  constructor() {
    // eslint-disable-next-line no-console
    console.debug('TreemapValidator constructor');
  }
  checkSingleRootRow(_node: TreemapRow, _accept: ValidationAcceptor): void {
    // eslint-disable-next-line no-console
    console.debug('CHECKING SINGLE ROOT Row');
  }

  /**
   * Validates that a treemap has only one root node.
   * A root node is defined as a node that has no indentation.
   */
  checkSingleRoot(doc: TreemapDoc, accept: ValidationAcceptor): void {
    // eslint-disable-next-line no-console
    console.debug('CHECKING SINGLE ROOT');
    let rootNodeIndentation;

    for (const row of doc.TreemapRows) {
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
        accept('error', 'Multiple root nodes are not allowed in a treemap.', {
          node: row,
          property: 'item',
        });
      } else if (
        rootNodeIndentation !== undefined &&
        rootNodeIndentation >= parseInt(row.indent, 10)
      ) {
        accept('error', 'Multiple root nodes are not allowed in a treemap.', {
          node: row,
          property: 'item',
        });
      }
    }
  }
}
