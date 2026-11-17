import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';
import { log } from '../../../logger.js';

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

  describe('UpdateLayoutConfig', function () {
    it.each([
      ['both parameters', 'UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")'],
      ['the first parameter only', 'UpdateLayoutConfig($c4ShapeInRow="2")'],
    ])('should warn that the statement has no effect, with %s', function (_label, statement) {
      const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

      c4.parser.parse(`C4Context
Person(customer, "Customer")
${statement}`);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('UpdateLayoutConfig');
      warn.mockRestore();
    });

    it('should stay silent when the diagram does not use the statement', function () {
      const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

      c4.parser.parse(`C4Context
Person(customer, "Customer")`);

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
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
});
