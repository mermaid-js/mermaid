import { describe, it, expect, beforeEach } from 'vitest';
import db from './usecaseDb.js';
import type { RelationshipType } from './usecaseDb.js';

beforeEach(() => db.clear());

describe('usecaseDb - State Management & Validation', () => {
  describe('Entity Definitions', () => {
    it('adds actors with and without aliases', () => {
      db.addActor('Admin', 'Admin');
      db.addActor('ES', 'External System');
      db.addActor('User', 'User');
      const actors = db.getActors();
      expect(actors).toHaveProperty('Admin', 'Admin');
      expect(actors).toHaveProperty('ES', 'External System');
      expect(actors).toHaveProperty('User', 'User');
    });

    it('adds usecases with and without aliases', () => {
      db.addUseCase('Login', 'Login');
      db.addUseCase('UF', 'Upload File');
      db.addUseCase('Process', 'Process');
      const usecases = db.getUseCases();
      expect(usecases).toHaveProperty('Login', 'Login');
      expect(usecases).toHaveProperty('UF', 'Upload File');
    });

    it('adds notes', () => {
      db.addNote('N1', 'This is a note');
      const notes = db.getNotes();
      expect(notes).toHaveProperty('N1', 'This is a note');
    });

    it('adds external systems', () => {
      db.addExternal('PAY', 'Payment API');
      const externals = db.getExternalSystems();
      expect(externals).toHaveProperty('PAY', 'Payment API');
    });

    it('adds collaborations', () => {
      db.addCollaboration('AF', 'Auth Flow');
      const collabs = db.getCollaborations();
      expect(collabs).toHaveProperty('AF', 'Auth Flow');
    });
  });

  describe('System Boundary', () => {
    it('sets system label', () => {
      db.setSystem('ATM Machine');
      expect(db.getSystem()).toBe('ATM Machine');
    });

    it('handles null system by default', () => {
      expect(db.getSystem()).toBeNull();
    });
  });

  describe('Connection Validation & Relationship Types', () => {
    it('allows valid actor-to-usecase associations', () => {
      db.addActor('U', 'User');
      db.addUseCase('L', 'Login');
      db.addConnection('U', 'association' as RelationshipType, 'L');
      expect(db.getConnections()).toHaveLength(1);
      expect(db.getConnections()[0].type).toBe('association');
    });

    it('auto-labels include relationships', () => {
      db.addUseCase('A', 'A');
      db.addUseCase('B', 'B');
      db.addConnection('A', 'include' as RelationshipType, 'B');
      expect(db.getConnections()[0].label).toBe('<<include>>');
    });

    it('auto-labels extend relationships', () => {
      db.addUseCase('A', 'A');
      db.addUseCase('B', 'B');
      db.addConnection('A', 'extend' as RelationshipType, 'B');
      expect(db.getConnections()[0].label).toBe('<<extend>>');
    });

    it('allows all primary relationship types', () => {
      db.addUseCase('A', 'A');
      db.addUseCase('B', 'B');
      const types: RelationshipType[] = ['include', 'extend', 'generalization', 'realization'];
      for (const type of types) {
        db.addConnection('A', type, 'B');
      }
      const connections = db.getConnections();
      const foundTypes = connections.map((c) => c.type);
      for (const type of types) {
        expect(foundTypes).toContain(type);
      }
    });

    it('rejects anchor from note to note', () => {
      db.addNote('N1', 'N1');
      db.addNote('N2', 'N2');
      db.addConnection('N1', 'anchor' as RelationshipType, 'N2');
      expect(db.getConnections()).toHaveLength(0);
    });

    it('allows constraint between notes', () => {
      db.addNote('N1', 'N1');
      db.addNote('N2', 'N2');
      db.addConnection('N1', 'constraint' as RelationshipType, 'N2');
      expect(db.getConnections()).toHaveLength(1);
    });

    it('rejects containment from actor to usecase', () => {
      db.addActor('A', 'A');
      db.addUseCase('U', 'U');
      db.addConnection('A', 'containment' as RelationshipType, 'U');
      expect(db.getConnections()).toHaveLength(0);
    });

    it('allows containment from usecase to usecase', () => {
      db.addUseCase('U1', 'U1');
      db.addUseCase('U2', 'U2');
      db.addConnection('U1', 'containment' as RelationshipType, 'U2');
      expect(db.getConnections()).toHaveLength(1);
    });

    it('allows association to unknown entities (inferred usecases)', () => {
      db.addConnection('X', 'association' as RelationshipType, 'Y');
      expect(db.getConnections()).toHaveLength(1);
    });
  });

  describe('Infer Use Cases', () => {
    it('infers usecases from connection endpoints', () => {
      db.addActor('C', 'Customer');
      db.addConnection('C', 'association' as RelationshipType, 'UC1');
      db.addConnection('C', 'association' as RelationshipType, 'UC2');
      db.inferUseCases();
      const usecases = db.getUseCases();
      expect(usecases).toHaveProperty('UC1', 'UC1');
      expect(usecases).toHaveProperty('UC2', 'UC2');
    });

    it('does not overwrite existing entities when inferring', () => {
      db.addActor('A', 'Actor A');
      db.addConnection('A', 'association' as RelationshipType, 'B');
      db.inferUseCases();
      expect(db.getActors()).toHaveProperty('A', 'Actor A');
      expect(db.getUseCases()).toHaveProperty('B', 'B');
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('handles duplicate ID definitions gracefully', () => {
      db.addActor('A', 'Admin');
      db.addActor('A', 'Super');
      const actors = db.getActors();
      expect(Object.keys(actors)).toHaveLength(1);
      expect(actors.A).toBe('Super');
    });

    it('clears state properly', () => {
      db.addActor('A', 'A');
      db.addUseCase('U', 'U');
      db.setSystem('S');
      db.clear();
      expect(Object.keys(db.getActors())).toHaveLength(0);
      expect(Object.keys(db.getUseCases())).toHaveLength(0);
      expect(db.getSystem()).toBeNull();
      expect(db.getConnections()).toHaveLength(0);
    });

    it('sets and gets title', () => {
      db.setTitle('My Diagram');
      expect(db.getTitle()).toBe('My Diagram');
    });

    it('returns correct model', () => {
      db.addActor('A', 'Actor');
      db.setSystem('System');
      const model = db.getModel();
      expect(model.actors).toHaveProperty('A', 'Actor');
      expect(model.system).toBe('System');
    });
  });
});
