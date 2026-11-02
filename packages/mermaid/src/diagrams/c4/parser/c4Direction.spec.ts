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
