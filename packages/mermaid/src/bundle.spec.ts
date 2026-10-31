// @vitest-environment node
// This spec inspects the built artifact on disk, so it needs real file:// URLs
// and a real fs — not the default jsdom environment.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';

// Detect the specific structure from #7953: an expression after an
// unconditional return in the same statement list. This is not a complete
// model of Firefox's parser warnings or JavaScript reachability.
const findUnreachableExpressions = (code: string): string[] => {
  const sourceFile = ts.createSourceFile('bundle.js', code, ts.ScriptTarget.ESNext, false);
  const unreachable: string[] = [];
  const checkStatementList = (statements: ts.NodeArray<ts.Statement>) => {
    const returnIndex = statements.findIndex((s) => s.kind === ts.SyntaxKind.ReturnStatement);
    if (returnIndex === -1) {
      return;
    }
    for (const statement of statements.slice(returnIndex + 1)) {
      if (ts.isExpressionStatement(statement)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(statement.pos);
        unreachable.push(`${line + 1}:${character + 1} ${ts.SyntaxKind[statement.kind]}`);
      }
    }
  };
  const visit = (node: ts.Node) => {
    if (ts.isBlock(node) || ts.isCaseClause(node) || ts.isDefaultClause(node)) {
      checkStatementList(node.statements);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return unreachable;
};

describe('shipped bundles', () => {
  it('detects an expression after an unconditional return', () => {
    expect(findUnreachableExpressions('function f() { return 1; (0, eval)(1); }')).toHaveLength(1);
  });

  it('does not flag an expression after a conditional return', () => {
    expect(
      findUnreachableExpressions('function f() { if (check()) return 1; (0, eval)(1); }')
    ).toEqual([]);
  });

  it('mermaid.min.js contains no expression after an unconditional return', async () => {
    // https://github.com/mermaid-js/mermaid/issues/7953 — Firefox devtools warn
    // "unreachable code after return statement" when parsing mermaid.min.js
    // because a bundled dependency emits e.g. `return n(),n(),e;(0,eval)(e)`.
    const bundlePath = fileURLToPath(new URL('../dist/mermaid.min.js', import.meta.url));
    const code = await readFile(bundlePath, 'utf8');
    expect(findUnreachableExpressions(code)).toEqual([]);
    // Parsing the complete release bundle takes several seconds on a busy host.
  }, 15000);
});
