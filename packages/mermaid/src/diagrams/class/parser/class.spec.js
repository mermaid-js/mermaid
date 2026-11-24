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

  describe('backtick escaping', function () {
    it('should handle backtick-quoted namespace names', function () {
      expect(() =>
        parser.parse(`classDiagram\nnamespace \`A::B\` {\n\tclass \`IPC::Sender\`\n}`)
      ).not.toThrow();
    });
  });

  describe('edge ids and association classes', function () {
    const parse = (...lines) => parser.parse(['classDiagram', ...lines].join('\n'));

    it('should read the edge id of a relation', function () {
      parse('Student "*" enrollment@-- "*" Course : takes');
      const [relation] = classDb.getRelations();
      expect(relation.id).toBe('enrollment');
      expect(relation.relation.id).toBeUndefined();
      expect(relation.title).toBe('takes');
      expect(relation.relationTitle1).toBe('*');
    });

    it.each([
      'A rel@<|-- B',
      'A rel@*--> B',
      'A rel@..> B',
      'A rel@ --o B',
      'A rel@()-- B',
      'A "1" rel@-- "*" B',
    ])('should accept an edge id on %s', function (line) {
      expect(() => parse(line)).not.toThrow();
    });

    it('should attach association classes to the relation with that edge id', function () {
      parse('Student rel@-- Course', 'Enrollment .. rel', 'Grade .. rel');
      expect(classDb.getRelations()).toHaveLength(1);
      expect(classDb.getRelations()[0].associationClasses).toEqual(['Enrollment', 'Grade']);
      expect(classDb.getClasses().has('Enrollment')).toBe(true);
      expect(classDb.getClasses().has('rel')).toBe(false);
    });

    it('should pick the relation by id when there are several between the same classes', function () {
      parse('A one@-- B', 'A two@-- B', 'C .. two');
      const [one, two] = classDb.getRelations();
      expect(one.associationClasses).toBeUndefined();
      expect(two.associationClasses).toEqual(['C']);
    });

    it('should ignore a repeated association class', function () {
      parse('A rel@-- B', 'C .. rel', 'C .. rel');
      expect(classDb.getRelations()[0].associationClasses).toEqual(['C']);
    });

    it('should reject an association class that is an end of the relation', function () {
      expect(() => parse('A rel@-- B', 'A .. rel')).toThrow('cannot be an end of the relation');
    });

    it('should reject a duplicate edge id', function () {
      expect(() => parse('A rel@-- B', 'C rel@-- D')).toThrow('already used by another relation');
    });

    it('should reject an edge id that is also a class name', function () {
      expect(() => parse('class rel', 'A rel@-- B')).toThrow('already a class name');
      classDb.clear();
      expect(() => parse('A rel@-- B', 'class rel')).toThrow('cannot also be a class');
    });

    it('should say to declare the relation first when the id was used before', function () {
      expect(() => parse('C .. rel', 'A rel@-- B')).toThrow('Declare the relation before');
    });

    it.each(['rel .. rel', 'rel .. other', 'rel .. rel2'])(
      'should not turn the edge id into a class with %s',
      function (line) {
        expect(() => parse('A rel@-- B', line)).toThrow('edge id of a relation');
      }
    );

    it.each(['C .. rel : label', 'C "1" .. rel', 'C .. "1" rel', 'C ..> rel'])(
      'should reject %s instead of dropping the label or multiplicity',
      function (line) {
        expect(() => parse('A rel@-- B', line)).toThrow('can only be used as');
      }
    );

    it('should reject an edge id used in an ordinary relation', function () {
      expect(() => parse('A rel@-- B', 'C --> rel')).toThrow('can only be used as');
    });

    it('should treat a dotted line to an unknown name as a plain relation', function () {
      parse('A .. b');
      expect(classDb.getRelations()).toHaveLength(1);
    });

    it.each([
      ['members and methods', 'class A {\n  +int x\n  +foo(a, b) int\n}\nA : +bar()'],
      ['generics', 'class A~T~\nA~T~ --> B'],
      ['lollipops', 'bar ()-- foo\nfoo --() baz'],
      ['lollipop with label', 'A ()-- B : (x)'],
      ['hyphens and emails', 'A -- B : mail me@-- there\nA : +foo@bar\nA : +u@-x\nB : foo@-'],
      ['lollipop after a method-like name', 'bar() -- foo'],
      ['members with @', 'class A {\n  +user@host\n}'],
      ['notes', 'class A\nnote for A "mail me@-- there"\nnote "free note"'],
      [
        'click, link and callback',
        'class A\nclick A href "https://x.org/a@b" "tip"\nlink A "https://x.org/@--"\ncallback A "cb"',
      ],
      ['namespaces', 'namespace N {\n  class A\n  class B\n}\nA --> B'],
      ['labels with @', 'A -- B : mail me@-- there\nA : user@example.com'],
      ['cardinalities', 'A "1" --> "*" B : has'],
      ['comments with @', '%% a@-- b\nA -- B'],
      ['styles', 'class A:::cls\nclassDef cls fill:#f9f'],
    ])('should still parse %s', function (_name, body) {
      expect(() => parser.parse('classDiagram\n' + body)).not.toThrow();
    });
  });
});
