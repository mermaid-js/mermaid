import { it, describe, expect } from 'vitest';
import { parser } from './architectureParser.js';
import { ArchitectureDB } from './architectureDb.js';
import type {
  ArchitectureService,
  ArchitectureGroup,
  ArchitectureEdge,
  ArchitectureJunction,
} from './architectureTypes.js';

const {
  clear,
  getDiagramTitle,
  getAccTitle,
  getAccDescription,
  getServices,
  getGroups,
  getEdges,
  getJunctions,
} = db;

function expectGroup(
  group: ArchitectureGroup,
  id: string,
  icon: string | undefined,
  label: string | undefined,
  inGroup: string | undefined
) {
  expect(group.id).toBe(id);
  expect(group.icon).toBe(icon);
  expect(group.label).toBe(label);
  expect(group.in).toBe(inGroup);
}

function expectService(
  service: ArchitectureService,
  id: string,
  icon: string | undefined,
  iconText: string | undefined,
  label: string,
  inGroup: string | undefined
) {
  expect(service.id).toBe(id);
  expect(service.icon).toBe(icon);
  expect(service.iconText).toBe(iconText);
  expect(service.label).toBe(label);
  expect(service.in).toBe(inGroup);
}

function expectJunction(junction: ArchitectureJunction, id: string, inGroup: string | undefined) {
  expect(junction.id).toBe(id);
  expect(junction.in).toBe(inGroup);
}

