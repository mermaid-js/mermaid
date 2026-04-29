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
        railroad-ebnf
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
        railroad-ebnf
        rule = other_rule ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].definition.type).toBe('nonterminal');
    });

    it('should parse sequence', () => {
      const input = `
        railroad-ebnf
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
        railroad-ebnf
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
        railroad-ebnf
        rule = "a"? ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('optional');
    });

    it('should parse optional (ISO)', () => {
      const input = `
        railroad-ebnf
        rule = [ "a" ] ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('optional');
    });

    it('should parse repetition zero-or-more', () => {
      const input = `
        railroad-ebnf
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
        railroad-ebnf
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
        railroad-ebnf
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
        railroad-ebnf
        title "Test Grammar"
        rule = "a" ;
      `;
      void parser.parse(input);
      expect(db.getTitle()).toBe('Test Grammar');
    });

    it('should parse special sequence', () => {
      const input = `
        railroad-ebnf
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
        railroad-ebnf
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
      expect(() => parser.parse('railroad-ebnf\nrule = "a"')).toThrow();
    });
  });
});
