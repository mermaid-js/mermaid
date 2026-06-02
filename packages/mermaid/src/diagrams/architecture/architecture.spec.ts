import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest';
import cytoscape from 'cytoscape';
import { parser } from './architectureParser.js';
import { ArchitectureDB } from './architectureDb.js';
import { setConfig, reset as resetConfig } from '../../config.js';
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

  describe('fcose layout config', () => {
    afterEach(() => {
      resetConfig();
    });

    it('should default the fcose knobs to documented values', () => {
      expect(db.getConfigField('nodeSeparation')).toBe(75);
      expect(db.getConfigField('idealEdgeLengthMultiplier')).toBe(1.5);
      expect(db.getConfigField('edgeElasticity')).toBe(0.45);
      expect(db.getConfigField('numIter')).toBe(2500);
    });

    it('should round-trip user-supplied fcose knobs', () => {
      setConfig({
        architecture: {
          nodeSeparation: 120,
          idealEdgeLengthMultiplier: 2,
          edgeElasticity: 0.6,
          numIter: 5000,
        },
      });
      expect(db.getConfigField('nodeSeparation')).toBe(120);
      expect(db.getConfigField('idealEdgeLengthMultiplier')).toBe(2);
      expect(db.getConfigField('edgeElasticity')).toBe(0.6);
      expect(db.getConfigField('numIter')).toBe(5000);
    });

    it('should leave defaults intact when only one knob is set', () => {
      setConfig({ architecture: { nodeSeparation: 200 } });
      expect(db.getConfigField('nodeSeparation')).toBe(200);
      expect(db.getConfigField('idealEdgeLengthMultiplier')).toBe(1.5);
      expect(db.getConfigField('edgeElasticity')).toBe(0.45);
      expect(db.getConfigField('numIter')).toBe(2500);
    });
  });

  describe('align directive', () => {
    it('should parse a row alignment and expose it via getLayoutHints', async () => {
      const str = `architecture-beta
  group api(cloud)[API]
  service db1(database)[DB1] in api
  service db2(database)[DB2] in api
  service db3(database)[DB3] in api
  align row db1 db2 db3`;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const hints = db.getLayoutHints();
      expect(hints).toHaveLength(1);
      expect(hints[0].direction).toBe('row');
      expect(hints[0].members).toEqual(['db1', 'db2', 'db3']);
    });

    it('should parse a column alignment', async () => {
      const str = `architecture-beta
  service a(server)[A]
  service b(server)[B]
  align column a b`;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const hints = db.getLayoutHints();
      expect(hints).toHaveLength(1);
      expect(hints[0].direction).toBe('column');
      expect(hints[0].members).toEqual(['a', 'b']);
    });

    it('should reject an align directive whose member is not a service or junction', async () => {
      const str = `architecture-beta
  service a(server)[A]
  service b(server)[B]
  align row a b ghost`;
      await expect(parser.parse(str)).rejects.toThrow(/ghost/);
    });

    it('should reject an align directive that lists the same member twice', async () => {
      const str = `architecture-beta
  service a(server)[A]
  align row a a`;
      await expect(parser.parse(str)).rejects.toThrow(/more than once/);
    });

    it('should reject an align directive with fewer than two members at the DB level', () => {
      // The langium grammar requires `(members+=ID)+` so the parser path already
      // enforces ≥2 members. This guards the DB API for any non-grammar callers
      // (programmatic construction, future renderers, etc.).
      expect(() => db.addLayoutHint({ direction: 'row', members: [] })).toThrow(
        /at least two members/
      );
      expect(() => db.addLayoutHint({ direction: 'column', members: ['only_one'] })).toThrow(
        /at least two members/
      );
    });

    it('should not collide with services whose id starts with row or column', async () => {
      const str = `architecture-beta
  service rowspan(server)[Rowspan]
  service columnar(server)[Columnar]
  align row rowspan columnar`;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(db.getServices().map((s) => s.id)).toEqual(['rowspan', 'columnar']);
      expect(db.getLayoutHints()[0].members).toEqual(['rowspan', 'columnar']);
    });

    it.each(['align', 'row', 'column'])(
      'should reject a service whose id is the exact reserved keyword %s',
      async (keyword) => {
        // The directive introduces `align`, `row`, and `column` as reserved
        // keywords in architecture-beta. An exact-match id (no prefix/suffix)
        // must be rejected at parse time so authors get a clear error rather
        // than a downstream layout failure.
        const str = `architecture-beta
  service ${keyword}(database)[Service Using Reserved Word]`;
        await expect(parser.parse(str)).rejects.toThrow();
      }
    );
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
