import { it, describe, expect } from 'vitest';
import { db } from './architectureDb.js';
import { parser } from './architectureParser.js';
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

describe('architecture diagrams', () => {
  beforeEach(() => {
    clear();
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
      expect(getDiagramTitle()).toBe('Simple Architecture Diagram');
    });

    it('should handle title on another line', async () => {
      const str = `architecture-beta
            title Simple Architecture Diagram
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(getDiagramTitle()).toBe('Simple Architecture Diagram');
    });

    it('should handle accessibility title and description', async () => {
      const str = `architecture-beta
            accTitle: Accessibility Title
            accDescr: Accessibility Description
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(getAccTitle()).toBe('Accessibility Title');
      expect(getAccDescription()).toBe('Accessibility Description');
    });

    it('should handle multiline accessibility description', async () => {
      const str = `architecture-beta
            accDescr {
                Accessibility Description
            }
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      expect(getAccDescription()).toBe('Accessibility Description');
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

            db:L -- R:server
            disk1:T--B:server
            disk2:T--B:db
            server:T--B:gateway
        `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(1);
      expect(edges.length).toBe(4);

      expect(groups[0]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "api",
          "in": undefined,
          "label": "API",
        }
      `);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db",
          "in": "api",
          "label": "Database",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "disk1",
          "in": "api",
          "label": "Storage",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "disk2",
          "in": "api",
          "label": "Storage",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "server",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "gateway",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "server",
          "in": "api",
          "label": "Server",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
        "edges": [
          {
            "label": undefined,
            "lhsDir": "T",
            "lhsGroup": false,
            "lhsId": "server",
            "lhsInto": false,
            "rhsDir": "B",
            "rhsGroup": false,
            "rhsId": "gateway",
            "rhsInto": false,
          },
        ],
        "icon": "internet",
        "iconText": undefined,
        "id": "gateway",
        "in": undefined,
        "label": "Gateway",
        "type": "service",
      }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "db",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "server",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "disk1",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "server",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "disk2",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "db",
          "rhsInto": false,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "server",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "gateway",
          "rhsInto": false,
        }
      `);
    });

    it('should render an architecture diagram with markdown labels', async () => {
      const str = `architecture-beta
                group api('cloud')['\`**API**\`']

                service db('database')[\`_Database_\`] in api
                service disk1('disk')["\`_Storage_\`"] in api
                service disk2('disk')["\`_Storage_\`"] in api
                service server('server')["\`_Server_\`"] in api
                service gateway('internet')["\`_Gateway_\`"] 

                db: L - ["\`**Bold Label**\`"] - R:server
                disk1: T - ["\`**Bold Label**\`"] - B:server
                disk2: T - ["\`_Italic Label_\`"] - B:db
                server: T - ["\`_Italic Label_\`"] - B:gateway

                group a('cloud')['a.b-t']
                group b('cloud')['\`user:password@some_domain.com\`']
                group c('cloud')["\`The **cat** in the hat\`"]
                group d('cloud')["\`The *bat*
                in the chat\`"]
                group e('cloud')['диск']
                group f('cloud')['➙ сервер ❤️‍🔥']
                service right_disk('disk')["❤ Disk"]
                group g('cloud')['"\`диск\`"']
        `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();
      expect(services.length).toBe(6);
      expect(groups.length).toBe(8);
      expect(edges.length).toBe(4);
      expect(groups[0]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "api",
          "in": undefined,
          "label": "\`**API**\`",
        }
      `);
      expect(groups[1]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "a",
          "in": undefined,
          "label": "a.b-t",
        }
      `);
      expect(groups[2]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "b",
          "in": undefined,
          "label": "\`user:password@some_domain.com\`",
        }
      `);
      expect(groups[3]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "c",
          "in": undefined,
          "label": "\`The **cat** in the hat\`",
        }
      `);
      expect(groups[4]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "d",
          "in": undefined,
          "label": "\`The *bat*
                        in the chat\`",
        }
      `);
      expect(groups[5]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "e",
          "in": undefined,
          "label": "диск",
        }
      `);
      expect(groups[6]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "f",
          "in": undefined,
          "label": "➙ сервер ❤️‍🔥",
        }
      `);
      expect(groups[7]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "g",
          "in": undefined,
          "label": ""\`диск\`"",
        }
      `);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "\`**Bold Label**\`",
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": "\`_Italic Label_\`",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db",
          "in": "api",
          "label": "\`_Database_\`",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "\`**Bold Label**\`",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "disk1",
          "in": "api",
          "label": "\`_Storage_\`",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "\`_Italic Label_\`",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "disk2",
          "in": "api",
          "label": "\`_Storage_\`",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "\`**Bold Label**\`",
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": "\`**Bold Label**\`",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": "\`_Italic Label_\`",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "server",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "gateway",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "server",
          "in": "api",
          "label": "\`_Server_\`",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "\`_Italic Label_\`",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "server",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "gateway",
              "rhsInto": false,
            },
          ],
          "icon": "internet",
          "iconText": undefined,
          "id": "gateway",
          "in": undefined,
          "label": "\`_Gateway_\`",
          "type": "service",
        }
      `);
      expect(services[5]).toMatchInlineSnapshot(`
        {
          "edges": [],
          "icon": "disk",
          "iconText": undefined,
          "id": "right_disk",
          "in": undefined,
          "label": "❤ Disk",
          "type": "service",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": "\`**Bold Label**\`",
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "db",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "server",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": "\`**Bold Label**\`",
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "disk1",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "server",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": "\`_Italic Label_\`",
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "disk2",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "db",
          "rhsInto": false,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": "\`_Italic Label_\`",
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "server",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "gateway",
          "rhsInto": false,
        }
      `);
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
      expect(groups[0]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "api",
          "in": undefined,
          "label": "API",
        }
      `);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db",
          "in": "api",
          "label": "Database",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "disk1",
          "in": "api",
          "label": "Storage",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "disk2",
          "in": "api",
          "label": "Storage",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "disk1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "server",
          "in": "api",
          "label": "Server",
          "type": "service",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "db",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "server",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "disk1",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "server",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "disk2",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "db",
          "rhsInto": false,
        }
      `);
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
      expect(groups[0]).toMatchInlineSnapshot(`
        {
          "icon": undefined,
          "id": "api",
          "in": undefined,
          "label": "API",
        }
      `);
      expect(groups[1]).toMatchInlineSnapshot(`
        {
          "icon": undefined,
          "id": "public",
          "in": "api",
          "label": "Public API",
        }
      `);
      expect(groups[2]).toMatchInlineSnapshot(`
        {
          "icon": undefined,
          "id": "private",
          "in": "api",
          "label": "Private API",
        }
      `);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "serv2",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "gateway",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "serv1",
          "in": "public",
          "label": "Server",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "serv2",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv2",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "serv2",
          "in": "private",
          "label": "Server",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv2",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "db",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db",
          "in": "private",
          "label": "Database",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "gateway",
              "rhsInto": false,
            },
          ],
          "icon": "internet",
          "iconText": undefined,
          "id": "gateway",
          "in": "api",
          "label": "Gateway",
          "type": "service",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "serv1",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "serv2",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "serv2",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "db",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "serv1",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "gateway",
          "rhsInto": false,
        }
      `);
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
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [],
          "icon": "iconnamedoesntexist",
          "iconText": undefined,
          "id": "unknown",
          "in": undefined,
          "label": "Unknown Icon",
          "type": "service",
        }
      `);
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
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "s3",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db",
          "in": undefined,
          "label": "Database",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "db",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "s3",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "s3",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "s3",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "s3",
          "in": undefined,
          "label": "Storage",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "s3",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "disk",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "serv1",
          "in": undefined,
          "label": "Server 1",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "serv2",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "s3",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "serv2",
          "in": undefined,
          "label": "Server 2",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "serv1",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "disk",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "disk",
          "in": undefined,
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "db",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "s3",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "serv1",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "s3",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "serv2",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "s3",
          "rhsInto": false,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "serv1",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "disk",
          "rhsInto": false,
        }
      `);
    });
    it('should render an architecture diagram with directional arrows', async () => {
      const str = `architecture-beta
                service servC('server')['Server 1']
                service servL('server')['Server 2']
                service servR('server')['Server 3']
                service servT('server')['Server 4']
                service servB('server')['Server 5']
        
                servC:L <--> R:servL
                servC:R <--> L:servR
                servC:T <--> B:servT
                servC:B <--> T:servB
        
                servL:T <--> L:servT
                servL:B <--> L:servB
                servR:T <--> R:servT
                servR:B <--> R:servB
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(0);
      expect(edges.length).toBe(8);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servL",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servR",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": true,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servC",
          "in": undefined,
          "label": "Server 1",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servL",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": true,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servL",
          "in": undefined,
          "label": "Server 2",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servR",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": true,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servR",
          "in": undefined,
          "label": "Server 3",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": true,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servT",
          "in": undefined,
          "label": "Server 4",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": true,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": true,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servB",
          "in": undefined,
          "label": "Server 5",
          "type": "service",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": true,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "servL",
          "rhsInto": true,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": true,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "servR",
          "rhsInto": true,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": true,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "servT",
          "rhsInto": true,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": true,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "servB",
          "rhsInto": true,
        }
      `);
      expect(edges[4]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "servL",
          "lhsInto": true,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "servT",
          "rhsInto": true,
        }
      `);
      expect(edges[5]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "servL",
          "lhsInto": true,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "servB",
          "rhsInto": true,
        }
      `);
      expect(edges[6]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "servR",
          "lhsInto": true,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "servT",
          "rhsInto": true,
        }
      `);
      expect(edges[7]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "servR",
          "lhsInto": true,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "servB",
          "rhsInto": true,
        }
      `);
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
        
                left_disk{group}:R <--> L:center_disk{group}
                right_disk{group}:L <--> R:center_disk{group}
                top_disk{group}:B <--> T:center_disk{group}
                bottom_disk{group}:T <--> B:center_disk{group}
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(5);
      expect(edges.length).toBe(4);
      expect(groups[0]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "left_group",
          "in": undefined,
          "label": "Left",
        }
      `);
      expect(groups[1]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "right_group",
          "in": undefined,
          "label": "Right",
        }
      `);
      expect(groups[2]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "top_group",
          "in": undefined,
          "label": "Top",
        }
      `);
      expect(groups[3]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "bottom_group",
          "in": undefined,
          "label": "Bottom",
        }
      `);
      expect(groups[4]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "center_group",
          "in": undefined,
          "label": "Center",
        }
      `);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": true,
              "lhsId": "left_disk",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "left_disk",
          "in": "left_group",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": true,
              "lhsId": "right_disk",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "right_disk",
          "in": "right_group",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": true,
              "lhsId": "top_disk",
              "lhsInto": true,
              "rhsDir": "T",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "top_disk",
          "in": "top_group",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": true,
              "lhsId": "bottom_disk",
              "lhsInto": true,
              "rhsDir": "B",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "bottom_disk",
          "in": "bottom_group",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": true,
              "lhsId": "left_disk",
              "lhsInto": true,
              "rhsDir": "L",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "L",
              "lhsGroup": true,
              "lhsId": "right_disk",
              "lhsInto": true,
              "rhsDir": "R",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": true,
              "lhsId": "top_disk",
              "lhsInto": true,
              "rhsDir": "T",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": true,
              "lhsId": "bottom_disk",
              "lhsInto": true,
              "rhsDir": "B",
              "rhsGroup": true,
              "rhsId": "center_disk",
              "rhsInto": true,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "center_disk",
          "in": "center_group",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": true,
          "lhsId": "left_disk",
          "lhsInto": true,
          "rhsDir": "L",
          "rhsGroup": true,
          "rhsId": "center_disk",
          "rhsInto": true,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "L",
          "lhsGroup": true,
          "lhsId": "right_disk",
          "lhsInto": true,
          "rhsDir": "R",
          "rhsGroup": true,
          "rhsId": "center_disk",
          "rhsInto": true,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": true,
          "lhsId": "top_disk",
          "lhsInto": true,
          "rhsDir": "T",
          "rhsGroup": true,
          "rhsId": "center_disk",
          "rhsInto": true,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": true,
          "lhsId": "bottom_disk",
          "lhsInto": true,
          "rhsDir": "B",
          "rhsGroup": true,
          "rhsId": "center_disk",
          "rhsInto": true,
        }
      `);
    });
    it('should render an architecture diagram with edge labels', async () => {
      const str = `architecture-beta
                service servC('server')['Server 1']
                service servL('server')['Server 2']
                service servR('server')['Server 3']
                service servT('server')['Server 4']
                service servB('server')['Server 5']
        
                servC: L-['Label']-R:servL
                servC: R-['Label']-L:servR
                servC: T-['Label']-B:servT
                servC: B-['Label']-T:servB
        
                servL:T-['Label']-L:servT
                servL:B-['Label']-L:servB
                servR:T-['Label']-R:servT
                servR:B-['Label']-R:servB
            `;
      await expect(parser.parse(str)).resolves.not.toThrow();
      const services = getServices();
      const groups = getGroups();
      const edges = getEdges();

      expect(services.length).toBe(5);
      expect(groups.length).toBe(0);
      expect(edges.length).toBe(8);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "Label",
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servL",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servR",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servC",
          "in": undefined,
          "label": "Server 1",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "Label",
              "lhsDir": "L",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servL",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servL",
          "in": undefined,
          "label": "Server 2",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "Label",
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servR",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servR",
          "in": undefined,
          "label": "Server 3",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "Label",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servT",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servT",
          "in": undefined,
          "label": "Server 4",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": "Label",
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servC",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servL",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": false,
            },
            {
              "label": "Label",
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "servR",
              "lhsInto": false,
              "rhsDir": "R",
              "rhsGroup": false,
              "rhsId": "servB",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "servB",
          "in": undefined,
          "label": "Server 5",
          "type": "service",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "L",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "servL",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "servR",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "servT",
          "rhsInto": false,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "servC",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "servB",
          "rhsInto": false,
        }
      `);
      expect(edges[4]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "servL",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "servT",
          "rhsInto": false,
        }
      `);
      expect(edges[5]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "servL",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "servB",
          "rhsInto": false,
        }
      `);
      expect(edges[6]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "servR",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "servT",
          "rhsInto": false,
        }
      `);
      expect(edges[7]).toMatchInlineSnapshot(`
        {
          "label": "Label",
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "servR",
          "lhsInto": false,
          "rhsDir": "R",
          "rhsGroup": false,
          "rhsId": "servB",
          "rhsInto": false,
        }
      `);
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
        
                left_disk:R--L:juncC
                top_disk:B--T:juncC
                bottom_disk:T--B:juncC
                juncC:R--L:juncR
                top_gateway:B--T:juncR
                bottom_gateway:T--B:juncR
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
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "left_disk",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "left_disk",
          "in": undefined,
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_disk",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "top_disk",
          "in": undefined,
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_disk",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "bottom_disk",
          "in": undefined,
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_gateway",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
          ],
          "icon": "internet",
          "iconText": undefined,
          "id": "top_gateway",
          "in": undefined,
          "label": "Gateway",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_gateway",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
          ],
          "icon": "internet",
          "iconText": undefined,
          "id": "bottom_gateway",
          "in": undefined,
          "label": "Gateway",
          "type": "service",
        }
      `);
      expect(junctions[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "left_disk",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_disk",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_disk",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "juncC",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
          ],
          "id": "juncC",
          "in": undefined,
          "type": "junction",
        }
      `);
      expect(junctions[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "juncC",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_gateway",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_gateway",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
          ],
          "id": "juncR",
          "in": undefined,
          "type": "junction",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "left_disk",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "juncC",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "top_disk",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "juncC",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "bottom_disk",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "juncC",
          "rhsInto": false,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "juncC",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "juncR",
          "rhsInto": false,
        }
      `);
      expect(edges[4]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "top_gateway",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "juncR",
          "rhsInto": false,
        }
      `);
      expect(edges[5]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "bottom_gateway",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "juncR",
          "rhsInto": false,
        }
      `);
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
        
                left_disk:R--L:juncC
                top_disk:B--T:juncC
                bottom_disk:T--B:juncC
        
        
                top_gateway:B <--T:juncR
                bottom_gateway:T <--B:juncR
        
                juncC{group}:R-->L:juncR{group}
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
      expect(groups[0]).toMatchInlineSnapshot(`
        {
          "icon": undefined,
          "id": "left",
          "in": undefined,
          "label": undefined,
        }
      `);
      expect(groups[1]).toMatchInlineSnapshot(`
        {
          "icon": undefined,
          "id": "right",
          "in": undefined,
          "label": undefined,
        }
      `);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "left_disk",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "left_disk",
          "in": "left",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_disk",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "top_disk",
          "in": "left",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_disk",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
          ],
          "icon": "disk",
          "iconText": undefined,
          "id": "bottom_disk",
          "in": "left",
          "label": "Disk",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_gateway",
              "lhsInto": true,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
          ],
          "icon": "internet",
          "iconText": undefined,
          "id": "top_gateway",
          "in": "right",
          "label": "Gateway",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_gateway",
              "lhsInto": true,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
          ],
          "icon": "internet",
          "iconText": undefined,
          "id": "bottom_gateway",
          "in": "right",
          "label": "Gateway",
          "type": "service",
        }
      `);
      expect(junctions[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "left_disk",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_disk",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_disk",
              "lhsInto": false,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncC",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": true,
              "lhsId": "juncC",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": true,
              "rhsId": "juncR",
              "rhsInto": true,
            },
          ],
          "id": "juncC",
          "in": "left",
          "type": "junction",
        }
      `);
      expect(junctions[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "top_gateway",
              "lhsInto": true,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "T",
              "lhsGroup": false,
              "lhsId": "bottom_gateway",
              "lhsInto": true,
              "rhsDir": "B",
              "rhsGroup": false,
              "rhsId": "juncR",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": true,
              "lhsId": "juncC",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": true,
              "rhsId": "juncR",
              "rhsInto": true,
            },
          ],
          "id": "juncR",
          "in": "right",
          "type": "junction",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "left_disk",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "juncC",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "top_disk",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "juncC",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "bottom_disk",
          "lhsInto": false,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "juncC",
          "rhsInto": false,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "top_gateway",
          "lhsInto": true,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "juncR",
          "rhsInto": false,
        }
      `);
      expect(edges[4]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "T",
          "lhsGroup": false,
          "lhsId": "bottom_gateway",
          "lhsInto": true,
          "rhsDir": "B",
          "rhsGroup": false,
          "rhsId": "juncR",
          "rhsInto": false,
        }
      `);
      expect(edges[5]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": true,
          "lhsId": "juncC",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": true,
          "rhsId": "juncR",
          "rhsInto": true,
        }
      `);
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
      expect(groups[0]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "federated",
          "in": undefined,
          "label": "Federated Environment",
        }
      `);
      expect(groups[1]).toMatchInlineSnapshot(`
        {
          "icon": "cloud",
          "id": "on_prem",
          "in": undefined,
          "label": "Hub",
        }
      `);
      expect(services[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "server1",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "edge",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "server1",
          "in": "federated",
          "label": "System",
          "type": "service",
        }
      `);
      expect(services[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "server1",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "edge",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "edge",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "firewall",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "edge",
          "in": "federated",
          "label": "Edge Device",
          "type": "service",
        }
      `);
      expect(services[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "firewall",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "edge",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "firewall",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "firewall",
          "in": "on_prem",
          "label": "Firewall Device",
          "type": "service",
        }
      `);
      expect(services[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "firewall",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "server",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "server",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "mid",
              "rhsInto": false,
            },
          ],
          "icon": "server",
          "iconText": undefined,
          "id": "server",
          "in": "on_prem",
          "label": "Server",
          "type": "service",
        }
      `);
      expect(services[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "1Leftofmid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db1",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db1",
          "in": "on_prem",
          "label": "db1",
          "type": "service",
        }
      `);
      expect(services[5]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "2Leftofmid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db2",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db2",
          "in": "on_prem",
          "label": "db2",
          "type": "service",
        }
      `);
      expect(services[6]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "3Leftofmid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db3",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db3",
          "in": "on_prem",
          "label": "db3",
          "type": "service",
        }
      `);
      expect(services[7]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "1RightOfMid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db4",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db4",
          "in": "on_prem",
          "label": "db4",
          "type": "service",
        }
      `);
      expect(services[8]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "2RightOfMid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db5",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db5",
          "in": "on_prem",
          "label": "db5",
          "type": "service",
        }
      `);
      expect(services[9]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "3RightOfMid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db6",
              "rhsInto": false,
            },
          ],
          "icon": "database",
          "iconText": undefined,
          "id": "db6",
          "in": "on_prem",
          "label": "db6",
          "type": "service",
        }
      `);
      expect(junctions[0]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "server",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "mid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "1Leftofmid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "mid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "mid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "1RightOfMid",
              "rhsInto": false,
            },
          ],
          "id": "mid",
          "in": "on_prem",
          "type": "junction",
        }
      `);
      expect(junctions[1]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "1Leftofmid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "mid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "1Leftofmid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db1",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "2Leftofmid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "1Leftofmid",
              "rhsInto": false,
            },
          ],
          "id": "1Leftofmid",
          "in": "on_prem",
          "type": "junction",
        }
      `);
      expect(junctions[2]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "2Leftofmid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "1Leftofmid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "2Leftofmid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db2",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "3Leftofmid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "2Leftofmid",
              "rhsInto": false,
            },
          ],
          "id": "2Leftofmid",
          "in": "on_prem",
          "type": "junction",
        }
      `);
      expect(junctions[3]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "3Leftofmid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "2Leftofmid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "3Leftofmid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db3",
              "rhsInto": false,
            },
          ],
          "id": "3Leftofmid",
          "in": "on_prem",
          "type": "junction",
        }
      `);
      expect(junctions[4]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "mid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "1RightOfMid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "1RightOfMid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db4",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "1RightOfMid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "2RightOfMid",
              "rhsInto": false,
            },
          ],
          "id": "1RightOfMid",
          "in": "on_prem",
          "type": "junction",
        }
      `);
      expect(junctions[5]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "1RightOfMid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "2RightOfMid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "2RightOfMid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db5",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "2RightOfMid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "3RightOfMid",
              "rhsInto": false,
            },
          ],
          "id": "2RightOfMid",
          "in": "on_prem",
          "type": "junction",
        }
      `);
      expect(junctions[6]).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "label": undefined,
              "lhsDir": "R",
              "lhsGroup": false,
              "lhsId": "2RightOfMid",
              "lhsInto": false,
              "rhsDir": "L",
              "rhsGroup": false,
              "rhsId": "3RightOfMid",
              "rhsInto": false,
            },
            {
              "label": undefined,
              "lhsDir": "B",
              "lhsGroup": false,
              "lhsId": "3RightOfMid",
              "lhsInto": false,
              "rhsDir": "T",
              "rhsGroup": false,
              "rhsId": "db6",
              "rhsInto": false,
            },
          ],
          "id": "3RightOfMid",
          "in": "on_prem",
          "type": "junction",
        }
      `);
      expect(edges[0]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "server1",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "edge",
          "rhsInto": false,
        }
      `);
      expect(edges[1]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "firewall",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "server",
          "rhsInto": false,
        }
      `);
      expect(edges[2]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "server",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "mid",
          "rhsInto": false,
        }
      `);
      expect(edges[3]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "1Leftofmid",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "mid",
          "rhsInto": false,
        }
      `);
      expect(edges[4]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "1Leftofmid",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "db1",
          "rhsInto": false,
        }
      `);
      expect(edges[5]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "2Leftofmid",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "1Leftofmid",
          "rhsInto": false,
        }
      `);
      expect(edges[6]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "2Leftofmid",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "db2",
          "rhsInto": false,
        }
      `);
      expect(edges[7]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "3Leftofmid",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "2Leftofmid",
          "rhsInto": false,
        }
      `);
      expect(edges[8]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "3Leftofmid",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "db3",
          "rhsInto": false,
        }
      `);
      expect(edges[9]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "mid",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "1RightOfMid",
          "rhsInto": false,
        }
      `);
      expect(edges[10]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "1RightOfMid",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "db4",
          "rhsInto": false,
        }
      `);
      expect(edges[11]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "1RightOfMid",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "2RightOfMid",
          "rhsInto": false,
        }
      `);
      expect(edges[12]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "2RightOfMid",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "db5",
          "rhsInto": false,
        }
      `);
      expect(edges[13]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "2RightOfMid",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "3RightOfMid",
          "rhsInto": false,
        }
      `);
      expect(edges[14]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "B",
          "lhsGroup": false,
          "lhsId": "3RightOfMid",
          "lhsInto": false,
          "rhsDir": "T",
          "rhsGroup": false,
          "rhsId": "db6",
          "rhsInto": false,
        }
      `);
      expect(edges[15]).toMatchInlineSnapshot(`
        {
          "label": undefined,
          "lhsDir": "R",
          "lhsGroup": false,
          "lhsId": "edge",
          "lhsInto": false,
          "rhsDir": "L",
          "rhsGroup": false,
          "rhsId": "firewall",
          "rhsInto": false,
        }
      `);
    });
  });
});
