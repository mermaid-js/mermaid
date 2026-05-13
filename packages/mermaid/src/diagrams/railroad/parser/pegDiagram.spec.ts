import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './pegParser.js';
import { db } from '../railroadDb.js';

describe('PEG Parser', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Basic Parsing', () => {
    it('should parse literal', () => {
      const input = `
        railroad-peg
        rule <- "hello" ;
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

    it('should parse identifier reference', () => {
      const input = `
        railroad-peg
        rule <- other_rule ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('nonterminal');
    });

    it('should parse sequence', () => {
      const input = `
        railroad-peg
        rule <- "a" "b" "c" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('sequence');
      if (def.type === 'sequence') {
        expect(def.elements).toHaveLength(3);
      }
    });

    it('should parse ordered choice', () => {
      const input = `
        railroad-peg
        rule <- "a" / "b" / "c" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('choice');
      if (def.type === 'choice') {
        expect(def.alternatives).toHaveLength(3);
      }
    });

    it('should parse optional suffix', () => {
      const input = `
        railroad-peg
        rule <- "a"? ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('optional');
    });

    it('should parse zero-or-more suffix', () => {
      const input = `
        railroad-peg
        rule <- "a"* ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('repetition');
      if (def.type === 'repetition') {
        expect(def.min).toBe(0);
      }
    });

    it('should parse one-or-more suffix', () => {
      const input = `
        railroad-peg
        rule <- "a"+ ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('repetition');
      if (def.type === 'repetition') {
        expect(def.min).toBe(1);
      }
    });

    it('should parse any character', () => {
      const input = `
        railroad-peg
        rule <- . ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('special');
      if (def.type === 'special') {
        expect(def.text).toBe('.');
      }
    });

    it('should parse lookahead prefix', () => {
      const input = `
        railroad-peg
        rule <- &"a" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('special');
      if (def.type === 'special') {
        expect(def.text).toBe('&"a"');
      }
    });

    it('should parse not-predicate prefix', () => {
      const input = `
        railroad-peg
        rule <- !"a" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('special');
      if (def.type === 'special') {
        expect(def.text).toBe('!"a"');
      }
    });

    it('should parse title', () => {
      const input = `
        railroad-peg
        title "Test Grammar"
        rule <- "a" ;
      `;
      void parser.parse(input);
      expect(db.getTitle()).toBe('Test Grammar');
    });
  });

  describe('Real-world Examples', () => {
    it('should parse expression grammar', () => {
      const input = `
        railroad-peg
        title "Calculator"
        Expression <- Term (("+" / "-") Term)* ;
        Term <- Factor (("*" / "/") Factor)* ;
        Factor <- Number / "(" Expression ")" ;
        Number <- Digit+ ;
        Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(5);
      expect(db.getTitle()).toBe('Calculator');
      expect(rules[0].name).toBe('Expression');
    });
  });

  describe('Error Handling', () => {
    it('should throw on missing keyword', () => {
      expect(() => parser.parse('rule <- "a" ;')).toThrow();
    });

    it('should throw on missing semicolon', () => {
      expect(() => parser.parse('railroad-peg\nrule <- "a"')).toThrow();
    });
  });
});
