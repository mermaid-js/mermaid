import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

beforeEach(function () {
  c4.parser.yy = c4Db;
  c4.parser.yy.clear();
});

describe('the words "direction LR" inside C4 text', function () {
  it('stay part of an element description', function () {
    c4.parser.parse(`C4Container
Container(api, "API", "Go", "Sets the direction LR for the whole flow")
Container(store, "Store", "SQL", "Keeps direction TB data")`);

    expect(c4Db.getC4ShapeArray().map((shape) => shape.alias)).toEqual(['api', 'store']);
  });

  it('stay part of a title', function () {
    c4.parser.parse(`C4Container
title Order flow, direction LR view
Person(buyer, "Buyer")`);

    expect(c4Db.getTitle()).toBe('Order flow, direction LR view');
    expect(c4Db.getC4ShapeArray().map((shape) => shape.alias)).toEqual(['buyer']);
  });

  it('stay part of an accessibility description', function () {
    c4.parser.parse(`C4Container
accDescr: Reads in direction RL
Person(buyer, "Buyer")`);

    expect(c4Db.getAccDescription()).toBe('Reads in direction RL');
  });
});

const boundaryOf = (alias: string) =>
  c4Db.getBoundaries().find((boundary) => boundary.alias === alias);

describe('a direction statement inside a boundary', function () {
  it.each(['TB', 'BT', 'LR', 'RL'])('stores %s on that boundary', function (direction) {
    c4.parser.parse(`C4Container
Container_Boundary(shop, "Web shop") {
  direction ${direction}
  Container(cart, "Cart", "Python")
}`);

    expect(boundaryOf('shop')?.direction).toBe(direction);
    expect(c4Db.getC4ShapeArray().map((shape) => shape.alias)).toEqual(['cart']);
  });

  it.each([
    ['first', 'direction LR\n  Container(cart, "Cart")\n  Container(order, "Order")'],
    ['between elements', 'Container(cart, "Cart")\n  direction LR\n  Container(order, "Order")'],
    ['last', 'Container(cart, "Cart")\n  Container(order, "Order")\n  direction LR'],
  ])('is read when it comes %s', function (_position, body) {
    c4.parser.parse(`C4Container
Container_Boundary(shop, "Web shop") {
  ${body}
}`);

    expect(boundaryOf('shop')?.direction).toBe('LR');
    expect(c4Db.getC4ShapeArray().map((shape) => shape.alias)).toEqual(['cart', 'order']);
  });

  it('leaves a sibling boundary without one', function () {
    c4.parser.parse(`C4Container
Container_Boundary(shop, "Web shop") {
  direction LR
  Container(cart, "Cart")
}
Container_Boundary(warehouse, "Warehouse") {
  Container(pick, "Pick")
}`);

    expect(boundaryOf('shop')?.direction).toBe('LR');
    expect(boundaryOf('warehouse')).not.toHaveProperty('direction');
  });

  it('applies to its own boundary and not to the ones nested in it', function () {
    c4.parser.parse(`C4Container
Container_Boundary(outer, "Outer") {
  Container_Boundary(inner, "Inner") {
    direction RL
    Container(a, "A")
  }
  direction TB
  Container(b, "B")
}`);

    expect(boundaryOf('inner')?.direction).toBe('RL');
    expect(boundaryOf('outer')?.direction).toBe('TB');
  });

  it('keeps the last one when a boundary says it twice', function () {
    c4.parser.parse(`C4Container
Container_Boundary(shop, "Web shop") {
  direction LR
  Container(cart, "Cart")
  direction BT
}`);

    expect(boundaryOf('shop')?.direction).toBe('BT');
  });

  it('is read inside a deployment node', function () {
    c4.parser.parse(`C4Deployment
Node(server, "Server") {
  direction LR
  Container(app, "App")
}`);

    expect(boundaryOf('server')?.direction).toBe('LR');
  });

  it('does not outlive a clear()', function () {
    c4.parser.parse(`C4Container
Container_Boundary(shop, "Web shop") {
  direction LR
  Container(cart, "Cart")
}`);
    c4Db.clear();
    c4.parser.parse(`C4Container
Container_Boundary(shop, "Web shop") {
  Container(cart, "Cart")
}`);

    expect(boundaryOf('shop')).not.toHaveProperty('direction');
  });
});

describe('a direction statement outside any boundary', function () {
  it('is refused, naming where it belongs', function () {
    expect(() =>
      c4.parser.parse(`C4Container
direction LR
Person(buyer, "Buyer")`)
    ).toThrow(/inside a boundary/);
  });
});
