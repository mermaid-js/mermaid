import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { MermaidAstType, MindmapDoc } from '../generated/ast.js';
import type { MindmapServices } from './module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MindmapServices) {
  console.debug('MindmapValidator registerValidationChecks');
  const validator = services.validation.MindmapValidator;
  const registry = services.validation.ValidationRegistry;
  if (registry) {
    console.debug('MindmapValidator registerValidationChecks registry');
    // Use any to bypass type checking since we know MindmapDoc is part of the AST
    // but the type system is having trouble with it
    const checks: ValidationChecks<MermaidAstType> = {
      MindmapDoc: validator.checkSingleRoot,
      MindmapRow: validator.checkSingleRootRow,
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
  checkSingleRootRow(_doc: MindmapDoc, _accept: ValidationAcceptor): void {
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
      console.debug('ROW BY ROW', row.indent);
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
        console.debug('FAIL 1', rootNodeIndentation, row.indent);
        // If we've already found a root node, report an error
        accept('error', 'Multiple root nodes are not allowed in a mindmap.', {
          node: row,
          property: 'item',
        });
      } else if (rootNodeIndentation >= row.indent) {
        console.debug('FAIL 2', rootNodeIndentation, row.indent, row.item);
        accept('error', 'Multiple root nodes are not allowed in a mindmap.', {
          node: row,
          property: 'item',
        });
      }
    }
  }
}
