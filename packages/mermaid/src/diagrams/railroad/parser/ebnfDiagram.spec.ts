import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './ebnfParser.js';
import { db } from '../railroadDb.js';

describe('EBNF Parser', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Basic Parsing', () => {
    it('should parse simple terminal', () => {
      const input = `
        railroad-ebnf-beta
        rule = "terminal" ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('rule');
      expect(rules[0].definition.type).toBe('terminal');
      if (rules[0].definition.type === 'terminal') {
        expect(rules[0].definition.value).toBe('terminal');
      }
    });

    it('should parse non-terminal reference', () => {
      const input = `
        railroad-ebnf-beta
        rule = other_rule ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('nonterminal');
    });

    it('should parse sequence', () => {
      const input = `
        railroad-ebnf-beta
        rule = "a" "b" "c" ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
      if (rules[0].definition.type === 'sequence') {
        expect(rules[0].definition.elements).toHaveLength(3);
      }
    });

    it('should parse choice', () => {
      const input = `
        railroad-ebnf-beta
        rule = "a" | "b" | "c" ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('choice');
      if (rules[0].definition.type === 'choice') {
        expect(rules[0].definition.alternatives).toHaveLength(3);
      }
    });

    it('should parse optional (W3C)', () => {
      const input = `
        railroad-ebnf-beta
        rule = "a"? ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('optional');
    });

    it('should parse optional (ISO)', () => {
      const input = `
        railroad-ebnf-beta
        rule = [ "a" ] ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('optional');
    });

    it('should parse repetition zero-or-more', () => {
      const input = `
        railroad-ebnf-beta
        rule = "a"* ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('repetition');
      if (def.type === 'repetition') {
        expect(def.min).toBe(0);
      }
    });

    it('should parse repetition one-or-more', () => {
      const input = `
        railroad-ebnf-beta
        rule = "a"+ ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('repetition');
      if (def.type === 'repetition') {
        expect(def.min).toBe(1);
      }
    });

    it('should parse ISO repetition', () => {
      const input = `
        railroad-ebnf-beta
        rule = { "a" } ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('repetition');
      if (def.type === 'repetition') {
        expect(def.min).toBe(0);
      }
    });

    it('should parse title', () => {
      const input = `
        railroad-ebnf-beta
        title "Test Grammar"
        rule = "a" ;
      `;
      void parser.parse(input);
      expect(db.getTitle()).toBe('Test Grammar');
    });

    it('should parse special sequence', () => {
      const input = `
        railroad-ebnf-beta
        rule = ? special ? ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('special');
      if (def.type === 'special') {
        expect(def.text).toBe('special');
      }
    });
  });

  describe('Real-world Examples', () => {
    it('should parse expression grammar', () => {
      const input = `
        railroad-ebnf-beta
        title "Simple Expression"
        expression = term ( "+" term | "-" term )* ;
        term = factor ( "*" factor | "/" factor )* ;
        factor = number | "(" expression ")" ;
        number = digit+ ;
        digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(5);
      expect(db.getTitle()).toBe('Simple Expression');
    });
  });

  describe('Error Handling', () => {
    it('should throw on missing keyword', () => {
      expect(() => parser.parse('rule = "a" ;')).toThrow();
    });

    it('should throw on missing semicolon', () => {
      expect(() => parser.parse('railroad-ebnf-beta\nrule = "a"')).toThrow();
    });
  });
});

describe('EBNF standard line', () => {
  beforeEach(() => {
    db.clear();
  });

  const types = (): string[] => {
    const definition = db.getRules()[0].definition;
    return definition.type === 'sequence'
      ? definition.elements.map((e) => e.type)
      : [definition.type];
  };

  describe('without a standard line (unchanged)', () => {
    it('keeps reading `? ... ?` as a special sequence before a postfix `?`', () => {
      void parser.parse('railroad-ebnf-beta\nfoo = bar " "? baz " "? qux ;');
      expect(types()).toEqual(['nonterminal', 'terminal', 'special', 'nonterminal']);
    });

    it('keeps accepting both "," and whitespace, and the postfix operators', () => {
      void parser.parse('railroad-ebnf-beta\nfoo = bar , baz qux* ;');
      expect(types()).toEqual(['nonterminal', 'nonterminal', 'repetition']);
    });

    it('keeps `standard` usable as a rule name and as a reference', () => {
      void parser.parse('railroad-ebnf-beta\nstandard = other ;\nother = standard "x" ;');
      expect(db.getRules().map((r) => r.name)).toEqual(['standard', 'other']);
    });

    it('keeps `standard` usable as a reference in the first rule', () => {
      void parser.parse('railroad-ebnf-beta\nfoo = standard bar ;');
      expect(types()).toEqual(['nonterminal', 'nonterminal']);
    });
  });

  describe('standard w3c', () => {
    it('reads `?` as a postfix operator, not as a special sequence', () => {
      void parser.parse('railroad-ebnf-beta\nstandard w3c\nfoo = bar " "? baz " "? qux ;');
      expect(types()).toEqual([
        'nonterminal',
        'optional',
        'nonterminal',
        'optional',
        'nonterminal',
      ]);
    });

    it('refuses the "," separator and names its position', () => {
      expect(() => parser.parse('railroad-ebnf-beta\nstandard w3c\nfoo = bar , baz ;')).toThrow(
        /line 3, column 11: the "," separator is not W3C notation/
      );
    });

    it('refuses the "," inside a group too', () => {
      expect(() => parser.parse('railroad-ebnf-beta\nstandard w3c\nfoo = ( a , b ) ;')).toThrow(
        /line 3, column 11/
      );
    });

    it('still accepts *, +, - and groups', () => {
      void parser.parse('railroad-ebnf-beta\nstandard w3c\nfoo = a* b+ ( c | d ) - e ;');
      expect(db.getRules()).toHaveLength(1);
    });
  });

  describe('standard iso', () => {
    it('reads `? ... ?` as a special sequence', () => {
      void parser.parse('railroad-ebnf-beta\nstandard iso\nfoo = bar, ? any char ?, baz ;');
      expect(types()).toEqual(['nonterminal', 'special', 'nonterminal']);
    });

    it.each([
      ['?', 'foo = a? ;', /line 3, column 8: the postfix operator \?: use \[ \.{3} ]/],
      ['*', 'foo = a* ;', /line 3, column 8: the postfix operator \*: use { \.{3} }/],
      ['+', 'foo = a+ ;', /line 3, column 8: the postfix operator \+/],
    ])('refuses the postfix %s', (_op, rule, message) => {
      expect(() => parser.parse(`railroad-ebnf-beta\nstandard iso\n${rule}`)).toThrow(message);
    });

    it('refuses a postfix nested in a group', () => {
      expect(() => parser.parse('railroad-ebnf-beta\nstandard iso\nfoo = ( a* ) ;')).toThrow(
        /line 3, column 10/
      );
    });

    it('accepts [ ], { } and ","', () => {
      void parser.parse('railroad-ebnf-beta\nstandard iso\nfoo = [ a ], { b }, c ;');
      expect(types()).toEqual(['optional', 'repetition', 'nonterminal']);
    });
  });

  describe('the line itself', () => {
    it('is found after front matter, comments and a title, and before the accessibility lines', () => {
      void parser.parse(
        '---\ntitle: x\n---\nrailroad-ebnf-beta\n%% a comment\ntitle My grammar\nstandard w3c %% trailing\naccTitle: t\nfoo = a? b? ;'
      );
      expect(types()).toEqual(['optional', 'optional']);
    });

    it('is found before the title', () => {
      void parser.parse('railroad-ebnf-beta\nstandard w3c\ntitle T\nfoo = a? b? ;');
      expect(types()).toEqual(['optional', 'optional']);
    });

    it('refuses an unknown value and lists the valid ones', () => {
      expect(() => parser.parse('railroad-ebnf-beta\nstandard w4c\nfoo = a ;')).toThrow(
        /line 2, column 1: unknown standard "w4c", expected one of: w3c, iso/
      );
    });

    it('refuses a second standard line', () => {
      expect(
        () => void parser.parse('railroad-ebnf-beta\nstandard w3c\nstandard iso\nfoo = a ;')
      ).toThrow(/line 3, column 1: only one `standard` line is allowed/);
    });
  });
});
