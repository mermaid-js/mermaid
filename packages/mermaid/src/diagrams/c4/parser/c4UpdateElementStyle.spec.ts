import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';
import type { C4Boundary } from '../c4Types.js';

setConfig({ securityLevel: 'strict' });

const parse = (text: string) => {
  c4.parser.yy = c4Db;
  c4.parser.yy.clear();
  c4.parser.parse(text);
  return c4.parser.yy;
};

// `$showStereotype` needs no grammar rule of its own: the lexer turns any `$key="value"`
// into a `{ key: value }` pair, and `updateElStyle` writes it to the named field.
describe('UpdateElementStyle $showStereotype', () => {
  it('stores the override on an element', () => {
    const db = parse(`C4Context
Person(customerA, "Banking Customer A")
UpdateElementStyle(customerA, $showStereotype="false")`);

    expect(db.getC4ShapeArray()[0].showStereotype).toBe('false');
  });

  // The statement resolves its alias against the elements first and then the
  // boundaries, so one statement reaches both.
  it('stores the override on a boundary', () => {
    const db = parse(`C4Context
Enterprise_Boundary(b1, "Bank") {
Person(customerA, "Banking Customer A")
}
UpdateElementStyle(b1, $showStereotype="false")`);

    const boundaries: C4Boundary[] = db.getBoundaries();
    expect(boundaries.find((boundary) => boundary.alias === 'b1')?.showStereotype).toBe('false');
  });

  it('leaves the field unset when the statement does not mention it', () => {
    const db = parse(`C4Context
Person(customerA, "Banking Customer A")
UpdateElementStyle(customerA, $bgColor="grey")`);

    expect(db.getC4ShapeArray()[0].showStereotype).toBeUndefined();
    expect(db.getC4ShapeArray()[0].bgColor).toBe('grey');
  });
});
