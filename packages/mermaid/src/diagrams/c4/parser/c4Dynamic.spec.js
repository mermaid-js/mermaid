import c4Db from '../c4Db.js';
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a C4 dynamic diagram', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  it('should allow multiple interactions between components', function () {
    c4.parser.parse(`C4Dynamic
System(a, "A")
System(b, "B")
Rel(a, b, "Interaction 1")
Rel(a, b, "Interaction 2")`);

    const yy = c4.parser.yy;

    expect(yy.getC4Type()).toBe('C4Dynamic');
    const rels = yy.getRels();
    expect(rels.length).toBe(2);
    expect(rels[0].label.text).toBe('Interaction 1');
    expect(rels[1].label.text).toBe('Interaction 2');
  });
});
