import type { DiagramAST } from 'mermaid-parser';

import type { DiagramDB } from '../../diagram-api/types.js';

export function populateCommonDb(ast: DiagramAST, db: DiagramDB) {
  ast.accDescr && db.setAccDescription?.(ast.accDescr);
  ast.accTitle && db.setAccTitle?.(ast.accTitle);
  ast.title && db.setDiagramTitle?.(ast.title);
}
