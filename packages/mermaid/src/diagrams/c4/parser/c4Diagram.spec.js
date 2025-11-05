import c4Db from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a C4 diagram', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should handle a trailing whitespaces after statements', function () {
    const whitespace = ' ';
    const rendered = c4.parser.parse(`C4Context${whitespace}
title System Context diagram for Internet Banking System${whitespace}
Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")${whitespace}`);

    expect(rendered).toBe(true);
  });

  it('should handle parameter names that are keywords', function () {
    c4.parser.parse(`C4Context
title title
Person(Person, "Person", "Person")`);

    const yy = c4.parser.yy;
    expect(yy.getTitle()).toBe('title');

    const shapes = yy.getC4ShapeArray();
    expect(shapes.length).toBe(1);
    const onlyShape = shapes[0];

    expect(onlyShape.alias).toBe('Person');
    expect(onlyShape.descr.text).toBe('Person');
    expect(onlyShape.label.text).toBe('Person');
  });

  it('should allow default in the parameters', function () {
    c4.parser.parse(`C4Context
Person(default, "default", "default")`);

    const yy = c4.parser.yy;

    const shapes = yy.getC4ShapeArray();
    expect(shapes.length).toBe(1);
    const onlyShape = shapes[0];

    expect(onlyShape.alias).toBe('default');
    expect(onlyShape.descr.text).toBe('default');
    expect(onlyShape.label.text).toBe('default');
  });

  describe('UpdateRelStyle with lineStyle parameter', function () {
    beforeEach(function () {
      c4.parser.yy.clear();
    });

    it('should handle UpdateRelStyle with $lineStyle="dashed"', function () {
      c4.parser.parse(`C4Context
        Person(user, "User", "A user")
        System(system, "System", "A system")
        Rel(user, system, "Uses")
        UpdateRelStyle(user, system, $lineStyle="dashed")`);

      const yy = c4.parser.yy;
      const rels = yy.getRels();
      expect(rels.length).toBe(1);
      expect(rels[0].lineStyle).toBe('dashed');
    });

    it('should handle UpdateRelStyle with $lineStyle="dotted"', function () {
      c4.parser.parse(`C4Context
        Person(user, "User", "A user")
        System(system, "System", "A system")
        Rel(user, system, "Uses")
        UpdateRelStyle(user, system, $lineStyle="dotted")`);

      const yy = c4.parser.yy;
      const rels = yy.getRels();
      expect(rels.length).toBe(1);
      expect(rels[0].lineStyle).toBe('dotted');
    });

    it('should handle UpdateRelStyle with $lineStyle="solid"', function () {
      c4.parser.parse(`C4Context
        Person(user, "User", "A user")
        System(system, "System", "A system")
        Rel(user, system, "Uses")
        UpdateRelStyle(user, system, $lineStyle="solid")`);

      const yy = c4.parser.yy;
      const rels = yy.getRels();
      expect(rels.length).toBe(1);
      expect(rels[0].lineStyle).toBe('solid');
    });

    it('should handle UpdateRelStyle with multiple parameters including lineStyle', function () {
      c4.parser.parse(`C4Context
        Person(user, "User", "A user")
        System(system, "System", "A system")
        Rel(user, system, "Uses")
        UpdateRelStyle(user, system, $lineStyle="dashed", $lineColor="red")`);

      const yy = c4.parser.yy;
      const rels = yy.getRels();
      expect(rels.length).toBe(1);
      expect(rels[0].lineStyle).toBe('dashed');
      expect(rels[0].lineColor).toBe('red');
    });

    it('should default to solid when lineStyle is not specified', function () {
      c4.parser.parse(`C4Context
        Person(user, "User", "A user")
        System(system, "System", "A system")
        Rel(user, system, "Uses")`);

      const yy = c4.parser.yy;
      const rels = yy.getRels();
      expect(rels.length).toBe(1);
      expect(rels[0].lineStyle).toBeUndefined(); // Will default to solid in rendering
    });

    it('should handle invalid lineStyle values gracefully', function () {
      c4.parser.parse(`C4Context
        Person(user, "User", "A user")
        System(system, "System", "A system")
        Rel(user, system, "Uses")
        UpdateRelStyle(user, system, $lineStyle="invalid")`);

      const yy = c4.parser.yy;
      const rels = yy.getRels();
      expect(rels.length).toBe(1);
      expect(rels[0].lineStyle).toBe('invalid'); // Will be handled in rendering
    });

    it('should update lineStyle on bidirectional relations', function () {
      c4.parser.parse(`C4Context
        Person(user, "User", "A user")
        System(system, "System", "A system")
        BiRel(user, system, "Communicates")
        UpdateRelStyle(user, system, $lineStyle="dashed")`);

      const yy = c4.parser.yy;
      const rels = yy.getRels();
      expect(rels.length).toBe(1);
      expect(rels[0].lineStyle).toBe('dashed');
      expect(rels[0].type).toBe('birel');
    });
  });
});