function expectEdge(
  edge: ArchitectureEdge,
  lhsId: string,
  lhsGroup: boolean,
  rhsId: string,
  rhsGroup: boolean,
  lhsDir: string,
  lhsInto: boolean,
  label: string | undefined,
  rhsDir: string,
  rhsInto: boolean
) {
  expect(edge.lhsId).toBe(lhsId);
  expect(edge.lhsGroup).toBe(lhsGroup);
  expect(edge.rhsId).toBe(rhsId);
  expect(edge.rhsGroup).toBe(rhsGroup);
  expect(edge.lhsDir).toBe(lhsDir);
  expect(edge.lhsInto).toBe(lhsInto);
  expect(edge.label).toBe(label);
  expect(edge.rhsDir).toBe(rhsDir);
  expect(edge.rhsInto).toBe(rhsInto);
}

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

    it('should handle an simple architecture definition', async () => {
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

  describe('should handle complete diagrams', () => {
    it('should render a simple architecture diagram with groups', async () => {
      const str = `architecture-beta
            group api('cloud')['API']

            service db('database')['Database'] in api
            service disk1('disk')['Storage'] in api
            service disk2('disk')['Storage'] in api
            service server('server')['Server'] in api
            service gateway('internet')['Gateway'] 

            db L--R server
            disk1 T--B server
            disk2 T--B db
            server T--B gateway
        `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(1);
      expect(edges.length).toBe(4);

      expectGroup(groups[0], 'api', 'cloud', 'API', undefined);
      expectService(services[0], 'db', 'database', undefined, 'Database', 'api');
      expectService(services[1], 'disk1', 'disk', undefined, 'Storage', 'api');
      expectService(services[2], 'disk2', 'disk', undefined, 'Storage', 'api');
      expectService(services[3], 'server', 'server', undefined, 'Server', 'api');
      expectService(services[4], 'gateway', 'internet', undefined, 'Gateway', undefined);
      expectEdge(edges[0], 'db', false, 'server', false, 'L', false, undefined, 'R', false);
      expectEdge(edges[1], 'disk1', false, 'server', false, 'T', false, undefined, 'B', false);
      expectEdge(edges[2], 'disk2', false, 'db', false, 'T', false, undefined, 'B', false);
      expectEdge(edges[3], 'server', false, 'gateway', false, 'T', false, undefined, 'B', false);
    });

    it('should render an architecture diagram with markdown labels', async () => {
      const str = `architecture-beta
                group api('cloud')['\`**API**\`']

                service db('database')[\`_Database_\`] in api
                service disk1('disk')["\`_Storage_\`"] in api
                service disk2('disk')["\`_Storage_\`"] in api
                service server('server')["\`_Server_\`"] in api
                service gateway('internet')["\`_Gateway_\`"] 

                db L - ["\`**Bold Label**\`"] - R server
                disk1 T - ["\`**Bold Label**\`"] - B server
                disk2 T - ["\`_Italic Label_\`"] - B db
                server T - ["\`_Italic Label_\`"] - B gateway

                group a('cloud')['a.b-t']
                group b('cloud')['\`user:password@some_domain.com\`']
                group c('cloud')["\`The **cat** in the hat\`"]
                group d('cloud')["\`The *bat*
                in the chat\`"]
                group e('cloud')['Начало']
                group f('cloud')['➙ коммунизм 🚩']
                service right_disk('disk')["❤ Disk"]
                group g('cloud')['\\"Начало\\"']
        `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();
      expect(services.length).toBe(6);
      expect(groups.length).toBe(8);
      expect(edges.length).toBe(4);
      expectGroup(groups[0], 'api', 'cloud', '`**API**`', undefined);
      expectGroup(groups[1], 'a', 'cloud', 'a.b-t', undefined);
      expectGroup(groups[2], 'b', 'cloud', '`user:password@some_domain.com`', undefined);
      expectGroup(groups[3], 'c', 'cloud', '`The **cat** in the hat`', undefined);
      expectGroup(
        groups[4],
        'd',
        'cloud',
        `\`The *bat*
                in the chat\``,
        undefined
      );
      expectGroup(groups[5], 'e', 'cloud', 'Начало', undefined);
      expectGroup(groups[6], 'f', 'cloud', '➙ коммунизм 🚩', undefined);
      expectGroup(groups[7], 'g', 'cloud', '"Начало"', undefined);
      expectService(services[0], 'db', 'database', undefined, '`_Database_`', 'api');
      expectService(services[1], 'disk1', 'disk', undefined, '`_Storage_`', 'api');
      expectService(services[2], 'disk2', 'disk', undefined, '`_Storage_`', 'api');
      expectService(services[3], 'server', 'server', undefined, '`_Server_`', 'api');
      expectService(services[4], 'gateway', 'internet', undefined, '`_Gateway_`', undefined);
      expectService(services[5], 'right_disk', 'disk', undefined, '❤ Disk', undefined);
      expectEdge(
        edges[0],
        'db',
        false,
        'server',
        false,
        'L',
        false,
        '`**Bold Label**`',
        'R',
        false
      );
      expectEdge(
        edges[1],
        'disk1',
        false,
        'server',
        false,
        'T',
        false,
        '`**Bold Label**`',
        'B',
        false
      );
      expectEdge(edges[2], 'disk2', false, 'db', false, 'T', false, '`_Italic Label_`', 'B', false);
      expectEdge(
        edges[3],
        'server',
        false,
        'gateway',
        false,
        'T',
        false,
        '`_Italic Label_`',
        'B',
        false
      );
    });
    it('should render a simple architecture diagram with titleAndAccessibilities', async () => {
      const str = `architecture-beta
          title Simple Architecture Diagram
          accTitle: Accessibility Title
          accDescr: Accessibility Description
          group api('cloud')['API']

          service db('database')['Database'] in api
          service disk1('disk')['Storage'] in api
          service disk2('disk')['Storage'] in api
          service server('server')['Server'] in api

          db:L -- R:server
          disk1:T -- B:server
          disk2:T -- B:db
      `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(4);
      expect(groups.length).toBe(1);
      expect(edges.length).toBe(3);

      expect(getDiagramTitle()).toBe('Simple Architecture Diagram');
      expect(getAccTitle()).toBe('Accessibility Title');
      expect(getAccDescription()).toBe('Accessibility Description');
      expectGroup(groups[0], 'api', 'cloud', 'API', undefined);
      expectService(services[0], 'db', 'database', undefined, 'Database', 'api');
      expectService(services[1], 'disk1', 'disk', undefined, 'Storage', 'api');
      expectService(services[2], 'disk2', 'disk', undefined, 'Storage', 'api');
      expectService(services[3], 'server', 'server', undefined, 'Server', 'api');
      expectEdge(edges[0], 'db', false, 'server', false, 'L', false, undefined, 'R', false);
      expectEdge(edges[1], 'disk1', false, 'server', false, 'T', false, undefined, 'B', false);
      expectEdge(edges[2], 'disk2', false, 'db', false, 'T', false, undefined, 'B', false);
    });
    it('should render an architecture diagram with groups within groups', async () => {
      const str = `architecture-beta
                group api['API']
                group public['Public API'] in api
                group private['Private API'] in api
        
                service serv1('server')['Server'] in public
        
                service serv2('server')['Server'] in private
                service db('database')['Database'] in private
        
                service gateway('internet')['Gateway'] in api
        
                serv1: B--T :serv2
                serv2: L--R :db
                serv1: L--R :gateway
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(4);
      expect(groups.length).toBe(3);
      expect(edges.length).toBe(3);
      expectGroup(groups[0], 'api', undefined, 'API', undefined);
      expectGroup(groups[1], 'public', undefined, 'Public API', 'api');
      expectGroup(groups[2], 'private', undefined, 'Private API', 'api');
      expectService(services[0], 'serv1', 'server', undefined, 'Server', 'public');
      expectService(services[1], 'serv2', 'server', undefined, 'Server', 'private');
      expectService(services[2], 'db', 'database', undefined, 'Database', 'private');
      expectService(services[3], 'gateway', 'internet', undefined, 'Gateway', 'api');
      expectEdge(edges[0], 'serv1', false, 'serv2', false, 'B', false, undefined, 'T', false);
      expectEdge(edges[1], 'serv2', false, 'db', false, 'L', false, undefined, 'R', false);
      expectEdge(edges[2], 'serv1', false, 'gateway', false, 'L', false, undefined, 'R', false);
    });
    it('should render an architecture diagram with the fallback icon', async () => {
      const str = `architecture-beta
                service unknown('iconnamedoesntexist')['Unknown Icon']
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(1);
      expect(groups.length).toBe(0);
      expect(edges.length).toBe(0);
      expectService(
        services[0],
        'unknown',
        'iconnamedoesntexist',
        undefined,
        'Unknown Icon',
        undefined
      );
    });

    it('should render an architecture diagram with split directioning', async () => {
      const str = `architecture-beta
                service db('database')['Database']
                service s3('disk')['Storage']
                service serv1('server')['Server 1']
                service serv2('server')['Server 2']
                service disk('disk')['Disk']
        
                db: L--R :s3
                serv1: L--T :s3
                serv2: L--B :s3
                serv1: T--B :disk
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(0);
      expect(edges.length).toBe(4);
      expectService(services[0], 'db', 'database', undefined, 'Database', undefined);
      expectService(services[1], 's3', 'disk', undefined, 'Storage', undefined);
      expectService(services[2], 'serv1', 'server', undefined, 'Server 1', undefined);
      expectService(services[3], 'serv2', 'server', undefined, 'Server 2', undefined);
      expectService(services[4], 'disk', 'disk', undefined, 'Disk', undefined);
      expectEdge(edges[0], 'db', false, 's3', false, 'L', false, undefined, 'R', false);
      expectEdge(edges[1], 'serv1', false, 's3', false, 'L', false, undefined, 'T', false);
      expectEdge(edges[2], 'serv2', false, 's3', false, 'L', false, undefined, 'B', false);
      expectEdge(edges[3], 'serv1', false, 'disk', false, 'T', false, undefined, 'B', false);
    });
    it('should render an architecture diagram with directional arrows', async () => {
      const str = `architecture-beta
                service servC('server')['Server 1']
                service servL('server')['Server 2']
                service servR('server')['Server 3']
                service servT('server')['Server 4']
                service servB('server')['Server 5']
        
                servC L <--> R servL
                servC R <--> L servR
                servC T <--> B servT
                servC B <--> T servB
        
                servL T <--> L servT
                servL B <--> L servB
                servR T <--> R servT
                servR B <--> R servB
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(0);
      expect(edges.length).toBe(8);
      expectService(services[0], 'servC', 'server', undefined, 'Server 1', undefined);
      expectService(services[1], 'servL', 'server', undefined, 'Server 2', undefined);
      expectService(services[2], 'servR', 'server', undefined, 'Server 3', undefined);
      expectService(services[3], 'servT', 'server', undefined, 'Server 4', undefined);
      expectService(services[4], 'servB', 'server', undefined, 'Server 5', undefined);
      expectEdge(edges[0], 'servC', false, 'servL', false, 'L', true, undefined, 'R', true);
      expectEdge(edges[1], 'servC', false, 'servR', false, 'R', true, undefined, 'L', true);
      expectEdge(edges[2], 'servC', false, 'servT', false, 'T', true, undefined, 'B', true);
      expectEdge(edges[3], 'servC', false, 'servB', false, 'B', true, undefined, 'T', true);
      expectEdge(edges[4], 'servL', false, 'servT', false, 'T', true, undefined, 'L', true);
      expectEdge(edges[5], 'servL', false, 'servB', false, 'B', true, undefined, 'L', true);
      expectEdge(edges[6], 'servR', false, 'servT', false, 'T', true, undefined, 'R', true);
      expectEdge(edges[7], 'servR', false, 'servB', false, 'B', true, undefined, 'R', true);
    });
    it('should render an architecture diagram with group edges', async () => {
      const str = `architecture-beta
                group left_group('cloud')['Left']
                group right_group('cloud')['Right']
                group top_group('cloud')['Top']
                group bottom_group('cloud')['Bottom']
                group center_group('cloud')['Center']
        
                service left_disk('disk')['Disk'] in left_group
                service right_disk('disk')['Disk'] in right_group
                service top_disk('disk')['Disk'] in top_group
                service bottom_disk('disk')['Disk'] in bottom_group
                service center_disk('disk')['Disk'] in center_group
        
                left_disk{group} R <--> L center_disk{group}
                right_disk{group} L <--> R center_disk{group}
                top_disk{group} B <--> T center_disk{group}
                bottom_disk{group} T <-->B center_disk{group}
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(5);
      expect(edges.length).toBe(4);
      expectGroup(groups[0], 'left_group', 'cloud', 'Left', undefined);
      expectGroup(groups[1], 'right_group', 'cloud', 'Right', undefined);
      expectGroup(groups[2], 'top_group', 'cloud', 'Top', undefined);
      expectGroup(groups[3], 'bottom_group', 'cloud', 'Bottom', undefined);
      expectGroup(groups[4], 'center_group', 'cloud', 'Center', undefined);
      expectService(services[0], 'left_disk', 'disk', undefined, 'Disk', 'left_group');
      expectService(services[1], 'right_disk', 'disk', undefined, 'Disk', 'right_group');
      expectService(services[2], 'top_disk', 'disk', undefined, 'Disk', 'top_group');
      expectService(services[3], 'bottom_disk', 'disk', undefined, 'Disk', 'bottom_group');
      expectService(services[4], 'center_disk', 'disk', undefined, 'Disk', 'center_group');
      expectEdge(edges[0], 'left_disk', true, 'center_disk', true, 'R', true, undefined, 'L', true);
      expectEdge(
        edges[1],
        'right_disk',
        true,
        'center_disk',
        true,
        'L',
        true,
        undefined,
        'R',
        true
      );
      expectEdge(edges[2], 'top_disk', true, 'center_disk', true, 'B', true, undefined, 'T', true);
      expectEdge(
        edges[3],
        'bottom_disk',
        true,
        'center_disk',
        true,
        'T',
        true,
        undefined,
        'B',
        true
      );
    });
    it('should render an architecture diagram with edge labels', async () => {
      const str = `architecture-beta
                service servC('server')['Server 1']
                service servL('server')['Server 2']
                service servR('server')['Server 3']
                service servT('server')['Server 4']
                service servB('server')['Server 5']
        
                servC L-['Label']-R servL
                servC R-['Label']-L servR
                servC T-['Label']-B servT
                servC B-['Label']-T servB
        
                servL T-['Label']-L servT
                servL B-['Label']-L servB
                servR T-['Label']-R servT
                servR B-['Label']-R servB
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(0);
      expect(edges.length).toBe(8);
      expectService(services[0], 'servC', 'server', undefined, 'Server 1', undefined);
      expectService(services[1], 'servL', 'server', undefined, 'Server 2', undefined);
      expectService(services[2], 'servR', 'server', undefined, 'Server 3', undefined);
      expectService(services[3], 'servT', 'server', undefined, 'Server 4', undefined);
      expectService(services[4], 'servB', 'server', undefined, 'Server 5', undefined);
      expectEdge(edges[0], 'servC', false, 'servL', false, 'L', false, 'Label', 'R', false);
      expectEdge(edges[1], 'servC', false, 'servR', false, 'R', false, 'Label', 'L', false);
      expectEdge(edges[2], 'servC', false, 'servT', false, 'T', false, 'Label', 'B', false);
      expectEdge(edges[3], 'servC', false, 'servB', false, 'B', false, 'Label', 'T', false);
      expectEdge(edges[4], 'servL', false, 'servT', false, 'T', false, 'Label', 'L', false);
      expectEdge(edges[5], 'servL', false, 'servB', false, 'B', false, 'Label', 'L', false);
      expectEdge(edges[6], 'servR', false, 'servT', false, 'T', false, 'Label', 'R', false);
      expectEdge(edges[7], 'servR', false, 'servB', false, 'B', false, 'Label', 'R', false);
    });
    it('should render an architecture diagram with simple junction edges', async () => {
      const str = `architecture-beta
                service left_disk('disk')['Disk']
                service top_disk('disk')['Disk']
                service bottom_disk('disk')['Disk']
                service top_gateway('internet')['Gateway']
                service bottom_gateway('internet')['Gateway']
                junction juncC
                junction juncR
        
                left_disk R--L juncC
                top_disk B--T juncC
                bottom_disk T--B juncC
                juncC R--L juncR
                top_gateway B--T juncR
                bottom_gateway T--B juncR
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const junctions = getJunctions();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(0);
      expect(edges.length).toBe(6);
      expect(junctions.length).toBe(2);
      expectService(services[0], 'left_disk', 'disk', undefined, 'Disk', undefined);
      expectService(services[1], 'top_disk', 'disk', undefined, 'Disk', undefined);
      expectService(services[2], 'bottom_disk', 'disk', undefined, 'Disk', undefined);
      expectService(services[3], 'top_gateway', 'internet', undefined, 'Gateway', undefined);
      expectService(services[4], 'bottom_gateway', 'internet', undefined, 'Gateway', undefined);
      expectJunction(junctions[0], 'juncC', undefined);
      expectJunction(junctions[1], 'juncR', undefined);
      expectEdge(edges[0], 'left_disk', false, 'juncC', false, 'R', false, undefined, 'L', false);
      expectEdge(edges[1], 'top_disk', false, 'juncC', false, 'B', false, undefined, 'T', false);
      expectEdge(edges[2], 'bottom_disk', false, 'juncC', false, 'T', false, undefined, 'B', false);
      expectEdge(edges[3], 'juncC', false, 'juncR', false, 'R', false, undefined, 'L', false);
      expectEdge(edges[4], 'top_gateway', false, 'juncR', false, 'B', false, undefined, 'T', false);
      expectEdge(
        edges[5],
        'bottom_gateway',
        false,
        'juncR',
        false,
        'T',
        false,
        undefined,
        'B',
        false
      );
    });
    it('should render an architecture diagram with complex junction edges', async () => {
      const str = `architecture-beta
                group left
                group right
                service left_disk('disk')['Disk'] in left
                service top_disk('disk')['Disk'] in left
                service bottom_disk('disk')['Disk'] in left
                service top_gateway('internet')['Gateway'] in right
                service bottom_gateway('internet')['Gateway'] in right
                junction juncC in left
                junction juncR in right
        
                left_disk R--L juncC
                top_disk B--T juncC
                bottom_disk T--B juncC
        
        
                top_gateway B <--T juncR
                bottom_gateway T <--B juncR
        
                juncC{group} R-->L juncR{group}
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const junctions = getJunctions();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(2);
      expect(junctions.length).toBe(2);
      expect(edges.length).toBe(6);
      expectGroup(groups[0], 'left', undefined, undefined, undefined);
      expectGroup(groups[1], 'right', undefined, undefined, undefined);
      expectService(services[0], 'left_disk', 'disk', undefined, 'Disk', 'left');
      expectService(services[1], 'top_disk', 'disk', undefined, 'Disk', 'left');
      expectService(services[2], 'bottom_disk', 'disk', undefined, 'Disk', 'left');
      expectService(services[3], 'top_gateway', 'internet', undefined, 'Gateway', 'right');
      expectService(services[4], 'bottom_gateway', 'internet', undefined, 'Gateway', 'right');
      expectJunction(junctions[0], 'juncC', 'left');
      expectJunction(junctions[1], 'juncR', 'right');
      expectEdge(edges[0], 'left_disk', false, 'juncC', false, 'R', false, undefined, 'L', false);
      expectEdge(edges[1], 'top_disk', false, 'juncC', false, 'B', false, undefined, 'T', false);
      expectEdge(edges[2], 'bottom_disk', false, 'juncC', false, 'T', false, undefined, 'B', false);
      expectEdge(edges[3], 'top_gateway', false, 'juncR', false, 'B', true, undefined, 'T', false);
      expectEdge(
        edges[4],
        'bottom_gateway',
        false,
        'juncR',
        false,
        'T',
        true,
        undefined,
        'B',
        false
      );
      expectEdge(edges[5], 'juncC', true, 'juncR', true, 'R', false, undefined, 'L', true);
    });

    it('should render an architecture diagram with a reasonable height', async () => {
      const str = `architecture-beta
              group federated('cloud')['Federated Environment']
                  service server1('server')['System'] in federated
                  service edge('server')['Edge Device'] in federated
                  server1:R -- L:edge

              group on_prem('cloud')['Hub']
                  service firewall('server')['Firewall Device'] in on_prem
                  service server('server')['Server'] in on_prem
                  firewall:R -- L:server

                  service db1('database')['db1'] in on_prem
                  service db2('database')['db2'] in on_prem
                  service db3('database')['db3'] in on_prem
                  service db4('database')['db4'] in on_prem
                  service db5('database')['db5'] in on_prem
                  service db6('database')['db6'] in on_prem

                  junction mid in on_prem
                  server:B -- T:mid

                  junction 1Leftofmid in on_prem
                  1Leftofmid:R -- L:mid
                  1Leftofmid:B -- T:db1

                  junction 2Leftofmid in on_prem
                  2Leftofmid:R -- L:1Leftofmid
                  2Leftofmid:B -- T:db2

                  junction 3Leftofmid in on_prem
                  3Leftofmid:R -- L:2Leftofmid
                  3Leftofmid:B -- T:db3
                                    
                  junction 1RightOfMid in on_prem
                  mid:R -- L:1RightOfMid
                  1RightOfMid:B -- T:db4
                  
                  junction 2RightOfMid in on_prem
                  1RightOfMid:R -- L:2RightOfMid
                  2RightOfMid:B -- T:db5        
                  
                  junction 3RightOfMid in on_prem
                  2RightOfMid:R -- L:3RightOfMid
                  3RightOfMid:B -- T:db6         

                  edge:R -- L:firewall
      `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const junctions = getJunctions();
      const edges = getEdges();

      expect(services.length).toBe(10);
      expect(groups.length).toBe(2);
      expect(edges.length).toBe(16);
      expect(junctions.length).toBe(7);
      expectGroup(groups[0], 'federated', 'cloud', 'Federated Environment', undefined);
      expectGroup(groups[1], 'on_prem', 'cloud', 'Hub', undefined);
      expectService(services[0], 'server1', 'server', undefined, 'System', 'federated');
      expectService(services[1], 'edge', 'server', undefined, 'Edge Device', 'federated');
      expectService(services[2], 'firewall', 'server', undefined, 'Firewall Device', 'on_prem');
      expectService(services[3], 'server', 'server', undefined, 'Server', 'on_prem');
      expectService(services[4], 'db1', 'database', undefined, 'db1', 'on_prem');
      expectService(services[5], 'db2', 'database', undefined, 'db2', 'on_prem');
      expectService(services[6], 'db3', 'database', undefined, 'db3', 'on_prem');
      expectService(services[7], 'db4', 'database', undefined, 'db4', 'on_prem');
      expectService(services[8], 'db5', 'database', undefined, 'db5', 'on_prem');
      expectService(services[9], 'db6', 'database', undefined, 'db6', 'on_prem');
      expectJunction(junctions[0], 'mid', 'on_prem');
      expectJunction(junctions[1], '1Leftofmid', 'on_prem');
      expectJunction(junctions[2], '2Leftofmid', 'on_prem');
      expectJunction(junctions[3], '3Leftofmid', 'on_prem');
      expectJunction(junctions[4], '1RightOfMid', 'on_prem');
      expectJunction(junctions[5], '2RightOfMid', 'on_prem');
      expectJunction(junctions[6], '3RightOfMid', 'on_prem');
      expectEdge(edges[0], 'server1', false, 'edge', false, 'R', false, undefined, 'L', false);
      expectEdge(edges[1], 'firewall', false, 'server', false, 'R', false, undefined, 'L', false);
      expectEdge(edges[2], 'server', false, 'mid', false, 'B', false, undefined, 'T', false);
      expectEdge(edges[3], '1Leftofmid', false, 'mid', false, 'R', false, undefined, 'L', false);
      expectEdge(edges[4], '1Leftofmid', false, 'db1', false, 'B', false, undefined, 'T', false);
      expectEdge(
        edges[5],
        '2Leftofmid',
        false,
        '1Leftofmid',
        false,
        'R',
        false,
        undefined,
        'L',
        false
      );
      expectEdge(edges[6], '2Leftofmid', false, 'db2', false, 'B', false, undefined, 'T', false);
      expectEdge(
        edges[7],
        '3Leftofmid',
        false,
        '2Leftofmid',
        false,
        'R',
        false,
        undefined,
        'L',
        false
      );
      expectEdge(edges[8], '3Leftofmid', false, 'db3', false, 'B', false, undefined, 'T', false);
      expectEdge(edges[9], 'mid', false, '1RightOfMid', false, 'R', false, undefined, 'L', false);
      expectEdge(edges[10], '1RightOfMid', false, 'db4', false, 'B', false, undefined, 'T', false);
      expectEdge(
        edges[11],
        '1RightOfMid',
        false,
        '2RightOfMid',
        false,
        'R',
        false,
        undefined,
        'L',
        false
      );
      expectEdge(edges[12], '2RightOfMid', false, 'db5', false, 'B', false, undefined, 'T', false);
      expectEdge(
        edges[13],
        '2RightOfMid',
        false,
        '3RightOfMid',
        false,
        'R',
        false,
        undefined,
        'L',
        false
      );
      expectEdge(edges[14], '3RightOfMid', false, 'db6', false, 'B', false, undefined, 'T', false);
      expectEdge(edges[15], 'edge', false, 'firewall', false, 'R', false, undefined, 'L', false);
    });
  });
});
