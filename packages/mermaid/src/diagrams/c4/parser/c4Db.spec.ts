import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('C4 style colour storage', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should not store a raw semicolon-bearing UpdateElementStyle colour', function () {
    c4.parser.parse(`C4Context
Person(customerA, "Banking Customer A")
UpdateElementStyle(customerA, $bgColor="red;color:lime", $fontColor="red;color:lime", $borderColor="red;color:lime")`);

    const shape = c4.parser.yy.getC4ShapeArray()[0];
    expect(shape.bgColor ?? '').not.toContain(';');
    expect(shape.fontColor ?? '').not.toContain(';');
    expect(shape.borderColor ?? '').not.toContain(';');
    expect(shape.bgColor).not.toBe('red;color:lime');
    expect(shape.fontColor).not.toBe('red;color:lime');
    expect(shape.borderColor).not.toBe('red;color:lime');
  });

  it('should still store a valid UpdateElementStyle colour', function () {
    c4.parser.parse(`C4Context
Person(customerA, "Banking Customer A")
UpdateElementStyle(customerA, $bgColor="grey", $fontColor="red", $borderColor="#00ff00")`);

    const shape = c4.parser.yy.getC4ShapeArray()[0];
    expect(shape.bgColor).toBe('grey');
    expect(shape.fontColor).toBe('red');
    expect(shape.borderColor).toBe('#00ff00');
  });

  it('should not store a raw semicolon-bearing UpdateRelStyle colour', function () {
    c4.parser.parse(`C4Context
Person(customerA, "Banking Customer A")
System(bank, "Bank")
Rel(customerA, bank, "Uses")
UpdateRelStyle(customerA, bank, $textColor="red;color:lime", $lineColor="blue;background:url(https://example.invalid)")`);

    const rel = c4.parser.yy.getRels()[0];
    expect(rel.textColor ?? '').not.toContain(';');
    expect(rel.lineColor ?? '').not.toContain(';');
    expect(rel.textColor).not.toBe('red;color:lime');
    expect(rel.lineColor).not.toBe('blue;background:url(https://example.invalid)');
  });

  it('should not store a raw semicolon-bearing UpdateElementStyle colour on a boundary', function () {
    c4.parser.parse(`C4Context
Boundary(b1, "BankBoundary") {
System(SystemAA, "Internet Banking System")
}
UpdateElementStyle(b1, $bgColor="red;color:lime", $fontColor="red;color:lime", $borderColor="red;color:lime")`);

    const boundary = c4.parser.yy.getBoundaries()[1];
    expect(boundary).toBeDefined();
    expect(boundary.bgColor ?? '').not.toContain(';');
    expect(boundary.fontColor ?? '').not.toContain(';');
    expect(boundary.borderColor ?? '').not.toContain(';');
    expect(boundary.bgColor).not.toBe('red;color:lime');
    expect(boundary.fontColor).not.toBe('red;color:lime');
    expect(boundary.borderColor).not.toBe('red;color:lime');
  });
});
