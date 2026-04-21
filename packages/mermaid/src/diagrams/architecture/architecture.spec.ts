import { assert, it, describe, expect, vi } from 'vitest';
import cytoscape from 'cytoscape';
import { parser } from './architectureParser.js';
import { ArchitectureDB } from './architectureDb.js';
describe('architecture diagrams', () => {
  let db: ArchitectureDB;
  beforeEach(() => {
    db = new ArchitectureDB();
    assert(parser.parser);
    parser.parser.yy = db;
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

  describe('cytoscape stylesheet warnings', () => {
    it('should not produce console warnings for edges without labels', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        // Reproduce the architecture renderer's cytoscape stylesheet for edges.
        // The 'edge' selector must NOT map label: 'data(label)' directly —
        // only 'edge[label]' should, to avoid warnings on edges without titles.
        const cy = cytoscape({
          headless: true,
          styleEnabled: true,
          layout: { name: 'preset' },
          style: [
            {
              selector: 'edge',
              style: {
                'curve-style': 'straight',
              },
            },
            {
              selector: 'edge[label]',
              style: {
                label: 'data(label)',
              },
            },
          ],
        });
        // Add two nodes and an edge without a label (simulates architecture edges without titles)
        cy.add({ group: 'nodes', data: { id: 'a' }, position: { x: 0, y: 0 } });
        cy.add({ group: 'nodes', data: { id: 'b' }, position: { x: 50, y: 50 } });
        cy.add({ group: 'edges', data: { id: 'a-b', source: 'a', target: 'b' } });

        // Force cytoscape to resolve styles on the edge (triggers the warning for missing data fields)
        cy.edges().forEach((edge) => edge.numericStyle('label'));

        const mappingWarnings = warnSpy.mock.calls.filter((args) =>
          args.some(
            (arg) => typeof arg === 'string' && arg.includes('Do not assign mappings to elements')
          )
        );
        expect(mappingWarnings).toHaveLength(0);

        cy.destroy();
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('randomize config', () => {
    it('should default randomize to false', () => {
      expect(db.getConfigField('randomize')).toBe(false);
    });

    it('should parse a complex deeply-nested diagram with randomize defaulting to false', async () => {
      const str = `architecture-beta
    group sub1(cloud)[Subscription A]
    group vnet1(cloud)[VNet A] in sub1
    service vm1(server)[VM] in vnet1

    group sub2(cloud)[Subscription B]
    group shared(cloud)[Shared] in sub2
    service reg(database)[Registry] in shared

    group env(cloud)[Environment] in sub2
    group vnet(cloud)[VNet] in env
    group snet1(cloud)[App Subnet] in vnet
    service nsg(server)[NSG] in snet1
    service asp(server)[App Plan] in snet1
    service web(server)[Web App] in snet1

    group snet2(cloud)[PE Subnet] in vnet
    service pe1(server)[PE Blob] in snet2
    service pe2(server)[PE Bus] in snet2

    service storage(disk)[Storage] in env
    service container(disk)[Container] in env
    service bus(server)[Service Bus] in env
    service dns(server)[DNS Zone] in env

    service client(internet)[Client]

    reg:B --> T:web
    nsg:R --> L:asp
    asp:R --> L:web
    web:R --> L:pe1
    pe1:R --> L:storage
    storage:B --> T:container
    web:B --> T:pe2
    pe2:R --> L:bus
    vm1:R --> L:pe2`;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(db.getConfigField('randomize')).toBe(false);
      expect(db.getServices()).toHaveLength(12);
      expect(db.getGroups()).toHaveLength(8);
      expect(db.getEdges()).toHaveLength(9);
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
