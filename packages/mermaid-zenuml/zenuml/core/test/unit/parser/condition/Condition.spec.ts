import { describe, expect, it } from 'vitest';
import { Fixture } from '../fixture/Fixture';

describe('Conditions', () => {
  it('parse complex condition in if statement', () => {
    const code = `
      if (
        a == 1 &&
        b != 2 ||
        c = A.isGood(B.isBad())
      ) {
        return true;
      }
    `;

    const ast = Fixture.firstStatement(code);
    expect(ast.alt().ifBlock().parExpr().condition().getFormattedText()).toBe(
      'a == 1 && b != 2 || c = A.isGood(B.isBad())'
    );
  });

  it('parse in express in loop as condition', () => {
    const code = `
      forEach(x in xes) {
        A.method
      }
    `;
    const ast = Fixture.firstStatement(code);
    expect(ast.loop().parExpr().condition().getFormattedText()).toBe('x in xes');
  });
});
