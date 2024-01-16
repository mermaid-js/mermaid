// @ts-expect-error Jison doesn't export types
import { parser } from './parser/classDiagram.jison';
import classDb from './classDb.js';
import { vi, describe, it, expect } from 'vitest';
const spyOn = vi.spyOn;

const staticCssStyle = 'text-decoration:underline;';
const abstractCssStyle = 'font-style:italic;';

describe('given a basic class diagram, ', function () {
  describe('when parsing class definition', function () {
    beforeEach(function () {
      classDb.clear();
      parser.yy = classDb;
    });
    it('should handle accTitle and accDescr', function () {
      const str = `classDiagram
            accTitle: My Title
            accDescr: My Description`;

      parser.parse(str);
      expect(parser.yy.getAccTitle()).toBe('My Title');
      expect(parser.yy.getAccDescription()).toBe('My Description');
    });

    it('should handle accTitle and multiline accDescr', function () {
      const str = `classDiagram
            accTitle: My Title
            accDescr {
              This is my multi
              line description
            }`;

      parser.parse(str);
      expect(parser.yy.getAccTitle()).toBe('My Title');
      expect(parser.yy.getAccDescription()).toBe('This is my multi\nline description');
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

    it('should handle class names with dash', function () {
      const str = 'classDiagram\n' + 'class Ca-r';

      parser.parse(str);
      const actual = classDb.getClass('Ca-r');
      expect(actual.label).toBe('Ca-r');
    });

    it('should handle class names with underscore', function () {
      const str = 'classDiagram\n' + 'class `A_Car`';

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

    it('should parse a class with a text label', () => {
      const str = 'classDiagram\n' + 'class C1["Class 1 with text label"]';

      parser.parse(str);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
    });

    it('should parse two classes with text labels', function () {
      const str =
        'classDiagram\n' +
        'class C1["Class 1 with text label"]\n' +
        'class C2["Class 2 with chars @?"]\n';

      parser.parse(str);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Class 2 with chars @?');
    });

    it('should parse a class with a text label and member', () => {
      const str = 'classDiagram\n' + 'class C1["Class 1 with text label"]\n' + 'C1: member1';

      parser.parse(str);
      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members.length).toBe(1);
      expect(c1.members[0].getDisplayDetails().displayText).toBe('member1');
    });

    it('should parse a class with a text label, member and annotation', () => {
      const str =
        'classDiagram\n' +
        'class C1["Class 1 with text label"]\n' +
        '<<interface>> C1\n' +
        'C1 : int member1';

      parser.parse(str);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members.length).toBe(1);
      expect(c1.members[0].getDisplayDetails().displayText).toBe('int member1');
      expect(c1.annotations.length).toBe(1);
      expect(c1.annotations[0]).toBe('interface');
    });

    it('should parse a class with text label and css class shorthand', () => {
      const str = 'classDiagram\n' + 'class C1["Class 1 with text label"]:::styleClass';

      parser.parse(str);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.cssClasses[0]).toBe('styleClass');
    });

    it('should parse a class with text label and css class', () => {
      const str =
        'classDiagram\n' +
        'class C1["Class 1 with text label"]\n' +
        'C1 : int member1\n' +
        'cssClass "C1" styleClass';

      parser.parse(str);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members[0].getDisplayDetails().displayText).toBe('int member1');
      expect(c1.cssClasses[0]).toBe('styleClass');
    });

    it('should parse two classes with text labels and css classes', () => {
      const str =
        'classDiagram\n' +
        'class C1["Class 1 with text label"]\n' +
        'C1 : int member1\n' +
        'class C2["Long long long long long long long long long long label"]\n' +
        'cssClass "C1,C2" styleClass';

      parser.parse(str);

      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.cssClasses[0]).toBe('styleClass');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Long long long long long long long long long long label');
      expect(c2.cssClasses[0]).toBe('styleClass');
    });

    it('should parse two classes with text labels and css class shorthands', () => {
      const str =
        'classDiagram\n' +
        'class C1["Class 1 with text label"]:::styleClass1\n' +
        'class C2["Class 2 !@#$%^&*() label"]:::styleClass2';

      parser.parse(str);

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
class C3["Class with text label"]`);

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

    const keywords = [
      'direction',
      'classDiagram',
      'classDiagram-v2',
      'namespace',
      '{}',
      '{',
      '}',
      '()',
      '(',
      ')',
      '[]',
      '[',
      ']',
      'class',
      '\n',
      'cssClass',
      'callback',
      'link',
      'click',
      'note',
      'note for',
      '<<',
      '>>',
      'call ',
      '~',
      '~Generic~',
      '_self',
      '_blank',
      '_parent',
      '_top',
      '<|',
      '|>',
      '>',
      '<',
      '*',
      'o',
      '\\',
      '--',
      '..',
      '-->',
      '--|>',
      ': label',
      ':::',
      '.',
      '+',
      'alphaNum',
      '!',
      '0123',
      'function()',
      'function(arg1, arg2)',
    ];

    it.each(keywords)('should handle a note with %s in it', function (keyword: string) {
      const str = `classDiagram
                     note "This is a keyword: ${keyword}. It truly is."
                  `;
      parser.parse(str);
      expect(classDb.getNotes()[0].text).toEqual(`This is a keyword: ${keyword}. It truly is.`);
    });

    it.each(keywords)(
      'should handle note with %s at beginning of string',
      function (keyword: string) {
        const str = `classDiagram
                      note "${keyword}"`;

        parser.parse(str);
        expect(classDb.getNotes()[0].text).toEqual(`${keyword}`);
      }
    );

    it.each(keywords)('should handle a "note for" with a %s in it', function (keyword: string) {
      const str = `classDiagram
                   class Something {
                     int id
                     string name
                   }
                   note for Something "This is a keyword: ${keyword}. It truly is."
                   `;

      parser.parse(str);
      expect(classDb.getNotes()[0].text).toEqual(`This is a keyword: ${keyword}. It truly is.`);
    });

    it.each(keywords)(
      'should handle a "note for" with a %s at beginning of string',
      function (keyword: string) {
        const str = `classDiagram
                    class Something {
                      int id
                      string name
                    }
                    note for Something "${keyword}"
                    `;

        parser.parse(str);
        expect(classDb.getNotes()[0].text).toEqual(`${keyword}`);
      }
    );

    it.each(keywords)('should elicit error for %s after NOTE token', function (keyword: string) {
      const str = `classDiagram
                   note ${keyword}`;
      expect(() => parser.parse(str)).toThrowError(/(Expecting\s'STR'|Unrecognized\stext)/);
    });

    it('should parse diagram with direction', () => {
      parser.parse(`classDiagram
          direction TB
          class Student {
            -idCard : IdCard
          }
          class IdCard{
            -id : int
            -name : string
          }
          class Bike{
            -id : int
            -name : string
          }
          Student "1" --o "1" IdCard : carries
          Student "1" --o "1" Bike : rides`);

      expect(Object.keys(classDb.getClasses()).length).toBe(3);
      expect(classDb.getClasses().Student).toMatchInlineSnapshot(`
        {
          "annotations": [],
          "cssClasses": [],
          "domId": "classId-Student-134",
          "id": "Student",
          "label": "Student",
          "members": [
            ClassMember {
              "classifier": "",
              "id": "idCard : IdCard",
              "memberType": "attribute",
              "visibility": "-",
            },
          ],
          "methods": [],
          "styles": [],
          "type": "",
        }
      `);
      expect(classDb.getRelations().length).toBe(2);
      expect(classDb.getRelations()).toMatchInlineSnapshot(`
        [
          {
            "id1": "Student",
            "id2": "IdCard",
            "relation": {
              "lineType": 0,
              "type1": "none",
              "type2": 0,
            },
            "relationTitle1": "1",
            "relationTitle2": "1",
            "title": "carries",
          },
          {
            "id1": "Student",
            "id2": "Bike",
            "relation": {
              "lineType": 0,
              "type1": "none",
              "type2": 0,
            },
            "relationTitle1": "1",
            "relationTitle2": "1",
            "title": "rides",
          },
        ]
      `);
    });
  });

  describe('when parsing class defined in brackets', function () {
    beforeEach(function () {
      classDb.clear();
      parser.yy = classDb;
    });

    it('should handle member definitions', function () {
      const str = 'classDiagram\n' + 'class Car{\n' + '+int wheels\n' + '}';

      parser.parse(str);
    });

    it('should handle method definitions', function () {
      const str = 'classDiagram\n' + 'class Car{\n' + '+size()\n' + '}';

      parser.parse(str);
    });

    it('should handle a mix of members defined in and outside of brackets', function () {
      const str =
        'classDiagram\n' + 'class Car{\n' + '+int wheels\n' + '}\n' + 'Car : +ArrayList size()\n';

      parser.parse(str);
    });

    it('should handle member and method definitions', () => {
      const str =
        'classDiagram\n' + 'class Dummy_Class {\n' + 'String data\n' + 'void methods()\n' + '}';

      parser.parse(str);
    });

    it('should handle return types on methods', () => {
      const str =
        'classDiagram\n' +
        'class Flight {\n' +
        'int flightNumber\n' +
        'datetime departureTime\n' +
        'getDepartureTime() datetime\n' +
        '}';

      parser.parse(str);
    });

    it('should add bracket members in right order', () => {
      const str =
        'classDiagram\n' +
        'class Class1 {\n' +
        'int testMember\n' +
        'test()\n' +
        'string fooMember\n' +
        'foo()\n' +
        '}';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.members.length).toBe(2);
      expect(actual.methods.length).toBe(2);
      expect(actual.members[0].getDisplayDetails().displayText).toBe('int testMember');
      expect(actual.members[1].getDisplayDetails().displayText).toBe('string fooMember');
      expect(actual.methods[0].getDisplayDetails().displayText).toBe('test()');
      expect(actual.methods[1].getDisplayDetails().displayText).toBe('foo()');
    });

    it('should parse a class with a text label and members', () => {
      const str = 'classDiagram\n' + 'class C1["Class 1 with text label"] {\n' + '+member1\n' + '}';

      parser.parse(str);
      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members.length).toBe(1);
      expect(c1.members[0].getDisplayDetails().displayText).toBe('+member1');
    });

    it('should parse a class with a text label, members and annotation', () => {
      const str =
        'classDiagram\n' +
        'class C1["Class 1 with text label"] {\n' +
        '<<interface>>\n' +
        '+member1\n' +
        '}';

      parser.parse(str);
      const c1 = classDb.getClass('C1');
      expect(c1.label).toBe('Class 1 with text label');
      expect(c1.members.length).toBe(1);
      expect(c1.members[0].getDisplayDetails().displayText).toBe('+member1');
      expect(c1.annotations.length).toBe(1);
      expect(c1.annotations[0]).toBe('interface');
    });
  });

  describe('when parsing comments', function () {
    beforeEach(function () {
      classDb.clear();
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

  describe('when parsing click statements', function () {
    beforeEach(function () {
      classDb.clear();
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
      classDb.clear();
      parser.yy = classDb;
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

describe('given a class diagram with members and methods ', function () {
  describe('when parsing members', function () {
    beforeEach(function () {
      classDb.clear();
      parser.yy = classDb;
    });

    it('should handle simple member declaration', function () {
      const str = 'classDiagram\n' + 'class Car\n' + 'Car : wheels';

      parser.parse(str);
    });

    it('should handle direct member declaration', function () {
      parser.parse('classDiagram\n' + 'Car : wheels');
      const car = classDb.getClass('Car');
      expect(car.members.length).toBe(1);
      expect(car.members[0].id).toBe('wheels');
    });

    it('should handle direct member declaration with type', function () {
      parser.parse('classDiagram\n' + 'Car : int wheels');
      const car = classDb.getClass('Car');
      expect(car.members.length).toBe(1);
      expect(car.members[0].id).toBe('int wheels');
    });

    it('should handle simple member declaration with type', function () {
      const str = 'classDiagram\n' + 'class Car\n' + 'Car : int wheels';

      parser.parse(str);
    });

    it('should handle visibility', function () {
      const str =
        'classDiagram\n' +
        'class actual\n' +
        'actual : -int privateMember\n' +
        'actual : +int publicMember\n' +
        'actual : #int protectedMember\n' +
        'actual : ~int privatePackage';

      parser.parse(str);

      const actual = parser.yy.getClass('actual');
      expect(actual.members.length).toBe(4);
      expect(actual.methods.length).toBe(0);
      expect(actual.members[0].getDisplayDetails().displayText).toBe('-int privateMember');
      expect(actual.members[1].getDisplayDetails().displayText).toBe('+int publicMember');
      expect(actual.members[2].getDisplayDetails().displayText).toBe('#int protectedMember');
      expect(actual.members[3].getDisplayDetails().displayText).toBe('~int privatePackage');
    });

    it('should handle generic types', function () {
      const str = 'classDiagram\n' + 'class Car\n' + 'Car : -List~Wheel~ wheels';

      parser.parse(str);
    });
  });

  describe('when parsing method definition', function () {
    beforeEach(function () {
      classDb.clear();
      parser.yy = classDb;
    });

    it('should handle method definition', function () {
      const str = 'classDiagram\n' + 'class Car\n' + 'Car : GetSize()';

      parser.parse(str);
    });

    it('should handle simple return types', function () {
      const str = 'classDiagram\n' + 'class Object\n' + 'Object : getObject() Object';

      parser.parse(str);
    });

    it('should handle return types as array', function () {
      const str = 'classDiagram\n' + 'class Object\n' + 'Object : getObjects() Object[]';

      parser.parse(str);
    });

    it('should handle visibility', function () {
      const str =
        'classDiagram\n' +
        'class actual\n' +
        'actual : -privateMethod()\n' +
        'actual : +publicMethod()\n' +
        'actual : #protectedMethod()\n';

      parser.parse(str);
    });

    it('should handle abstract methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()*';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(0);
      expect(actual.members.length).toBe(0);
      expect(actual.methods.length).toBe(1);
      const method = actual.methods[0];
      expect(method.getDisplayDetails().displayText).toBe('someMethod()');
      expect(method.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });

    it('should handle static methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()$';
      parser.parse(str);

      const actual = parser.yy.getClass('Class1');
      expect(actual.annotations.length).toBe(0);
      expect(actual.members.length).toBe(0);
      expect(actual.methods.length).toBe(1);
      const method = actual.methods[0];
      expect(method.getDisplayDetails().displayText).toBe('someMethod()');
      expect(method.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should handle generic types in arguments', function () {
      const str = 'classDiagram\n' + 'class Car\n' + 'Car : +setWheels(List~Wheel~ wheels)';
      parser.parse(str);
    });

    it('should handle generic return types', function () {
      const str = 'classDiagram\n' + 'class Car\n' + 'Car : +getWheels() List~Wheel~';

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
});

describe('given a class diagram with generics, ', function () {
  describe('when parsing valid generic classes', function () {
    beforeEach(function () {
      classDb.clear();
      parser.yy = classDb;
    });

    it('should handle generic class', function () {
      const str = 'classDiagram\n' + 'class Car~T~';

      parser.parse(str);
    });

    it('should handle generic class with relationships', function () {
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
        'void methods()\n' +
        '}\n' +
        '\n' +
        'class Flight {\n' +
        'Integer flightNumber\n' +
        'Date departureTime\n' +
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

    it('should handle "namespace"', function () {
      const str = `classDiagram
namespace Namespace1 { class Class1 }
namespace Namespace2 { class Class1
}
namespace Namespace3 {
class Class1 {
int : test
string : foo
test()
foo()
}
}
namespace Namespace4 {
class Class1 {
int : test
string : foo
test()
foo()
}
class Class2 {
int : test
string : foo
test()
foo()
}
}
`;
      parser.parse(str);
    });

    it('should handle namespace with generic types', () => {
      parser.parse(`classDiagram

namespace space {
    class Square~Shape~{
        int id
        List~int~ position
        setPoints(List~int~ points)
        getPoints() List~int~
    }
}`);
    });
  });
});

describe('given a class diagram with relationships, ', function () {
  describe('when parsing basic relationships', function () {
    beforeEach(function () {
      classDb.clear();
      parser.yy = classDb;
    });

    it('should handle all basic relationships', function () {
      const str =
        'classDiagram\n' +
        'Class1 <|-- Class02\n' +
        'Class03 *-- Class04\n' +
        'Class05 o-- Class06\n' +
        'Class07 .. Class08\n' +
        'Class09 -- Class1';

      parser.parse(str);
    });

    it('should handle backquoted class name', function () {
      const str =
        'classDiagram\n' +
        '`Class1` <|-- Class02\n' +
        'Class03 *-- Class04\n' +
        'Class05 o-- Class06\n' +
        'Class07 .. Class08\n' +
        'Class09 -- Class1';

      parser.parse(str);
    });

    it('should handle generics', function () {
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

    it('should handle relationships with labels', function () {
      const str =
        'classDiagram\n' +
        'class Car\n' +
        'Driver -- Car : drives >\n' +
        'Car *-- Wheel : have 4 >\n' +
        'Car -- Person : < owns';

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

    it('should handle relation definitions with no types', function () {
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
      expect(testClass.members[0].getDisplayDetails().displayText).toBe('int : test');
      expect(testClass.members[1].getDisplayDetails().displayText).toBe('string : foo');
      expect(testClass.methods[0].getDisplayDetails().displayText).toBe('test()');
      expect(testClass.methods[1].getDisplayDetails().displayText).toBe('foo()');
    });

    it('should handle abstract methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()*';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(0);
      expect(testClass.members.length).toBe(0);
      expect(testClass.methods.length).toBe(1);
      const method = testClass.methods[0];
      expect(method.getDisplayDetails().displayText).toBe('someMethod()');
      expect(method.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
    });

    it('should handle static methods', function () {
      const str = 'classDiagram\n' + 'class Class1\n' + 'Class1 : someMethod()$';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.annotations.length).toBe(0);
      expect(testClass.members.length).toBe(0);
      expect(testClass.methods.length).toBe(1);
      const method = testClass.methods[0];
      expect(method.getDisplayDetails().displayText).toBe('someMethod()');
      expect(method.getDisplayDetails().cssStyle).toBe(staticCssStyle);
    });

    it('should associate link and css appropriately', function () {
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'link Class1 "google.com"';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.link).toBe('google.com');
      expect(testClass.cssClasses.length).toBe(1);
      expect(testClass.cssClasses[0]).toBe('clickable');
    });

    it('should associate click and href link and css appropriately', function () {
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 href "google.com"';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.link).toBe('google.com');
      expect(testClass.cssClasses.length).toBe(1);
      expect(testClass.cssClasses[0]).toBe('clickable');
    });

    it('should associate link with tooltip', function () {
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'link Class1 "google.com" "A tooltip"';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.link).toBe('google.com');
      expect(testClass.tooltip).toBe('A tooltip');
      expect(testClass.cssClasses.length).toBe(1);
      expect(testClass.cssClasses[0]).toBe('clickable');
    });

    it('should associate click and href link with tooltip', function () {
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 href "google.com" "A tooltip"';
      parser.parse(str);

      const testClass = parser.yy.getClass('Class1');
      expect(testClass.link).toBe('google.com');
      expect(testClass.tooltip).toBe('A tooltip');
      expect(testClass.cssClasses.length).toBe(1);
      expect(testClass.cssClasses[0]).toBe('clickable');
    });

    it('should associate click and href link with tooltip and target appropriately', function () {
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
    });

    it('should associate click and href link appropriately', function () {
      spyOn(classDb, 'setLink');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 href "google.com"';
      parser.parse(str);

      expect(classDb.setLink).toHaveBeenCalledWith('Class1', 'google.com');
    });

    it('should associate click and href link with target appropriately', function () {
      spyOn(classDb, 'setLink');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 href "google.com" _self';
      parser.parse(str);

      expect(classDb.setLink).toHaveBeenCalledWith('Class1', 'google.com', '_self');
    });

    it('should associate link appropriately', function () {
      spyOn(classDb, 'setLink');
      spyOn(classDb, 'setTooltip');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'link Class1 "google.com" "A tooltip" _self';
      parser.parse(str);

      expect(classDb.setLink).toHaveBeenCalledWith('Class1', 'google.com', '_self');
      expect(classDb.setTooltip).toHaveBeenCalledWith('Class1', 'A tooltip');
    });

    it('should associate callback appropriately', function () {
      spyOn(classDb, 'setClickEvent');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'callback Class1 "functionCall"';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith('Class1', 'functionCall');
    });

    it('should associate click and call callback appropriately', function () {
      spyOn(classDb, 'setClickEvent');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 call functionCall()';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith('Class1', 'functionCall');
    });

    it('should associate callback appropriately with an arbitrary number of args', function () {
      spyOn(classDb, 'setClickEvent');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 call functionCall("test0", test1, test2)';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith(
        'Class1',
        'functionCall',
        '"test0", test1, test2'
      );
    });

    it('should associate callback with tooltip', function () {
      spyOn(classDb, 'setClickEvent');
      spyOn(classDb, 'setTooltip');
      const str =
        'classDiagram\n' +
        'class Class1\n' +
        'Class1 : someMethod()\n' +
        'click Class1 call functionCall() "A tooltip"';
      parser.parse(str);

      expect(classDb.setClickEvent).toHaveBeenCalledWith('Class1', 'functionCall');
      expect(classDb.setTooltip).toHaveBeenCalledWith('Class1', 'A tooltip');
    });

    it('should add classes namespaces', function () {
      const str = `classDiagram
namespace Namespace1 {
class Class1 {
int : test
string : foo
test()
foo()
}
class Class2
}`;
      parser.parse(str);

      const testNamespace = parser.yy.getNamespace('Namespace1');
      const testClasses = parser.yy.getClasses();
      expect(Object.keys(testNamespace.classes).length).toBe(2);
      expect(Object.keys(testNamespace.children).length).toBe(0);
      expect(testNamespace.classes['Class1'].id).toBe('Class1');
      expect(Object.keys(testClasses).length).toBe(2);
    });

    it('should add relations between classes of different namespaces', function () {
      const str = `classDiagram
      A1 --> B1
      namespace A {
        class A1 {
          +foo : string
        }
        class A2 {
          +bar : int
        }
      }
      namespace B {
        class B1 {
          +foo : bool
        }
        class B2 {
          +bar : float
        }
      }
      A2 --> B2`;

      parser.parse(str);
      const testNamespaceA = parser.yy.getNamespace('A');
      const testNamespaceB = parser.yy.getNamespace('B');
      const testClasses = parser.yy.getClasses();
      const testRelations = parser.yy.getRelations();
      expect(Object.keys(testNamespaceA.classes).length).toBe(2);
      expect(testNamespaceA.classes['A1'].members[0].getDisplayDetails().displayText).toBe(
        '+foo : string'
      );
      expect(testNamespaceA.classes['A2'].members[0].getDisplayDetails().displayText).toBe(
        '+bar : int'
      );
      expect(Object.keys(testNamespaceB.classes).length).toBe(2);
      expect(testNamespaceB.classes['B1'].members[0].getDisplayDetails().displayText).toBe(
        '+foo : bool'
      );
      expect(testNamespaceB.classes['B2'].members[0].getDisplayDetails().displayText).toBe(
        '+bar : float'
      );
      expect(Object.keys(testClasses).length).toBe(4);
      expect(testClasses['A1'].parent).toBe('A');
      expect(testClasses['A2'].parent).toBe('A');
      expect(testClasses['B1'].parent).toBe('B');
      expect(testClasses['B2'].parent).toBe('B');
      expect(testRelations[0].id1).toBe('A1');
      expect(testRelations[0].id2).toBe('B1');
      expect(testRelations[1].id1).toBe('A2');
      expect(testRelations[1].id2).toBe('B2');
    });
  });

  describe('when parsing classDiagram with text labels', () => {
    beforeEach(function () {
      parser.yy = classDb;
      parser.yy.clear();
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
      const member = c1.members[0];
      expect(member.getDisplayDetails().displayText).toBe('+member1');
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
      expect(c1.annotations.length).toBe(1);
      expect(c1.annotations[0]).toBe('interface');
      const member = c1.members[0];
      expect(member.getDisplayDetails().displayText).toBe('+member1');

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
      expect(c1.cssClasses.length).toBe(1);
      expect(c1.cssClasses[0]).toBe('styleClass');
      const member = c1.members[0];
      expect(member.getDisplayDetails().displayText).toBe('+member1');
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
      expect(c1.cssClasses.length).toBe(1);
      expect(c1.cssClasses[0]).toBe('styleClass');
      const member = c1.members[0];
      expect(member.getDisplayDetails().displayText).toBe('+member1');
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
      expect(c1.cssClasses.length).toBe(1);
      expect(c1.cssClasses[0]).toBe('styleClass');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Long long long long long long long long long long label');
      expect(c2.cssClasses.length).toBe(1);
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
      expect(c1.cssClasses.length).toBe(1);
      expect(c1.cssClasses[0]).toBe('styleClass1');

      const c2 = classDb.getClass('C2');
      expect(c2.label).toBe('Class 2 !@#$%^&*() label');
      expect(c2.cssClasses.length).toBe(1);
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
  });
});
