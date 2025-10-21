import { describe, it, expect, beforeEach } from 'vitest';
import flow from './flowParser.js';
import { FlowDB } from '../flowDb.js';

describe('Flowchart arrow parsing - Issue #2492', () => {
  let flowDb: FlowDB;

  beforeEach(() => {
    flowDb = new FlowDB();
    flow.parser.yy = flowDb;
    flowDb.clear();
  });

  describe('Solid arrows with markers', () => {
    it('should parse --> followed by uppercase node', () => {
      const diagram = 'graph TD\nA-->B';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --> followed by lowercase node', () => {
      const diagram = 'graph TD\nA-->b';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --> followed by space', () => {
      const diagram = 'graph TD\nA--> B';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --- followed by uppercase node (issue #2492)', () => {
      const diagram = 'graph TD\ndev---Ops';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --- followed by lowercase node (issue #2492)', () => {
      const diagram = 'graph TD\ndev---ops';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --o followed by uppercase node', () => {
      const diagram = 'graph TD\nA--oB';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --o followed by lowercase node', () => {
      const diagram = 'graph TD\nA--ob';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --x followed by uppercase node', () => {
      const diagram = 'graph TD\nA--xBar';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --x followed by lowercase node', () => {
      const diagram = 'graph TD\nA--xbar';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });
  });

  describe('Thick arrows with markers', () => {
    it('should parse ==> followed by uppercase node', () => {
      const diagram = 'graph TD\nA==>B';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse ==> followed by lowercase node', () => {
      const diagram = 'graph TD\nA==>b';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse === followed by lowercase node', () => {
      const diagram = 'graph TD\nA===b';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });
  });

  describe('Dotted arrows with markers', () => {
    it('should parse -.-> followed by uppercase node', () => {
      const diagram = 'graph TD\nA-.->B';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse -.-> followed by lowercase node', () => {
      const diagram = 'graph TD\nA-.->b';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse -.- followed by lowercase node', () => {
      const diagram = 'graph TD\nA-.-b';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });
  });

  describe('Arrows with edge text', () => {
    it('should parse arrow with edge text followed by uppercase node', () => {
      const diagram = 'graph TD\nA-->|text|B';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse arrow with edge text followed by lowercase node', () => {
      const diagram = 'graph TD\nA-->|text|b';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse multiple arrows with edge text (regression test)', () => {
      const diagram = 'graph TD\nA-->|Get money|B\nB-->C\nC-->|One|D\nC-->|Two|E';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });
  });

  describe('Arrows followed by digits', () => {
    it('should parse --> followed by digit', () => {
      const diagram = 'graph LR\n47-->48';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse --> followed by node starting with digit', () => {
      const diagram = 'graph LR\nA-->48(Node)';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });

    it('should parse complex diagram with digit node IDs (Sample 4)', () => {
      const diagram =
        'graph LR\n47(SAM.CommonFA.FMESummary)-->48(SAM.CommonFA.CommonFAFinanceBudget)\n37(SAM.CommonFA.BudgetSubserviceLineVolume)-->48(SAM.CommonFA.CommonFAFinanceBudget)';
      expect(() => flow.parser.parse(diagram)).not.toThrow();
    });
  });
});
