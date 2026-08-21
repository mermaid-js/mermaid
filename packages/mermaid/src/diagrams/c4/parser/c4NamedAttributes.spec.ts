import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({ securityLevel: 'strict' });

/**
 * A named attribute can land in a positional slot when the argument before it is omitted.
 * Only the slot's own field is text, so the value must not be wrapped in `{ text }` just
 * because it arrived through a text slot - consumers read `$tags` and `$sprite` as strings.
 */
describe('named attributes arriving in a positional text slot', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('keeps $tags a string when the description is omitted', function () {
    c4.parser.parse(`C4Context\nSystem(s, "S", $tags="cylinder")`);

    expect(c4.parser.yy.getC4ShapeArray()[0].tags).toBe('cylinder');
  });

  it('keeps $tags a string when the description is given', function () {
    c4.parser.parse(`C4Context\nSystem(s, "S", "desc", $tags="cylinder")`);

    const [shape] = c4.parser.yy.getC4ShapeArray();
    expect(shape.tags).toBe('cylinder');
    expect(shape.descr.text).toBe('desc');
  });

  it('still stores the description as text when it is the one named', function () {
    c4.parser.parse(`C4Context\nSystem(s, "S", $descr="a description")`);

    expect(c4.parser.yy.getC4ShapeArray()[0].descr.text).toBe('a description');
  });

  it('keeps $sprite and $link strings on a container', function () {
    c4.parser.parse(`C4Container\nContainer(c, "C", $sprite="browser", $link="https://x.test")`);

    const [shape] = c4.parser.yy.getC4ShapeArray();
    expect(shape.sprite).toBe('browser');
    expect(shape.link).toBe('https://x.test');
  });

  it('keeps a relationship $tags a string when techn and descr are omitted', function () {
    c4.parser.parse(`C4Context
Person(a, "A")
Person(b, "B")
Rel(a, b, "uses", $tags="async")`);

    expect(c4.parser.yy.getRels()[0].tags).toBe('async');
  });
});
