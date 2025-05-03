import type { DiagramAST } from '@mermaid-js/parser';
import type { DiagramDB } from '../../diagram-api/types.js';

export function populateCommonDb(ast: DiagramAST, db: DiagramDB) {
  if (ast.accDescr?.length > 0) {
    db.setAccDescription?.(ast.accDescr.pop() ?? '');
  }
  if (ast.accTitle?.length > 0) {
    db.setAccTitle?.(ast.accTitle.pop() ?? '');
  }
  if (ast.title?.length > 0) {
    db.setDiagramTitle?.(ast.title.pop() ?? '');
  }
}
