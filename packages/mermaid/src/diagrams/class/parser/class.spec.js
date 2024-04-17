import { parser } from './classDiagram.jison';
import classDb from '../classDb.js';

describe('class diagram', function () {
  beforeEach(function () {
    parser.yy = classDb;
    parser.yy.clear();
  });

  describe('prototype properties', function () {
    function validateProperty(prop) {
      expect(() => parser.parse(`classDiagram\nclass ${prop}`)).not.toThrow();
      expect(() => parser.parse(`classDiagram\nnamespace ${prop} {\n\tclass A\n}`)).not.toThrow();
    }

    it('should work with a __proto__ property', function () {
      validateProperty('__proto__');
    });

    it('should work with a constructor property', function () {
      validateProperty('constructor');
    });
  });
});
