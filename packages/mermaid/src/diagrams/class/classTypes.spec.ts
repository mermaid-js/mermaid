import { ClassMember } from './classTypes.js';
import { vi, describe, it, expect } from 'vitest';
const spyOn = vi.spyOn;

const staticCssStyle = 'text-decoration:underline;';
const abstractCssStyle = 'font-style:italic;';

describe('given text representing a member, ', function () {
  describe('when parseMember is called as method', function () {
    describe('when method has no parameters', function () {
      it('should parse correctly', function () {
        const str = `getTime()`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe(str);
      });

      it('should handle public visibility', function () {
        const str = `+getTime()`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('+getTime()');
      });

      it('should handle private visibility', function () {
        const str = `-getTime()`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('-getTime()');
      });

      it('should handle protected visibility', function () {
        const str = `#getTime()`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('#getTime()');
      });

      it('should handle internal visibility', function () {
        const str = `~getTime()`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('~getTime()');
      });

      it('should return correct css for static classifier', function () {
        const str = `getTime()$`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
      });

      it('should return correct css for abstract classifier', function () {
        const str = `getTime()*`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
      });
    });

    describe('when method has single parameter value', function () {
      it('should parse correctly', function () {
        const str = `getTime(int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe(str);
      });

      it('should handle public visibility', function () {
        const str = `+getTime(int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('+getTime()');
      });

      it('should handle private visibility', function () {
        const str = `-getTime(int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('-getTime()');
      });

      it('should handle protected visibility', function () {
        const str = `#getTime(int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('#getTime()');
      });

      it('should handle internal visibility', function () {
        const str = `~getTime(int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('~getTime()');
      });

      it('should return correct css for static classifier', function () {
        const str = `getTime(int)$`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
      });

      it('should return correct css for abstract classifier', function () {
        const str = `getTime(int)*`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
      });
    });

    describe('when method has single parameter type and name (type first)', function () {
      it('should parse correctly', function () {
        const str = `getTime(int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe(str);
      });

      it('should handle public visibility', function () {
        const str = `+getTime(int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('+getTime()');
      });

      it('should handle private visibility', function () {
        const str = `-getTime(int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('-getTime()');
      });

      it('should handle protected visibility', function () {
        const str = `#getTime(int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('#getTime()');
      });

      it('should handle internal visibility', function () {
        const str = `~getTime(int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('~getTime()');
      });

      it('should return correct css for static classifier', function () {
        const str = `getTime(int count)$`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
      });

      it('should return correct css for abstract classifier', function () {
        const str = `getTime(int count)*`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
      });
    });

    describe('when method has single parameter type and name (name first)', function () {
      it('should parse correctly', function () {
        const str = `getTime(count int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe(str);
      });

      it('should handle public visibility', function () {
        const str = `+getTime(count int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('+getTime()');
      });

      it('should handle private visibility', function () {
        const str = `-getTime(count int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('-getTime()');
      });

      it('should handle protected visibility', function () {
        const str = `#getTime(count int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('#getTime()');
      });

      it('should handle internal visibility', function () {
        const str = `~getTime(count int)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('~getTime()');
      });

      it('should return correct css for static classifier', function () {
        const str = `getTime(count int)$`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
      });

      it('should return correct css for abstract classifier', function () {
        const str = `getTime(count int)*`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
      });
    });

    describe('when method has multiple parameters', function () {
      it('should parse correctly', function () {
        const str = `getTime(string text, int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe(str);
      });

      it('should handle public visibility', function () {
        const str = `+getTime(string text, int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('+getTime()');
      });

      it('should handle private visibility', function () {
        const str = `-getTime(string text, int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('-getTime()');
      });

      it('should handle protected visibility', function () {
        const str = `#getTime(string text, int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('#getTime()');
      });

      it('should handle internal visibility', function () {
        const str = `~getTime(string text, int count)`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('~getTime()');
      });

      it('should return correct css for static classifier', function () {
        const str = `getTime(string text, int count)$`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
      });

      it('should return correct css for abstract classifier', function () {
        const str = `getTime(string text, int count)*`;

        const classMember = new ClassMember(str, 'method');
        expect(classMember.getDisplayDetails().displayText).toBe('getTime()');
        expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
      });
    });
  });
});

//     it('should return correct css for static method with parameter type, as provided', function () {
//       const str = `getTime(String)$`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String)');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
//     });

//     it('should return correct css for static method with parameter type and name, as provided', function () {
//       const str = `getTime(String time)$`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time)');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
//     });

//     it('should return correct css for static method with parameters, as provided', function () {
//       const str = `getTime(String time, date Date)$`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time, date Date)');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
//     });

//     it('should return correct css for abstract method with parameter type, as provided', function () {
//       const str = `getTime(String)*`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String)');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
//     });

//     it('should return correct css for abstract method with parameter type and name, as provided', function () {
//       const str = `getTime(String time)*`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time)');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
//     });

//     it('should return correct css for abstract method with parameters, as provided', function () {
//       const str = `getTime(String time, date Date)*`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time, date Date)');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
//     });
//   });

//   describe('when text is a method with return type', function () {
//     it('should parse simple method with no parameter', function () {
//       const str = `getTime() String`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe(str);
//     });

//     it('should parse method with parameter type, as provided', function () {
//       const str = `getTime(String) String`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe(str);
//     });

//     it('should parse method with parameter type and name, as provided', function () {
//       const str = `getTime(String time) String`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe(str);
//     });

//     it('should parse method with parameters, as provided', function () {
//       const str = `getTime(String time, date Date) String`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe(str);
//     });

//     it('should return correct css for static method with no parameter', function () {
//       const str = `getTime() String$`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime() String');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
//     });

//     it('should return correct css for static method with parameter type and name, as provided', function () {
//       const str = `getTime(String time) String$`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time) String');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
//     });

//     it('should return correct css for static method with parameters, as provided', function () {
//       const str = `getTime(String time, date Date)$ String`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe(
//         'getTime(String time, date Date) String'
//       );
//       expect(classMember.getDisplayDetails().cssStyle).toBe(staticCssStyle);
//     });

//     it('should return correct css for abstract method with parameter type, as provided', function () {
//       const str = `getTime(String) String*`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String) String');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
//     });

//     it('should return correct css for abstract method with parameter type and name, as provided', function () {
//       const str = `getTime(String time) String*`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe('getTime(String time) String');
//       expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
//     });

//     it('should return correct css for abstract method with parameters, as provided', function () {
//       const str = `getTime(String time, date Date) String*`;

//       const classMember = new ClassMember(str, 'method');
//       expect(classMember.getDisplayDetails().displayText).toBe(
//         'getTime(String time, date Date) String'
//       );
//       expect(classMember.getDisplayDetails().cssStyle).toBe(abstractCssStyle);
//     });
//   });

//     it('should handle declaration with single item in parameters with extra spaces', function () {
//       const str = ' foo ( id) ';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(id)');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle method declaration with generic parameter', function () {
//       const str = 'foo(List~int~)';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(List<int>)');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle method declaration with normal and generic parameter', function () {
//       const str = 'foo(int, List~int~)';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(int, List<int>)');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle declaration with return value', function () {
//       const str = 'foo(id) int';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(id) : int');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle declaration with colon return value', function () {
//       const str = 'foo(id) : int';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(id) : int');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle declaration with generic return value', function () {
//       const str = 'foo(id) List~int~';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(id) : List<int>');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle declaration with colon generic return value', function () {
//       const str = 'foo(id) : List~int~';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(id) : List<int>');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle method declaration with all possible markup', function () {
//       const str = '+foo (  List~int~ ids  )* List~Item~';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('+foo(List<int> ids) : List<Item>');
//       expect(actual.cssStyle).toBe(abstractCssStyle);
//     });

//     it('should handle method declaration with nested generics', function () {
//       const str = '+foo (  List~List~int~~ ids  )* List~List~Item~~';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('+foo(List<List<int>> ids) : List<List<Item>>');
//       expect(actual.cssStyle).toBe(abstractCssStyle);
//     });

//     it('should handle static method classifier with colon and return type', function () {
//       const str = 'foo(name: String): int$';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(name: String) : int');
//       expect(actual.cssStyle).toBe(staticCssStyle);
//     });

//     it('should handle static method classifier after parenthesis with return type', function () {
//       const str = 'foo(name: String)$ int';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo(name: String) : int');
//       expect(actual.cssStyle).toBe(staticCssStyle);
//     });

//     it('should ignore unknown character for classifier', function () {
//       const str = 'foo()!';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo()');
//       expect(actual.cssStyle).toBe('');
//     });
//   });

//     it('should handle field with type', function () {
//       const str = 'int id';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('int id');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle field with type (name first)', function () {
//       const str = 'id: int';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('id: int');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle array field', function () {
//       const str = 'int[] ids';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('int[] ids');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle array field (name first)', function () {
//       const str = 'ids: int[]';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('ids: int[]');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle field with generic type', function () {
//       const str = 'List~int~ ids';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('List<int> ids');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle field with generic type (name first)', function () {
//       const str = 'ids: List~int~';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('ids: List<int>');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle static field', function () {
//       const str = 'String foo$';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('String foo');
//       expect(actual.cssStyle).toBe(staticCssStyle);
//     });

//     it('should handle static field (name first)', function () {
//       const str = 'foo: String$';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo: String');
//       expect(actual.cssStyle).toBe(staticCssStyle);
//     });

//     it('should handle static field with generic type', function () {
//       const str = 'List~String~ foo$';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('List<String> foo');
//       expect(actual.cssStyle).toBe(staticCssStyle);
//     });

//     it('should handle static field with generic type (name first)', function () {
//       const str = 'foo: List~String~$';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('foo: List<String>');
//       expect(actual.cssStyle).toBe(staticCssStyle);
//     });

//     it('should handle field with nested generic type', function () {
//       const str = 'List~List~int~~ idLists';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('List<List<int>> idLists');
//       expect(actual.cssStyle).toBe('');
//     });

//     it('should handle field with nested generic type (name first)', function () {
//       const str = 'idLists: List~List~int~~';
//       let actual = svgDraw.parseMember(str);

//       expect(actual.displayText).toBe('idLists: List<List<int>>');
//       expect(actual.cssStyle).toBe('');
//     });
//   });
// });
