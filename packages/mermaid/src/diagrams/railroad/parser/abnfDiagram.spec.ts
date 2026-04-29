import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './abnfParser.js';
import { db } from '../railroadDb.js';

describe('ABNF Parser', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Basic Parsing', () => {
    it('should parse string literal', () => {
      const input = `
        railroad-abnf
        rule = "hello" ;
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

    it('should parse numeric value', () => {
      const input = `
        railroad-abnf
        rule = %x41 ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('terminal');
      if (def.type === 'terminal') {
        expect(def.value).toBe('%x41');
      }
    });

    it('should parse rule name reference', () => {
      const input = `
        railroad-abnf
        rule = other-rule ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('nonterminal');
    });

    it('should parse concatenation', () => {
      const input = `
        railroad-abnf
        rule = "a" "b" "c" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('sequence');
      if (def.type === 'sequence') {
        expect(def.elements).toHaveLength(3);
      }
    });

    it('should parse alternation', () => {
      const input = `
        railroad-abnf
        rule = "a" / "b" / "c" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('choice');
      if (def.type === 'choice') {
        expect(def.alternatives).toHaveLength(3);
      }
    });

    it('should parse optional group', () => {
      const input = `
        railroad-abnf
        rule = [ "a" ] ;
      `;
      void parser.parse(input);
      expect(db.getRules()[0].definition.type).toBe('optional');
    });

    it('should parse zero-or-more repetition', () => {
      const input = `
        railroad-abnf
        rule = *"a" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('repetition');
      if (def.type === 'repetition') {
        expect(def.min).toBe(0);
      }
    });

    it('should parse one-or-more repetition', () => {
      const input = `
        railroad-abnf
        rule = 1*"a" ;
      `;
      void parser.parse(input);
      const def = db.getRules()[0].definition;
      expect(def.type).toBe('repetition');
      if (def.type === 'repetition') {
        expect(def.min).toBe(1);
      }
    });

    it('should parse title', () => {
      const input = `
        railroad-abnf
        title "Test Grammar"
        rule = "a" ;
      `;
      void parser.parse(input);
      expect(db.getTitle()).toBe('Test Grammar');
    });
  });

  describe('Real-world Examples', () => {
    it('should parse URI-like grammar', () => {
      const input = `
        railroad-abnf
        title "URI"
        URI = scheme ":" hier-part ;
        scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) ;
        hier-part = "//" authority path-abempty ;
      `;
      void parser.parse(input);
      const rules = db.getRules();

      expect(rules).toHaveLength(3);
      expect(rules[0].name).toBe('URI');
      expect(rules[1].name).toBe('scheme');
      expect(rules[2].name).toBe('hier-part');
    });
  });

  describe('Error Handling', () => {
    it('should throw on missing keyword', () => {
      expect(() => parser.parse('rule = "a" ;')).toThrow();
    });

    it('should throw on missing semicolon', () => {
      expect(() => parser.parse('railroad-abnf\nrule = "a"')).toThrow();
    });
  });
});
