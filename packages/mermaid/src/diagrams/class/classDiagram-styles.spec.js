import { parser } from './parser/classDiagram.jison';
import classDb from './classDb.ts';

describe('class diagram, ', function () {
  describe('when parsing data from a classDiagram it', function () {
    beforeEach(function () {
      parser.yy = classDb;
      parser.yy.clear();
    });

    it('should be possible to apply a css class to a class directly', function () {
      const str = 'classDiagram\n' + 'class Class01:::exClass';

      parser.parse(str);

      expect(parser.yy.getClass('Class01').cssClasses[0]).toBe('exClass');
    });

    it('should be possible to apply a css class to a class directly with struct', function () {
      const str =
        'classDiagram\n' +
        'class Class1:::exClass {\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.cssClasses[0]).toBe('exClass');
    });

    it('should be possible to apply a css class to a class with relations', function () {
      const str = 'classDiagram\n' + 'Class01 <|-- Class02\ncssClass "Class01" exClass';

      parser.parse(str);

      expect(parser.yy.getClass('Class01').cssClasses[0]).toBe('exClass');
    });

    it('should be possible to apply a cssClass to a class', function () {
      const str = 'classDiagram\n' + 'class Class01\n cssClass "Class01" exClass';

      parser.parse(str);

      expect(parser.yy.getClass('Class01').cssClasses[0]).toBe('exClass');
    });

    it('should be possible to apply a cssClass to a comma separated list of classes', function () {
      const str =
        'classDiagram\n' + 'class Class01\n class Class02\n cssClass "Class01,Class02" exClass';

      parser.parse(str);

      expect(parser.yy.getClass('Class01').cssClasses[0]).toBe('exClass');
      expect(parser.yy.getClass('Class02').cssClasses[0]).toBe('exClass');
    });
  });
});
