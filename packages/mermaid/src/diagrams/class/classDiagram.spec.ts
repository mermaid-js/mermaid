// @ts-expect-error Jison doesn't export types
import { parser } from './parser/classDiagram.jison';
import classDb from './classDb.js';
import { vi, describe, it, expect } from 'vitest';
const spyOn = vi.spyOn;

describe('given a class diagram, ', function () {
  describe('when parsing class definition', function () {
    beforeEach(function () {
      parser.yy = classDb;
    });

    it.skip('should handle a leading newline', function () {
      const str = '\nclassDiagram\n' + 'class Car';

      try {
        parser.parse(str);
        // Fail test if above expression doesn't throw anything.
      } catch (e) {
        expect(true).toBe(false);
      }
    });

    it('should handle backquoted class names', function () {
      const str = 'classDiagram\n' + 'class `Car`';

      parser.parse(str);
    });

    it('should handle class names with underscore', function () {
      const str = 'classDiagram\n' + 'class `A_Car`';

      parser.parse(str);
    });

    it('should handle basic class definitions', function () {
      const str =
        'classDiagram\n' +
        'class Car\n' +
        'Driver -- Car : drives >\n' +
        'Car *-- Wheel : have 4 >\n' +
        'Car -- Person : < owns';

      parser.parse(str);
    });

    it('should handle member definitions in brackets', function () {
      const str = 'classDiagram\n' + 'class Car{\n' + '+int wheels\n' + '}';

      parser.parse(str);
    });

    it('should handle method declaration in brackets', function () {
      const str = 'classDiagram\n' + 'class Car{\n' + '+size()\n' + '}';

      parser.parse(str);
    });

    it('should handle properties in brackets, and some outside', function () {
      const str =
        'classDiagram\n' + 'class Car{\n' + '+int wheels\n' + '}\n' + 'Car : +ArrayList size()\n';

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

    it('should handle visibility for methods and members', function () {
      const str =
        'classDiagram\n' +
        'class actual\n' +
        'actual : -int privateMember\n' +
        'actual : +int publicMember\n' +
        'actual : #int protectedMember\n' +
        'actual : -privateMethod()\n' +
        'actual : +publicMethod()\n' +
        'actual : #protectedMethod()\n';

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

      const actual = parser.yy.getClass('Class1');
      expect(actual.members.length).toBe(2);
      expect(actual.methods.length).toBe(2);
      expect(actual.members[0]).toBe('int : test');
      expect(actual.members[1]).toBe('string : foo');
      expect(actual.methods[0]).toBe('test()');
      expect(actual.methods[1]).toBe('foo()');
    });

    it('should parse a class with a text label', () => {
      parser.parse(`classDiagram
  class C1["Class 1 with text label"]
  C1 -->  C2
      `);
      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('C2');
    });

    it('should parse two classes with text labels', () => {
      parser.parse(`classDiagram
  class C1["Class 1 with text label"]
  class C2["Class 2 with chars @?"]
  C1 -->  C2
      `);
      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Class 2 with chars @?');
    });

    it('should parse a class with a text label and members', () => {
      parser.parse(`classDiagram
  class C1["Class 1 with text label"] {
    +member1
  }
  C1 -->  C2
      `);
      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members.length).toBe(1);
      expect(c1.members[0]).toBe('+member1');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('C2');
    });

    it('should parse a class with a text label, members and annotation', () => {
      parser.parse(`classDiagram
  class C1["Class 1 with text label"] {
    <<interface>>
    +member1
  }
  C1 -->  C2
      `);
      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members.length).toBe(1);
      expect(c1.members[0]).toBe('+member1');
      expect(c1.annotations.length).toBe(1);
      expect(c1.annotations[0]).toBe('interface');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('C2');
    });

    it('should parse a class with text label and css class shorthand', () => {
      parser.parse(`classDiagram
class C1["Class 1 with text label"]:::styleClass {
  +member1
}
C1 -->  C2
  `);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members[0]).toBe('+member1');
      expect(c1.cssClasses[0]).toBe('styleClass');
    });

    it('should parse a class with text label and css class', () => {
      parser.parse(`classDiagram
class C1["Class 1 with text label"] {
  +member1
}
C1 --> C2
cssClass "C1" styleClass
  `);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members[0]).toBe('+member1');
      expect(c1.cssClasses[0]).toBe('styleClass');
    });

    it('should parse two classes with text labels and css classes', () => {
      parser.parse(`classDiagram
class C1["Class 1 with text label"] {
  +member1
}
class C2["Long long long long long long long long long long label"]
C1 --> C2
cssClass "C1,C2" styleClass
  `);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.cssClasses[0]).toBe('styleClass');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Long long long long long long long long long long label');
      expect(c2.cssClasses[0]).toBe('styleClass');
    });

    it('should parse two classes with text labels and css class shorthands', () => {
      parser.parse(`classDiagram
class C1["Class 1 with text label"]:::styleClass1 {
  +member1
}
class C2["Class 2 !@#$%^&*() label"]:::styleClass2
C1 --> C2
  `);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.cssClasses[0]).toBe('styleClass1');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Class 2 !@#$%^&*() label');
      expect(c2.cssClasses[0]).toBe('styleClass2');
    });

    it('should parse multiple classes with same text labels', () => {
      parser.parse(`classDiagram
class C1["Class with text label"]
class C2["Class with text label"]
class C3["Class with text label"]
C1 --> C2
C3 ..> C2
  `);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class with text label');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Class with text label');

      const c3 = classDb.getClass('C3');
      expect(c3.label).toBe('Class with text label');
    });

    it('should parse classes with different text labels', () => {
      parser.parse(`classDiagram
class C1["OneWord"]
class C2["With, Comma"]
class C3["With (Brackets)"]
class C4["With [Brackets]"]
class C5["With {Brackets}"]
class C6[" "]
class C7["With 1 number"]
class C8["With . period..."]
class C9["With - dash"]
class C10["With _ underscore"]
class C11["With ' single quote"]
class C12["With ~!@#$%^&*()_+=-/?"]
class C13["With Città foreign language"]
`);
      expect(classDb.getClass('C1').label).toBe('OneWord');
      expect(classDb.getClass('C2').label).toBe('With, Comma');
      expect(classDb.getClass('C3').label).toBe('With (Brackets)');
      expect(classDb.getClass('C4').label).toBe('With [Brackets]');
      expect(classDb.getClass('C5').label).toBe('With {Brackets}');
      expect(classDb.getClass('C6').label).toBe(' ');
      expect(classDb.getClass('C7').label).toBe('With 1 number');
      expect(classDb.getClass('C8').label).toBe('With . period...');
      expect(classDb.getClass('C9').label).toBe('With - dash');
      expect(classDb.getClass('C10').label).toBe('With _ underscore');
      expect(classDb.getClass('C11').label).toBe("With ' single quote");
      expect(classDb.getClass('C12').label).toBe('With ~!@#$%^&*()_+=-/?');
      expect(classDb.getClass('C13').label).toBe('With Città foreign language');
    });

    it('should handle "note for"', function () {
      const str = 'classDiagram\n' + 'Class11 <|.. Class12\n' + 'note for Class11 "test"\n';
      parser.parse(str);
    });

    it('should handle "note"', function () {
      const str = 'classDiagram\n' + 'note "test"\n';
      parser.parse(str);
    });

    it('should handle accTitle and accDescr', function () {
      const str = `classDiagram
            accTitle: My Title
            accDescr: My Description

            Class1 <|-- Class02
            `;

      parser.parse(str);
      expect(parser.yy.getAccTitle()).toBe('My Title');
      expect(parser.yy.getAccDescription()).toBe('My Description');
    });

    it('should handle accTitle and multiline accDescr', function () {
      const str = `classDiagram
            accTitle: My Title
            accDescr {
              This is mu multi
              line description
            }

            Class1 <|-- Class02
            `;

      parser.parse(str);
      expect(parser.yy.getAccTitle()).toBe('My Title');
      expect(parser.yy.getAccDescription()).toBe('This is mu multi\nline description');
    });
  });

  describe('when parsing method definition', function () {
    beforeEach(function () {
      parser.yy = classDb;
    });

    it('should handle abstract methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()*';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(0);
      expect(actual.members.length).toBe(0);
      expect(actual.methods.length).toBe(1);
      expect(actual.methods[0]).toBe('someMethod()*');
    });

    it('should handle static methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()$';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(0);
      expect(actual.members.length).toBe(0);
      expect(actual.methods.length).toBe(1);
      expect(actual.methods[0]).toBe('someMethod()$');
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

  describe('when parsing generics', function () {
    beforeEach(function () {
      parser.yy = classDb;
    });

    it('should handle generic class', function () {
      const str =
        'classDiagram\n' +
        'class Car~T~\n' +
        'Driver -- Car : drives >\n' +
        'Car *-- Wheel : have 4 >\n' +
        'Car -- Person : < owns';

      parser.parse(str);
    });

    it('should handle generic class with a literal name', function () {
      const str =
        'classDiagram\n' +
        'class `Car`~T~\n' +
        'Driver -- `Car` : drives >\n' +
        '`Car` *-- Wheel : have 4 >\n' +
        '`Car` -- Person : < owns';

      parser.parse(str);
    });

    it('should handle generic class with brackets', function () {
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

    it('should handle generic class with brackets and a literal name', function () {
      const str =
        'classDiagram\n' +
        'class `Dummy_Class`~T~ {\n' +
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

    it('should break when another `{`is encountered before closing the first one while defining generic class with brackets', function () {
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
      let testPassed = false;
      try {
        parser.parse(str);
      } catch (error) {
        testPassed = true;
      }
      expect(testPassed).toBe(true);
    });

    it('should break when EOF is encountered before closing the first `{` while defining generic class with brackets', function () {
      const str =
        'classDiagram\n' +
        'class Dummy_Class~T~ {\n' +
        'String data\n' +
        '  void methods()\n' +
        '}\n' +
        '\n' +
        'class Dummy_Class {\n';
      let testPassed = false;
      try {
        parser.parse(str);
      } catch (error) {
        testPassed = true;
      }
      expect(testPassed).toBe(true);
    });
  });

  describe('when parsing comments', function () {
    beforeEach(function () {
      parser.yy = classDb;
    });

    it('should handle comments at the start', function () {
      const str = `%% Comment
        classDiagram
        class Class1 {
          int : test
          string : foo
          test()
          foo()
        }`;
      parser.parse(str);
    });

    it('should handle comments at the end', function () {
      const str = `classDiagram
class Class1 {
int : test
string : foo
test()
foo()

}
%% Comment
`;

      parser.parse(str);
    });

    it('should handle comments at the end no trailing newline', function () {
      const str = `classDiagram
class Class1 {
int : test
string : foo
test()
foo()
}
%% Comment`;

      parser.parse(str);
    });

    it('should handle a comment with multiple line feeds', function () {
      const str = `classDiagram


%% Comment

class Class1 {
int : test
string : foo
test()
foo()
}`;

      parser.parse(str);
    });

    it('should handle a comment with mermaid class diagram code in them', function () {
      const str = `classDiagram
%% Comment Class1 <|-- Class02
class Class1 {
int : test
string : foo
test()
foo()
}`;

      parser.parse(str);
    });

    it('should handle a comment inside brackets', function () {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        '%% Comment Class1 <|-- Class02\n' +
        'int : test\n' +
        'string : foo\n' +
        'test()\n' +
        'foo()\n' +
        '}';

      parser.parse(str);
    });
  });

  describe('when parsing relationships', function () {
    beforeEach(function () {
      parser.yy = classDb;
    });

    it('should handle relation definitions', function () {
      const str =
        'classDiagram\n' +
        'Class1 <|-- Class02\n' +
        'Class03 *-- Class04\n' +
        'Class05 o-- Class06\n' +
        'Class07 .. Class08\n' +
        'Class09 -- Class1';

      parser.parse(str);
    });

    it('should handle backquoted relation definitions', function () {
      const str =
        'classDiagram\n' +
        '`Class1` <|-- Class02\n' +
        'Class03 *-- Class04\n' +
        'Class05 o-- Class06\n' +
        'Class07 .. Class08\n' +
        'Class09 -- Class1';

      parser.parse(str);
    });

    it('should handle relation definitions EXTENSION', function () {
      const str = 'classDiagram\n' + 'Class1 <|-- Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class1').id).toBe('Class1');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.EXTENSION);
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
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
        'Class1 "1" *-- "many" Class02 : contains\n' +
        'Class03 o-- Class04 : aggregation\n' +
        'Class05 --> "1" Class06';

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

    it('should handle relation definitions AGGREGATION and dotted line', function () {
      const str = 'classDiagram\n' + 'Class1 o.. Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class1').id).toBe('Class1');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.AGGREGATION);
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.DOTTED_LINE);
    });

    it('should handle relation definitions COMPOSITION on both sides', function () {
      const str = 'classDiagram\n' + 'Class1 *--* Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class1').id).toBe('Class1');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.COMPOSITION);
      expect(relations[0].relation.type2).toBe(classDb.relationType.COMPOSITION);
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle relation definitions no types', function () {
      const str = 'classDiagram\n' + 'Class1 -- Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class1').id).toBe('Class1');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe('none');
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle relation definitions with type only on right side', function () {
      const str = 'classDiagram\n' + 'Class1 --|> Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class1').id).toBe('Class1');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe('none');
      expect(relations[0].relation.type2).toBe(classDb.relationType.EXTENSION);
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });

    it('should handle multiple classes and relation definitions', function () {
      const str =
        'classDiagram\n' +
        'Class1 <|-- Class02\n' +
        'Class03 *-- Class04\n' +
        'Class05 o-- Class06\n' +
        'Class07 .. Class08\n' +
        'Class09 -- Class10';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class1').id).toBe('Class1');
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
      const str = 'classDiagram\n' + 'Class1~T~ <|-- Class02';

      parser.parse(str);

      const relations = parser.yy.getRelations();

      expect(parser.yy.getClass('Class1').id).toBe('Class1');
      expect(parser.yy.getClass('Class1').type).toBe('T');
      expect(parser.yy.getClass('Class02').id).toBe('Class02');
      expect(relations[0].relation.type1).toBe(classDb.relationType.EXTENSION);
      expect(relations[0].relation.type2).toBe('none');
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE);
    });
  });

  describe('when parsing click statements', function () {
    beforeEach(function () {
      parser.yy = classDb;
    });
    it('should handle href link', function () {
      spyOn(classDb, 'setLink');
      const str = 'classDiagram\n' + 'class Class1 \n' + 'click Class1 href "google.com" ';

      parser.parse(str);

      expect(classDb.setLink).toHaveBeenCalledWith('Class1', 'google.com');

      const actual = parser.yy.getClass('Class1');
      expect(actual.link).toBe('google.com');
      expect(actual.cssClasses[0]).toBe('clickable');
    });

    it('should handle href link with tooltip', function () {
      spyOn(classDb, 'setLink');
      spyOn(classDb, 'setTooltip');
      const str =
        'classDiagram\n' + 'class Class1 \n' + 'click Class1 href "google.com" "A Tooltip" ';

      parser.parse(str);

      expect(classDb.setLink).toHaveBeenCalledWith('Class1', 'google.com');

      const actual = parser.yy.getClass('Class1');
      expect(actual.link).toBe('google.com');
      expect(actual.tooltip).toBe('A Tooltip');
      expect(actual.cssClasses[0]).toBe('clickable');
    });

    it('should handle href link with tooltip and target', function () {
      spyOn(classDb, 'setLink');
      spyOn(classDb, 'setTooltip');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 href "google.com" "A tooltip" _self';
      parser.parse(str);

      expect(classDb.setLink).toHaveBeenCalledWith('Class1', 'google.com', '_self');
      expect(classDb.setTooltip).toHaveBeenCalledWith('Class1', 'A tooltip');

      const actual = parser.yy.getClass('Class1');
      expect(actual.link).toBe('google.com');
      expect(actual.tooltip).toBe('A tooltip');
      expect(actual.cssClasses[0]).toBe('clickable');
    });

    it('should handle function call', function () {
      spyOn(classDb, 'setClickEvent');

      const str = 'classDiagram\n' + 'class Class1 \n' + 'click Class1 call functionCall() ';

      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith('Class1', 'functionCall');
    });

    it('should handle function call with tooltip', function () {
      spyOn(classDb, 'setClickEvent');
      spyOn(classDb, 'setTooltip');

      const str =
        'classDiagram\n' + 'class Class1 \n' + 'click Class1 call functionCall() "A Tooltip" ';

      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith('Class1', 'functionCall');
      expect(classDb.setTooltip).toHaveBeenCalledWith('Class1', 'A Tooltip');
    });

    it('should handle function call with an arbitrary number of args', function () {
      spyOn(classDb, 'setClickEvent');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 call functionCall(test, test1, test2)';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith(
        'Class1',
        'functionCall',
        'test, test1, test2'
      );
    });

    it('should handle function call with an arbitrary number of args and tooltip', function () {
      spyOn(classDb, 'setClickEvent');
      spyOn(classDb, 'setTooltip');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 call functionCall("test0", test1, test2) "A Tooltip"';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith(
        'Class1',
        'functionCall',
        '"test0", test1, test2'
      );
      expect(classDb.setTooltip).toHaveBeenCalledWith('Class1', 'A Tooltip');
    });
  });

  describe('when parsing annotations', function () {
    beforeEach(function () {
      parser.yy = classDb;
      parser.yy.clear();
    });

    it('should handle class annotations', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + '<<interface>> Class1';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(1);
      expect(actual.members.length).toBe(0);
      expect(actual.methods.length).toBe(0);
      expect(actual.annotations[0]).toBe('interface');
    });

    it('should handle class annotations with members and methods', function () {
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : int test\n' +
        'Class1 : test()\n' +
        '<<interface>> Class1';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(1);
      expect(actual.members.length).toBe(1);
      expect(actual.methods.length).toBe(1);
      expect(actual.annotations[0]).toBe('interface');
    });

    it('should handle class annotations in brackets', function () {
      const str = 'classDiagram\n' + 'class Class1 {\n' + '<<interface>>\n' + '}';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(1);
      expect(actual.members.length).toBe(0);
      expect(actual.methods.length).toBe(0);
      expect(actual.annotations[0]).toBe('interface');
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

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(1);
      expect(actual.members.length).toBe(1);
      expect(actual.methods.length).toBe(1);
      expect(actual.annotations[0]).toBe('interface');
    });
  });
});
