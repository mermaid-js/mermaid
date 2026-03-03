import { it, describe, expect } from 'vitest';
import { parser } from './architectureParser.js';
import { ArchitectureDB } from './architectureDb.js';
describe('architecture diagrams', () => {
  let db: ArchitectureDB;
  beforeEach(() => {
    db = new ArchitectureDB();
    // @ts-expect-error since type is set to undefined we will have error
    parser.parser?.yy = db;
  });

  describe('architecture diagram definitions', () => {
    it('should handle the architecture keyword', async () => {
      const str = `architecture-beta`;
      await expect(parser.parse(str)).resolves.not.toThrow();
    });

    it('should handle a simple radar definition', async () => {
      const str = `architecture-beta
            service db
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
    });
  });

  describe('should handle TitleAndAccessibilities', () => {
    it('should handle title on the first line', async () => {
      const str = `architecture-beta title Simple Architecture Diagram`;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(db.getDiagramTitle()).toBe('Simple Architecture Diagram');
    });

    it('should handle title on another line', async () => {
      const str = `architecture-beta
            title Simple Architecture Diagram
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(db.getDiagramTitle()).toBe('Simple Architecture Diagram');
    });

    it('should handle accessibility title and description', async () => {
      const str = `architecture-beta
            accTitle: Accessibility Title
            accDescr: Accessibility Description
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(db.getAccTitle()).toBe('Accessibility Title');
      expect(db.getAccDescription()).toBe('Accessibility Description');
    });

    it('should handle multiline accessibility description', async () => {
      const str = `architecture-beta
            accDescr {
                Accessibility Description
            }
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(db.getAccDescription()).toBe('Accessibility Description');
    });
  });

  describe('addJunction validation', () => {
    it('should throw if junction id is already in use by a service', () => {
      db.addGroup({ id: 'g1', title: 'Group' });
      db.addService({ id: 'svc', type: 'service', icon: 'server', title: 'Svc', in: 'g1' });
      expect(() => db.addJunction({ id: 'svc', type: 'junction' })).toThrow('already in use');
    });

    it('should throw if junction id is already in use by a group', () => {
      db.addGroup({ id: 'g1', title: 'Group' });
      expect(() => db.addJunction({ id: 'g1', type: 'junction' })).toThrow('already in use');
    });

    it('should throw if junction parent does not exist', () => {
      expect(() => db.addJunction({ id: 'j1', type: 'junction', in: 'nonexistent' })).toThrow(
        'parent does not exist'
      );
    });

    it('should throw if junction parent is a node (service), not a group', () => {
      db.addService({ id: 'app', type: 'service', icon: 'server', title: 'App' });
      expect(() => db.addJunction({ id: 'j1', type: 'junction', in: 'app' })).toThrow(
        'parent is not a group'
      );
    });

    it('should throw if junction is placed within itself', () => {
      expect(() => db.addJunction({ id: 'j1', type: 'junction', in: 'j1' })).toThrow(
        'cannot be placed within itself'
      );
    });

    it('should allow junction in a valid group', () => {
      db.addGroup({ id: 'app_env', title: 'App Env' });
      expect(() => db.addJunction({ id: 'mid', type: 'junction', in: 'app_env' })).not.toThrow();
    });

    it('should not crash with group name prefix matching a service name (issue #7408)', async () => {
      const str = `architecture-beta
  group app_env(cloud)[App Env]
  service app(server)[Web App] in app_env
  service db(database)[DB] in app_env
  service api(server)[API] in app_env
  junction mid in app_env
  app:B -- T:mid
  mid:R -- L:db
  mid:B -- T:api`;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(db.getJunctions()).toHaveLength(1);
      expect(db.getJunctions()[0].in).toBe('app_env');
    });
  });
});
