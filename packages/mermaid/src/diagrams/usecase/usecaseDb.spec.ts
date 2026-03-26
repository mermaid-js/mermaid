import { describe, it, expect, beforeEach } from 'vitest';
import db from './usecaseDb.js';

beforeEach(() => db.clear());

describe('usecaseDb parser - Extended Suite', () => {
  describe('Entity Definitions', () => {
    it('parses actors with and without quotes/aliases', () => {
      db.parseDiagram(`usecaseDiagram
        actor Admin
        actor "External System" as ES
        actor "User"`);
      const actors = db.getActors();
      expect(actors).toHaveProperty('Admin', 'Admin');
      expect(actors).toHaveProperty('ES', 'External System');
      expect(actors).toHaveProperty('User', 'User');
    });

    it('parses usecases with and without quotes/aliases', () => {
      db.parseDiagram(`usecaseDiagram
        usecase Login
        usecase "Upload File" as UF
        usecase "Process"`);
      const usecases = db.getUseCases();
      expect(usecases).toHaveProperty('Login', 'Login');
      expect(usecases).toHaveProperty('UF', 'Upload File');
    });

    it('handles notes with multi-line text', () => {
      db.parseDiagram(`usecaseDiagram
        note "This is a\nmulti-line note" as N1`);
      const notes = db.getNotes();
      expect(notes).toHaveProperty('N1', 'This is a\nmulti-line note');
    });
  });

  describe('System Boundary Logic', () => {
    it('parses complex system blocks', () => {
      db.parseDiagram(`usecaseDiagram
        system "ATM Machine" {
          usecase "Withdraw" as W
          usecase "Deposit" as D
        }`);
      expect(db.getSystem()).toBe('ATM Machine');
      expect(db.getUseCases()).toHaveProperty('W');
      expect(db.getUseCases()).toHaveProperty('D');
    });

    it('handles empty system blocks without crashing', () => {
      db.parseDiagram(`usecaseDiagram\nsystem "Empty" {}`);
      expect(db.getSystem()).toBe('Empty');
    });
  });

  describe('Relationship Types & Labels', () => {
    it('parses all primary relationship types', () => {
      const code = `usecaseDiagram
        usecase A
        usecase B
        include: A-->B
        extend: A-->B
        generalization: A-->B
        realization: A-->B
        association: A-->B`;
      db.parseDiagram(code);
      const connections = db.getConnections();

      const types = connections.map((c) => c.type);
      expect(types).toContain('include');
      expect(types).toContain('extend');
      expect(types).toContain('generalization');
      expect(types).toContain('realization');
      expect(types).toContain('association');
    });

    it('handles custom labels on associations', () => {
      db.parseDiagram(`usecaseDiagram\nactor U\nusecase L\nU --> L : "Authorized"`);
      expect(db.getConnections()[0].label).toBe('Authorized');
    });
  });

  describe('Constraint & Business Rules (Logic Branching)', () => {
    it('validates relationship logic for "anchor"', () => {
      db.parseDiagram(`usecaseDiagram\nnote N\nusecase U\nanchor: N-->U`);
      expect(db.getConnections()).toHaveLength(1);
      db.clear();
      db.parseDiagram(`usecaseDiagram\nnote N1\nnote N2\nanchor: N1-->N2`);
      expect(db.getConnections()).toHaveLength(0);
    });

    it('validates relationship logic for "constraint"', () => {
      db.parseDiagram(`usecaseDiagram\nnote N1\nnote N2\nconstraint: N1-->N2`);
      expect(db.getConnections()).toHaveLength(1);
    });

    it('validates "containment" logic', () => {
      db.parseDiagram(`usecaseDiagram\nusecase U1\nusecase U2\ncontainment: U1-->U2`);
      expect(db.getConnections()).toHaveLength(1);

      db.clear();
      db.parseDiagram(`usecaseDiagram\nactor A\nusecase U\ncontainment: A-->U`);
      expect(db.getConnections()).toHaveLength(0);
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('handles duplicate ID definitions gracefully', () => {
      db.parseDiagram(`usecaseDiagram\nactor "Admin" as A\nactor "Super" as A`);
      const actors = db.getActors();
      expect(Object.keys(actors)).toHaveLength(1);
    });

    it('does not crash on unknown relationship blocks', () => {
      db.parseDiagram(`usecaseDiagram\nactor U\nusecase L\nunknown: U-->L`);
      expect(db.getConnections()).toHaveLength(0);
    });

    it('parses deep mixed diagrams (The "Stress Test")', () => {
      const code = `
        usecaseDiagram
        actor "Customer" as C
        system "Bank" {
          usecase "Check Balance" as CB
          usecase "Transfer" as T
        }
        note "Security check" as N1
        C --> CB
        C --> T
        include: T --> CB
        anchor: N1 --> T
      `;
      db.parseDiagram(code);
      expect(Object.keys(db.getActors())).toHaveLength(1);
      expect(Object.keys(db.getUseCases())).toHaveLength(2);
      expect(db.getConnections()).toHaveLength(4);
      expect(db.getSystem()).toBe('Bank');
    });
  });
});
