import type { DiagramAST } from '@mermaid-js/parser';
import type { DiagramDB } from '../../diagram-api/types.js';

export function populateCommonDb(ast: DiagramAST, db: DiagramDB) {
  if (ast.accDescr) {
    db.setAccDescription?.(ast.accDescr);
  }
  if (ast.accTitle) {
    db.setAccTitle?.(ast.accTitle);
  }
  if (ast.title) {
    db.setDiagramTitle?.(ast.title);
  }
}
