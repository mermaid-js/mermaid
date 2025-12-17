import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './railroadParser.js';
import { db } from '../railroadDb.js';

describe('Railroad Parser', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Basic Parsing', () => {
    it('should parse simple terminal', () => {
      const input = `
        railroad-diagram
        rule = "terminal" ;
      `;
      parser.parse(input);
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
        railroad-diagram
        rule = other_rule ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('nonterminal');
      if (rules[0].definition.type === 'nonterminal') {
        expect(rules[0].definition.name).toBe('other_rule');
      }
    });

    it('should parse sequence', () => {
      const input = `
        railroad-diagram
        rule = "a" "b" "c" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
      if (rules[0].definition.type === 'sequence') {
        expect(rules[0].definition.elements).toHaveLength(3);
      }
    });

    it('should parse choice', () => {
      const input = `
        railroad-diagram
        rule = "a" | "b" | "c" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('choice');
      if (rules[0].definition.type === 'choice') {
        expect(rules[0].definition.alternatives).toHaveLength(3);
      }
    });

    it('should parse optional (W3C style)', () => {
      const input = `
        railroad-diagram
        rule = "a"? ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('optional');
    });

    it('should parse optional (ISO style)', () => {
      const input = `
        railroad-diagram
        rule = [ "a" ] ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('optional');
    });

    it('should parse repetition (zero or more)', () => {
      const input = `
        railroad-diagram
        rule = "a"* ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('repetition');
      if (rules[0].definition.type === 'repetition') {
        expect(rules[0].definition.min).toBe(0);
      }
    });

    it('should parse repetition (one or more)', () => {
      const input = `
        railroad-diagram
        rule = "a"+ ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('repetition');
      if (rules[0].definition.type === 'repetition') {
        expect(rules[0].definition.min).toBe(1);
      }
    });

    it('should parse ISO repetition', () => {
      const input = `
        railroad-diagram
        rule = { "a" } ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('repetition');
      if (rules[0].definition.type === 'repetition') {
        expect(rules[0].definition.min).toBe(0);
      }
    });

    it('should parse title', () => {
      const input = `
        railroad-diagram
        title "Test Grammar"
        rule = "a" ;
      `;
      parser.parse(input);

      expect(db.getTitle()).toBe('Test Grammar');
    });
  });

  describe('Complex Grammars', () => {
    it('should parse multiple rules', () => {
      const input = `
        railroad-diagram
        rule1 = "a" ;
        rule2 = "b" ;
        rule3 = "c" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(3);
      expect(rules[0].name).toBe('rule1');
      expect(rules[1].name).toBe('rule2');
      expect(rules[2].name).toBe('rule3');
    });

    it('should handle nested structures', () => {
      const input = `
        railroad-diagram
        rule = ( "a" | "b" ) ( "c" | "d" )+ ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
    });

    it('should parse complex expression', () => {
      const input = `
        railroad-diagram
        digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
        number = digit+ ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(2);
      expect(rules[0].name).toBe('digit');
      expect(rules[1].name).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should throw on missing railroad-diagram keyword', () => {
      const input = `
        rule = "a" ;
      `;

      expect(() => parser.parse(input)).toThrow();
    });

    it('should throw on missing semicolon', () => {
      const input = `
        railroad-diagram
        rule = "a"
      `;

      expect(() => parser.parse(input)).toThrow();
    });

    it('should throw on unterminated string', () => {
      const input = `
        railroad-diagram
        rule = "unclosed ;
      `;

      expect(() => parser.parse(input)).toThrow();
    });
  });

  describe('Special Sequences', () => {
    it('should parse special sequence with question mark syntax', () => {
      const input = `
        railroad-diagram
        rule = ? special ? ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('special');
      if (rules[0].definition.type === 'special') {
        expect(rules[0].definition.text).toBe('special');
      }
    });

    it('should parse comment', () => {
      const input = `
        railroad-diagram
        rule = (* this is a comment *) "a" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
    });

    it('should parse grouped elements', () => {
      const input = `
        railroad-diagram
        rule = ( "a" "b" ) | "c" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('choice');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rules list', () => {
      const input = `
        railroad-diagram
        title "Empty Grammar"
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(0);
      expect(db.getTitle()).toBe('Empty Grammar');
    });

    it('should handle single character terminals', () => {
      const input = `
        railroad-diagram
        rule = "a" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      if (rules[0].definition.type === 'terminal') {
        expect(rules[0].definition.value).toBe('a');
      }
    });

    it('should handle whitespace in strings', () => {
      const input = `
        railroad-diagram
        rule = "hello world" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      if (rules[0].definition.type === 'terminal') {
        expect(rules[0].definition.value).toBe('hello world');
      }
    });

    it('should handle underscore in identifiers', () => {
      const input = `
        railroad-diagram
        my_rule = "test" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('my_rule');
    });

    it('should handle numbers in identifiers', () => {
      const input = `
        railroad-diagram
        rule123 = "test" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('rule123');
    });

    it('should parse complex nested choice and sequence', () => {
      const input = `
        railroad-diagram
        rule = ( "a" | "b" ) ( "c" | "d" ) ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('sequence');
      if (rules[0].definition.type === 'sequence') {
        expect(rules[0].definition.elements).toHaveLength(2);
        expect(rules[0].definition.elements[0].type).toBe('choice');
        expect(rules[0].definition.elements[1].type).toBe('choice');
      }
    });

    it('should parse repetition with separator (ISO style)', () => {
      const input = `
        railroad-diagram
        rule = { "a" }- ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('repetition');
    });
  });

  describe('Real-world Examples', () => {
    it('should parse a simple expression grammar', () => {
      const input = `
        railroad-diagram
        title "Simple Expression"
        expression = term ( "+" term | "-" term )* ;
        term = factor ( "*" factor | "/" factor )* ;
        factor = number | "(" expression ")" ;
        number = digit+ ;
        digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
      `;
      parser.parse(input);
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
        value = string | number | "true" | "false" | "null" ;
        string = '"' character* '"' ;
        number = digit+ ;
        character = letter | digit ;
        letter = "a" | "b" | "c" ;
        digit = "0" | "1" | "2" ;
      `;
      parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(6);
      expect(db.getTitle()).toBe('JSON Subset');
    });
  });
});
