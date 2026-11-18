import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({ securityLevel: 'strict' });

describe('UpdateLayoutConfig', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('applies positional values in order', function () {
    c4.parser.parse(`C4Context\nUpdateLayoutConfig("3", "1")`);

    expect(c4Db.getC4ShapeInRow()).toBe(3);
    expect(c4Db.getC4BoundaryInRow()).toBe(1);
  });

  it('applies named values in the documented order', function () {
    c4.parser.parse(`C4Context\nUpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")`);

    expect(c4Db.getC4ShapeInRow()).toBe(3);
    expect(c4Db.getC4BoundaryInRow()).toBe(1);
  });

  it('applies named values given in reverse order to the right setting', function () {
    c4.parser.parse(`C4Context\nUpdateLayoutConfig($c4BoundaryInRow="1", $c4ShapeInRow="3")`);

    expect(c4Db.getC4ShapeInRow()).toBe(3);
    expect(c4Db.getC4BoundaryInRow()).toBe(1);
  });

  it('applies a lone $c4BoundaryInRow to boundaries only', function () {
    c4.parser.parse(`C4Context\nUpdateLayoutConfig($c4BoundaryInRow="1")`);

    expect(c4Db.getC4ShapeInRow()).toBe(4);
    expect(c4Db.getC4BoundaryInRow()).toBe(1);
  });

  it('applies a named $c4BoundaryInRow after a positional shape count', function () {
    c4.parser.parse(`C4Context\nUpdateLayoutConfig("3", $c4BoundaryInRow="1")`);

    expect(c4Db.getC4ShapeInRow()).toBe(3);
    expect(c4Db.getC4BoundaryInRow()).toBe(1);
  });
});
