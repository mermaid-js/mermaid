/* eslint-env jasmine */
import { parser } from './parser/classDiagram';
import classDb from './classDb';

describe('class diagram, ', function () {
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = classDb;
    });

    it('should handle relation definitions', function () {
      const str =
        'classDiagram\n' +
        'Class01 <|-- Class02\n' +
        'Class03 *-- Class04\n' +
        'Class05 o-- Class06\n' +
        'Class07 .. Class08\n' +
        'Class09 -- Class1';

      parser.parse(str);
    });

    it('should handle relation definition of different types and directions', function () {
      const str =
        'classDiagram\n' +
        'Class11 <|.. Class12\n' +
        'Class13 --> Class14\n' +
        'Class15 ..> Class16\n' +
        'Class17 ..|> Class18\n' +
        'Class19 <--* Class20';

      parser.parse(str);
    });

    it('should handle cardinality and labels', function () {
      const str =
        'classDiagram\n' +
        'Class01 "1" *-- "many" Class02 : contains\n' +
        'Class03 o-- Class04 : aggregation\n' +
        'Class05 --> "1" Class06';

      parser.parse(str);
    });

    it('should handle visibility for methods and members', function() {
      const str =
        'classDiagram\n' +
        'class TestClass\n' +
        'TestClass : -int privateMember\n' +
        'TestClass : +int publicMember\n' +
        'TestClass : #int protectedMember\n' +
        'TestClass : -privateMethod()\n' +
        'TestClass : +publicMethod()\n' +
        'TestClass : #protectedMethod()\n';

      parser.parse(str);
    });

    it('should handle generic class', function() {
      const str =
        'classDiagram\n' +
        'class Car~T~\n' +
        'Driver -- Car : drives >\n' +
        'Car *-- Wheel : have 4 >\n' +
        'Car -- Person : < owns';

      parser.parse(str);
    });

    it('should break when another `{`is encountered before closing the first one while defining generic class with brackets', function() {
      const str =
        'classDiagram\n' +
        'class Dummy_Class~T~ {\n' +
        'String data\n' +
        '  void methods()\n' +
        '}\n' +
        '\n' +
        'class Dummy_Class {\n' +
        'class Flight {\n' +
        '   flightNumber : Integer\n' +
        '   departureTime : Date\n' +
        '}';
      let testPased =false;
      try{
        parser.parse(str);
      }catch (error){
        console.log(error.name);
        testPased = true;
      }
      expect(testPased).toBe(true);
    });

    it('should break when EOF is encountered before closing the first `{` while defining generic class with brackets', function() {
      const str =
        'classDiagram\n' +
        'class Dummy_Class~T~ {\n' +
        'String data\n' +
        '  void methods()\n' +
        '}\n' +
        '\n' +
        'class Dummy_Class {\n';
      let testPased =false;
      try{
        parser.parse(str);
      }catch (error){
        console.log(error.name);
        testPased = true;
      }
      expect(testPased).toBe(true);
    });

    it('should handle generic class with brackets', function() {
      const str =
        'classDiagram\n' +
        'class Dummy_Class~T~ {\n' +
        'String data\n' +
        '  void methods()\n' +
        '}\n' +
        '\n' +
        'class Flight {\n' +
        '   flightNumber : Integer\n' +
        '   departureTime : Date\n' +
        '}';

        parser.parse(str);
    });

    it('should handle class definitions', function() {
      const str =
        'classDiagram\n' +
        'class Car\n' +
        'Driver -- Car : drives >\n' +
        'Car *-- Wheel : have 4 >\n' +
        'Car -- Person : < owns';

      parser.parse(str);
    });

    it('should handle method statements', function () {
      const str =
        'classDiagram\n' +
        'Object <|-- ArrayList\n' +
        'Object : equals()\n' +
        'ArrayList : Object[] elementData\n' +
        'ArrayList : size()';

      parser.parse(str);
    });

    it('should handle parsing of method statements grouped by brackets', function () {
      const str =
        'classDiagram\n' +
        'class Dummy_Class {\n' +
        'String data\n' +
        '  void methods()\n' +
        '}\n' +
        '\n' +
        'class Flight {\n' +
        '   flightNumber : Integer\n' +
        '   departureTime : Date\n' +
        '}';

      parser.parse(str);
    });

    it('should handle return types on methods', function () {
      const str =
        'classDiagram\n' +
        'Object <|-- ArrayList\n' +
        'Object : equals()\n' +
        'Object : -Object[] objects\n' +
        'Object : +getObjects() Object[]\n' +
        'ArrayList : Dummy elementData\n' +
        'ArrayList : getDummy() Dummy';

      parser.parse(str);
    });

    it('should handle return types on methods grouped by brackets', function () {
      const str =
        'classDiagram\n' +
        'class Dummy_Class {\n' +
        'string data\n' +
        'getDummy() Dummy\n' +
        '}\n' +
        '\n' +
        'class Flight {\n' +
        '   int flightNumber\n' +
        '   datetime departureTime\n' +
        '   getDepartureTime() datetime\n' +
        '}';

      parser.parse(str);
    });

    it('should handle parsing of separators', function () {
      const str =
        'classDiagram\n' +
        'class Foo1 {\n' +
        '  You can use\n' +
        '  several lines\n' +
        '..\n' +
        'as you want\n' +
        'and group\n' +
        '==\n' +
        'things together.\n' +
        '__\n' +
        'You can have as many groups\n' +
        'as you want\n' +
        '--\n' +
        'End of class\n' +
        '}\n' +
        '\n' +
        'class User {\n' +
        '.. Simple Getter ..\n' +
        '+ getName()\n' +
        '+ getAddress()\n' +
        '.. Some setter ..\n' +
        '+ setName()\n' +
        '__ private data __\n' +
        'int age\n' +
        '-- encrypted --\n' +
        'String password\n' +
        '}';

      parser.parse(str);
    });

    it('should handle a comment', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '%% Comment\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';

      parser.parse(str);
    });

    it('should handle comments at the start', function () {
      const str =
        '%% Comment\n' +
        'classDiagram\n' +
        'class Class1 {\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';
      parser.parse(str);
    });

    it('should handle comments at the end', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '\n}' +
        '%% Comment\n';

      parser.parse(str);
    });

    it('should handle comments at the end no trailing newline', function () {
      const str =
      'classDiagram\n' +
      'class Class1 {\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}\n' +
        '%% Comment';

      parser.parse(str);
    });

    it('should handle a comment with multiple line feeds', function () {
      const str =
        'classDiagram\n\n\n' +
        '%% Comment\n\n' +
        'class Class1 {\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';

      parser.parse(str);
    });

    it('should handle a comment with mermaid class diagram code in them', function () {
      const str =
        'classDiagram\n' +
        '%% Comment Class01 <|-- Class02\n' +
        'class Class1 {\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';

      parser.parse(str);
    });

    it('should handle a comment inside brackets', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '%% Comment Class01 <|-- Class02\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';

      parser.parse(str);
    });

    it('should handle click statement with link', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '%% Comment Class01 <|-- Class02\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}\n' +
        'link Class01 "google.com" ';

      parser.parse(str);
    });

    it('should handle click statement with link and tooltip', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '%% Comment Class01 <|-- Class02\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}\n' +
        'link Class01 "google.com" "A Tooltip" ';

      parser.parse(str);
    });

    it('should handle click statement with callback', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '%% Comment Class01 <|-- Class02\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}\n' +
        'callback Class01 "functionCall" ';

      parser.parse(str);
    });

    it('should handle click statement with callback and tooltip', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '%% Comment Class01 <|-- Class02\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}\n' +
        'callback Class01 "functionCall" "A Tooltip" ';

      parser.parse(str);
    });

    it('should handle dashed relation definition of different types and directions', function () {
      const str =
        'classDiagram\n' +
        'Class11 <|.. Class12\n' +
        'Class13 <.. Class14\n' +
        'Class15 ..|> Class16\n' +
        'Class17 ..> Class18\n' +
        'Class19 .. Class20';
      parser.parse(str);
    });

    it('should handle generic types in members', function () {
      const str =
        'classDiagram\n' +
        'class Car~T~\n' +
        'Car : -List~Wheel~ wheels\n' +
        'Car : +setWheels(List~Wheel~ wheels)\n' +
        'Car : +getWheels() List~Wheel~';

      parser.parse(str);
    });

    it('should handle generic types in members in class with brackets', function () {
      const str =
      'classDiagram\n' +
      'class Car {\n' +
      'List~Wheel~ wheels\n' +
        'setWheels(List~Wheel~ wheels)\n' +
        '+getWheels() List~Wheel~\n' +
      '}';

      parser.parse(str);
    });
  });

  describe('when fetching data from a classDiagram graph it', function () {
    beforeEach(function () {
      parser.yy = classDb;
      parser.yy.clear();
    });
    it('should handle relation definitions EXTENSION', function () {
      const str = 'classDiagram\n' + 'Class01 <|-- Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class01').id).toBe('Class01');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.EXTENSION);
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle relation definitions AGGREGATION and dotted line', function () {
      const str = 'classDiagram\n' + 'Class01 o.. Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class01').id).toBe('Class01');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.AGGREGATION);
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.DOTTED_LINE);
    });

    it('should handle relation definitions COMPOSITION on both sides', function () {
      const str = 'classDiagram\n' + 'Class01 *--* Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class01').id).toBe('Class01');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.COMPOSITION);
      expect(relations[0].relation.type2).toBe(classDb.relationType.COMPOSITION);
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle relation definitions no types', function () {
      const str = 'classDiagram\n' + 'Class01 -- Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class01').id).toBe('Class01');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe('none');
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle relation definitions with type only on right side', function () {
      const str = 'classDiagram\n' + 'Class01 --|> Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class01').id).toBe('Class01');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe('none');
      expect(relations[0].relation.type2).toBe(classDb.relationType.EXTENSION);
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle multiple classes and relation definitions', function () {
      const str =
        'classDiagram\n' +
        'Class01 <|-- Class02\n' +
        'Class03 *-- Class04\n' +
        'Class05 o-- Class06\n' +
        'Class07 .. Class08\n' +
        'Class09 -- Class10';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class01').id).toBe('Class01');
      expect(parser.yy.getClass('Class10').id).toBe('Class10');

      expect(relations.length).toBe(5);

      expect(relations[0].relation.type1).toBe(classDb.relationType.EXTENSION);
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
      expect(relations[3].relation.type1).toBe('none');
      expect(relations[3].relation.type2).toBe('none');
      expect(relations[3].relation.lineType).toBe(classDb.lineType.DOTTED_LINE);
    });

    it('should handle generic class with relation definitions', function () {
      const str = 'classDiagram\n' + 'Class01~T~ <|-- Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class01').id).toBe('Class01');
      expect(parser.yy.getClass('Class01').type).toBe('T');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.EXTENSION);
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle class annotations', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + '<<interface>> Class1';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(1);
      expect(testClass.members.length).toBe(0);
      expect(testClass.methods.length).toBe(0);
      expect(testClass.annotations[0]).toBe('interface');
    });

    it('should handle class annotations with members and methods', function () {
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : int test\n' +
        'Class1 : test()\n' +
        '<<interface>> Class1';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(1);
      expect(testClass.members.length).toBe(1);
      expect(testClass.methods.length).toBe(1);
      expect(testClass.annotations[0]).toBe('interface');
    });

    it('should handle class annotations in brackets', function () {
      const str = 'classDiagram\n' + 'class Class1 {\n' + '<<interface>>\n' + '}';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(1);
      expect(testClass.members.length).toBe(0);
      expect(testClass.methods.length).toBe(0);
      expect(testClass.annotations[0]).toBe('interface');
    });

    it('should handle class annotations in brackets with members and methods', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '<<interface>>\n' +
        'int : test\n' +
        'test()\n' +
        '}';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(1);
      expect(testClass.members.length).toBe(1);
      expect(testClass.methods.length).toBe(1);
      expect(testClass.annotations[0]).toBe('interface');
    });

    it('should add bracket members in right order', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.members.length).toBe(2);
      expect(testClass.methods.length).toBe(2);
      expect(testClass.members[0]).toBe('int : test');
      expect(testClass.members[1]).toBe('string : foo');
      expect(testClass.methods[0]).toBe('test()');
      expect(testClass.methods[1]).toBe('foo()');
    });

    it('should handle abstract methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()*';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(0);
      expect(testClass.members.length).toBe(0);
      expect(testClass.methods.length).toBe(1);
      expect(testClass.methods[0]).toBe('someMethod()*');
    });

    it('should handle static methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()$';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(0);
      expect(testClass.members.length).toBe(0);
      expect(testClass.methods.length).toBe(1);
      expect(testClass.methods[0]).toBe('someMethod()$');
    });

    it('should associate link and css appropriately', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()\n' + 'link Class1 "google.com"';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.link).toBe('about:blank');//('google.com'); security needs to be set to 'loose' for this to work right
      expect(testClass.cssClasses.length).toBe(1);
      expect(testClass.cssClasses[0]).toBe('clickable');
    });
    
    it('should associate link with tooltip', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()\n' + 'link Class1 "google.com" "A tooltip"';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.link).toBe('about:blank');//('google.com'); security needs to be set to 'loose' for this to work right
      expect(testClass.tooltip).toBe('A tooltip');
      expect(testClass.cssClasses.length).toBe(1);
      expect(testClass.cssClasses[0]).toBe('clickable');
    });

    it('should associate callback appropriately', function () {
      spyOn(classDb, 'setClickEvent');
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()\n' + 'callback Class1 "functionCall"';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith('Class1', 'functionCall', undefined);
    });

    it('should associate callback with tooltip', function () {
      spyOn(classDb, 'setClickEvent');
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()\n' + 'callback Class1 "functionCall" "A tooltip"';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith('Class1', 'functionCall', 'A tooltip');
    });
  });
});
