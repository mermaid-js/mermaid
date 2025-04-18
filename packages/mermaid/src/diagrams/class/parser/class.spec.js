import { parser } from './classDiagram.jison';
import { ClassDB } from '../classDb.js';

describe('class diagram', function () {
  let classDb;
  beforeEach(function () {
    classDb = new ClassDB();
    parser.yy = classDb;
    parser.yy.clear();
  });

  describe('prototype properties', function () {
    it.each(['__proto__', 'constructor'])('should work with a %s property', function (prop) {
      expect(() => parser.parse(`classDiagram\nclass ${prop}`)).not.toThrow();
      expect(() => parser.parse(`classDiagram\nnamespace ${prop} {\n\tclass A\n}`)).not.toThrow();
    });
  });
});
