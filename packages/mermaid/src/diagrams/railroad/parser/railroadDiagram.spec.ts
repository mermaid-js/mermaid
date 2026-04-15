import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './railroadParser.js';
import { db } from '../railroadDb.js';

describe('Railroad Parser', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Basic Parsing', () => {
    it('should parse terminal', () => {
      const input = `
        railroad-diagram
        rule = terminal("hello") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('rule');
      expect(rules[0].definition.type).toBe('terminal');
      if (rules[0].definition.type === 'terminal') {
        expect(rules[0].definition.value).toBe('hello');
      }
    });

    it('should parse nonterminal', () => {
      const input = `
        railroad-diagram
        rule = nonterminal("expression") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('nonterminal');
      if (rules[0].definition.type === 'nonterminal') {
        expect(rules[0].definition.name).toBe('expression');
      }
    });

    it('should parse sequence', () => {
      const input = `
        railroad-diagram
        rule = sequence(terminal("a"), terminal("b"), terminal("c")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
      if (rules[0].definition.type === 'sequence') {
        expect(rules[0].definition.elements).toHaveLength(3);
      }
    });

    it('should collapse single-element sequence', () => {
      const input = `
        railroad-diagram
        rule = sequence(terminal("a")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('terminal');
    });

    it('should parse choice', () => {
      const input = `
        railroad-diagram
        rule = choice(terminal("a"), terminal("b"), terminal("c")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('choice');
      if (rules[0].definition.type === 'choice') {
        expect(rules[0].definition.alternatives).toHaveLength(3);
      }
    });

    it('should collapse single-element choice', () => {
      const input = `
        railroad-diagram
        rule = choice(terminal("a")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('terminal');
    });

    it('should parse optional', () => {
      const input = `
        railroad-diagram
        rule = optional(terminal("a")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('optional');
    });

    it('should parse zeroOrMore', () => {
      const input = `
        railroad-diagram
        rule = zeroOrMore(terminal("a")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('repetition');
      if (rules[0].definition.type === 'repetition') {
        expect(rules[0].definition.min).toBe(0);
      }
    });

    it('should parse oneOrMore', () => {
      const input = `
        railroad-diagram
        rule = oneOrMore(terminal("a")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('repetition');
      if (rules[0].definition.type === 'repetition') {
        expect(rules[0].definition.min).toBe(1);
      }
    });

    it('should parse special', () => {
      const input = `
        railroad-diagram
        rule = special("any character") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('special');
      if (rules[0].definition.type === 'special') {
        expect(rules[0].definition.text).toBe('any character');
      }
    });

    it('should parse title', () => {
      const input = `
        railroad-diagram
        title "Test Grammar"
        rule = terminal("a") ;
      `;
      void parser.parse(input);

      expect(db.getTitle()).toBe('Test Grammar');
    });
  });

  describe('Complex Grammars', () => {
    it('should parse multiple rules', () => {
      const input = `
        railroad-diagram
        rule1 = terminal("a") ;
        rule2 = terminal("b") ;
        rule3 = terminal("c") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(3);
      expect(rules[0].name).toBe('rule1');
      expect(rules[1].name).toBe('rule2');
      expect(rules[2].name).toBe('rule3');
    });

    it('should handle nested structures', () => {
      const input = `
        railroad-diagram
        rule = sequence(
            choice(terminal("a"), terminal("b")),
            oneOrMore(choice(terminal("c"), terminal("d")))
        ) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
    });

    it('should parse complex expression grammar', () => {
      const input = `
        railroad-diagram
        digit = choice(
            terminal("0"), terminal("1"), terminal("2"),
            terminal("3"), terminal("4"), terminal("5"),
            terminal("6"), terminal("7"), terminal("8"), terminal("9")
        ) ;
        number = oneOrMore(nonterminal("digit")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(2);
      expect(rules[0].name).toBe('digit');
      expect(rules[1].name).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should throw on missing railroad-diagram keyword', () => {
      const input = `
        rule = terminal("a") ;
      `;

      expect(() => parser.parse(input)).toThrow();
    });

    it('should throw on missing semicolon', () => {
      const input = `
        railroad-diagram
        rule = terminal("a")
      `;

      expect(() => parser.parse(input)).toThrow();
    });

    it('should throw on unterminated string', () => {
      const input = `
        railroad-diagram
        rule = terminal("unclosed) ;
      `;

      expect(() => parser.parse(input)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rules list', () => {
      const input = `
        railroad-diagram
        title "Empty Grammar"
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(0);
      expect(db.getTitle()).toBe('Empty Grammar');
    });

    it('should handle whitespace in strings', () => {
      const input = `
        railroad-diagram
        rule = terminal("hello world") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      if (rules[0].definition.type === 'terminal') {
        expect(rules[0].definition.value).toBe('hello world');
      }
    });

    it('should handle underscore in rule names', () => {
      const input = `
        railroad-diagram
        my_rule = terminal("test") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('my_rule');
    });

    it('should handle numbers in rule names', () => {
      const input = `
        railroad-diagram
        rule123 = terminal("test") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('rule123');
    });

    it('should parse deeply nested IR', () => {
      const input = `
        railroad-diagram
        rule = sequence(
            choice(terminal("a"), terminal("b")),
            choice(terminal("c"), terminal("d"))
        ) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
      if (rules[0].definition.type === 'sequence') {
        expect(rules[0].definition.elements).toHaveLength(2);
        expect(rules[0].definition.elements[0].type).toBe('choice');
        expect(rules[0].definition.elements[1].type).toBe('choice');
      }
    });

    it('should parse zeroOrMore with choice', () => {
      const input = `
        railroad-diagram
        rule = zeroOrMore(choice(terminal("a"), terminal("b"))) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('repetition');
      if (rules[0].definition.type === 'repetition') {
        expect(rules[0].definition.element.type).toBe('choice');
      }
    });

    it('should parse block comments', () => {
      const input = `
        railroad-diagram
        /* this is a comment */
        rule = terminal("a") ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('terminal');
      if (rules[0].definition.type === 'terminal') {
        expect(rules[0].definition.value).toBe('a');
      }
    });
  });

  describe('Real-world Examples', () => {
    it('should parse an expression grammar', () => {
      const input = `
        railroad-diagram
        title "Simple Expression"
        expression = sequence(
            nonterminal("term"),
            zeroOrMore(sequence(
                choice(terminal("+"), terminal("-")),
                nonterminal("term")
            ))
        ) ;
        term = sequence(
            nonterminal("factor"),
            zeroOrMore(sequence(
                choice(terminal("*"), terminal("/")),
                nonterminal("factor")
            ))
        ) ;
        factor = choice(
            nonterminal("number"),
            sequence(terminal("("), nonterminal("expression"), terminal(")"))
        ) ;
        number = oneOrMore(nonterminal("digit")) ;
        digit = choice(
            terminal("0"), terminal("1"), terminal("2"),
            terminal("3"), terminal("4"), terminal("5"),
            terminal("6"), terminal("7"), terminal("8"), terminal("9")
        ) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(5);
      expect(db.getTitle()).toBe('Simple Expression');
      expect(rules[0].name).toBe('expression');
      expect(rules[1].name).toBe('term');
      expect(rules[2].name).toBe('factor');
      expect(rules[3].name).toBe('number');
      expect(rules[4].name).toBe('digit');
    });

    it('should parse JSON grammar excerpt', () => {
      const input = `
        railroad-diagram
        title "JSON Subset"
        value = choice(
            nonterminal("string"),
            nonterminal("number"),
            terminal("true"),
            terminal("false"),
            terminal("null")
        ) ;
        string = sequence(
            terminal("\\""),
            zeroOrMore(nonterminal("character")),
            terminal("\\"")
        ) ;
        number = oneOrMore(nonterminal("digit")) ;
        character = choice(nonterminal("letter"), nonterminal("digit")) ;
        letter = choice(terminal("a"), terminal("b"), terminal("c")) ;
        digit = choice(terminal("0"), terminal("1"), terminal("2")) ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(6);
      expect(db.getTitle()).toBe('JSON Subset');
    });
  });
});
