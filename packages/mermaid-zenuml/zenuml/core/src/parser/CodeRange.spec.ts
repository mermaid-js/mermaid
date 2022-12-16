import { Fixture } from '../../test/unit/parser/fixture/Fixture';
import { CodeRange } from '@/parser/CodeRange';

describe('CodeRange', () => {
  it('should have an start and an end', () => {
    const message = Fixture.firstStatement('A.m').message();
    const codeRange = CodeRange.from(message);
    expect(codeRange.start.line).toBe(1);
    expect(codeRange.start.col).toBe(0);
    expect(codeRange.stop.line).toBe(1);
    // after 'm'
    expect(codeRange.stop.col).toBe(3);
  });

  it('should have an start and an end', () => {
    const m1 = Fixture.firstStatement('A.m1{\n B.m2}').message();
    const codeRange1 = CodeRange.from(m1);
    expect(codeRange1.start.line).toBe(1);
    expect(codeRange1.start.col).toBe(0);
    // for '}'
    expect(codeRange1.stop.line).toBe(2);
    expect(codeRange1.stop.col).toBe(6);
    const m2 = m1.braceBlock().block().stat()[0].message();
    const codeRange2 = CodeRange.from(m2);
    expect(codeRange2.start.line).toBe(2);
    expect(codeRange2.start.col).toBe(1);
    expect(codeRange2.stop.line).toBe(2);
    // after 'm2'
    expect(codeRange2.stop.col).toBe(5);
  });
});
