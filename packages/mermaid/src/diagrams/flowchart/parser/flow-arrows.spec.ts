import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './flow.jison';
import { FlowDB } from '../flowDb.js';

describe('Flowchart arrow parsing - Issue #2492', () => {
  let flowDb: FlowDB;

  beforeEach(() => {
    flowDb = new FlowDB();
    parser.yy = flowDb;
    flowDb.clear();
  });

  describe('Solid arrows with markers', () => {
    it('should parse --> followed by uppercase node', () => {
      const diagram = 'graph TD\nA-->B';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --> followed by lowercase node', () => {
      const diagram = 'graph TD\nA-->b';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --> followed by space', () => {
      const diagram = 'graph TD\nA--> B';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --- followed by uppercase node (issue #2492)', () => {
      const diagram = 'graph TD\ndev---Ops';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --- followed by lowercase node (issue #2492)', () => {
      const diagram = 'graph TD\ndev---ops';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --o followed by uppercase node', () => {
      const diagram = 'graph TD\nA--oB';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --o followed by lowercase node', () => {
      const diagram = 'graph TD\nA--ob';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --x followed by uppercase node', () => {
      const diagram = 'graph TD\nA--xBar';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse --x followed by lowercase node', () => {
      const diagram = 'graph TD\nA--xbar';
      expect(() => parser.parse(diagram)).not.toThrow();
    });
  });

  describe('Thick arrows with markers', () => {
    it('should parse ==> followed by uppercase node', () => {
      const diagram = 'graph TD\nA==>B';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse ==> followed by lowercase node', () => {
      const diagram = 'graph TD\nA==>b';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse === followed by lowercase node', () => {
      const diagram = 'graph TD\nA===b';
      expect(() => parser.parse(diagram)).not.toThrow();
    });
  });

  describe('Dotted arrows with markers', () => {
    it('should parse -.-> followed by uppercase node', () => {
      const diagram = 'graph TD\nA-.->B';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse -.-> followed by lowercase node', () => {
      const diagram = 'graph TD\nA-.->b';
      expect(() => parser.parse(diagram)).not.toThrow();
    });

    it('should parse -.- followed by lowercase node', () => {
      const diagram = 'graph TD\nA-.-b';
      expect(() => parser.parse(diagram)).not.toThrow();
    });
  });
});
