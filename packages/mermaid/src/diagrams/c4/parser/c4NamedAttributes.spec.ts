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

  // `Container` takes `techn` before `descr`, so a named `$descr` here lands in the
  // `techn` slot. The techn handler assigned it correctly, and then the descr handler's
  // "argument absent" branch overwrote it with an empty default - the description was
  // silently lost rather than misshaped.
  it('keeps a named $descr that lands in an earlier slot', function () {
    c4.parser.parse(`C4Container\nContainer(c, "C", $descr="a description")`);

    expect(c4.parser.yy.getC4ShapeArray()[0].descr.text).toBe('a description');
  });

  it('still defaults descr to empty when it is genuinely absent', function () {
    c4.parser.parse(`C4Container\nContainer(c, "C", $techn="Java")`);

    const [shape] = c4.parser.yy.getC4ShapeArray();
    expect(shape.techn.text).toBe('Java');
    expect(shape.descr.text).toBe('');
  });

  it('keeps a named $descr on a relationship, where techn also comes first', function () {
    c4.parser.parse(`C4Context
Person(a, "A")
Person(b, "B")
Rel(a, b, "uses", $descr="how it is used")`);

    expect(c4.parser.yy.getRels()[0].descr.text).toBe('how it is used');
  });

  /**
   * Every kind of declaration, given exactly one named attribute so that it lands in the
   * first optional slot - which is rarely its own. Each bug found in this area so far
   * only showed up for one such combination, so they are enumerated rather than sampled.
   *
   * `descr`, `techn` and `type` are stored as `{ text }`; `tags`, `sprite` and `link` are
   * plain strings. Which slot the value travelled through must not change that.
   */
  describe('one named attribute, whichever slot it lands in', function () {
    const TEXT_FIELDS = new Set(['descr', 'techn', 'type']);

    const expectField = (subject: Record<string, unknown>, field: string) => {
      if (TEXT_FIELDS.has(field)) {
        expect(subject[field]).toEqual({ text: 'V' });
      } else {
        expect(subject[field]).toBe('V');
      }
    };

    const shape = () => c4.parser.yy.getC4ShapeArray()[0];
    const boundary = () =>
      c4.parser.yy.getBoundaries().find((b: { alias: string }) => b.alias !== 'global');

    const elements: [string, string, string[]][] = [
      ['C4Context', 'System(x, "L", $F="V")', ['descr', 'tags', 'sprite', 'link']],
      ['C4Context', 'Person(x, "L", $F="V")', ['descr', 'tags', 'sprite', 'link']],
      ['C4Container', 'Container(x, "L", $F="V")', ['descr', 'techn', 'tags', 'sprite', 'link']],
      ['C4Component', 'Component(x, "L", $F="V")', ['descr', 'techn', 'tags', 'sprite', 'link']],
    ];
    for (const [header, template, fields] of elements) {
      it.each(fields)(`${template.replace('$F', '$%s')}`, function (field) {
        c4.parser.parse(`${header}\n${template.replace('$F', `$${field}`)}`);
        expectField(shape(), field);
      });
    }

    // `System_Boundary` and `Container_Boundary` splice their kind in as a positional
    // argument, so an explicit `$type` shifts one slot along into `tags`.
    const boundaries: [string, string, string[]][] = [
      ['C4Context', 'System_Boundary(x, "L", $F="V")', ['type', 'tags', 'link']],
      ['C4Container', 'Container_Boundary(x, "L", $F="V")', ['type', 'tags', 'link']],
      ['C4Deployment', 'Node(x, "L", $F="V")', ['type', 'descr', 'tags', 'sprite', 'link']],
    ];
    for (const [header, template, fields] of boundaries) {
      it.each(fields)(`${template.replace('$F', '$%s')}`, function (field) {
        c4.parser.parse(
          `${header}\n${template.replace('$F', `$${field}`)} {\nContainer(i, "I")\n}`
        );
        expectField(boundary(), field);
      });
    }

    it.each(['techn', 'descr', 'tags', 'sprite', 'link'])(
      'Rel(a, b, "uses", $%s="V")',
      function (field) {
        c4.parser.parse(`C4Context
Person(a, "A")
Person(b, "B")
Rel(a, b, "uses", $${field}="V")`);
        expectField(c4.parser.yy.getRels()[0], field);
      }
    );
  });
});
