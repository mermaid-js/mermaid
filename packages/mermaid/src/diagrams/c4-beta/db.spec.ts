import { parse } from '@mermaid-js/parser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { log } from '../../logger.js';
import { C4BetaDB } from './db.js';
import { populateDb } from './parser.js';

const exampleDiagram = `c4-beta context
title Internet Banking System - System Context
direction TB

person customer "Personal Banking Customer" "A customer of the bank."
softwareSystem banking "Internet Banking System" "Allows customers to view accounts."
softwareSystem mainframe "Mainframe Banking System" "Stores core banking information." :::external
softwareSystem big "Big System" {
    container spa "Single-Page App" "Web UI" "JavaScript/Angular"
}

customer --> banking : "Views account balances using"
banking --> mainframe : "Gets account information from" "XML/HTTPS"
banking <--> mainframe : "Syncs with"
`;

describe('c4-beta db', () => {
  let db: C4BetaDB;

  beforeEach(() => {
    db = new C4BetaDB();
    db.clear();
  });

  const populate = async (text: string) => {
    populateDb(await parse('c4', text), db);
  };

  it('should store kind, direction and title', async () => {
    await populate(exampleDiagram);
    expect(db.getKind()).toBe('context');
    expect(db.getDirection()).toBe('TB');
    expect(db.getDiagramTitle()).toBe('Internet Banking System - System Context');
  });

  it('should default kind to context and direction to TB', async () => {
    await populate(`c4-beta\nperson a "A"\n`);
    expect(db.getKind()).toBe('context');
    expect(db.getDirection()).toBe('TB');
  });

  it('should store elements including nested children with parentId', async () => {
    await populate(exampleDiagram);
    const elements = db.getElements();
    expect(elements.map((e) => e.id)).toEqual(['customer', 'banking', 'mainframe', 'big', 'spa']);
    const spa = elements.find((e) => e.id === 'spa');
    expect(spa?.parentId).toBe('big');
    expect(spa?.technology).toBe('JavaScript/Angular');
    const mainframe = elements.find((e) => e.id === 'mainframe');
    expect(mainframe?.tags).toContain('external');
  });

  it('should store relationships', async () => {
    await populate(exampleDiagram);
    const relationships = db.getRelationships();
    expect(relationships).toHaveLength(3);
    expect(relationships[1]).toMatchObject({
      sourceId: 'banking',
      targetId: 'mainframe',
      arrow: '-->',
      description: 'Gets account information from',
      technology: 'XML/HTTPS',
    });
    expect(relationships[2].arrow).toBe('<-->');
  });

  it('should store step numbers and tags without rendering them', async () => {
    await populate(`c4-beta dynamic
      softwareSystem a "A" :::tagged
      1: a --> b : "Calls" :::async
    `);
    expect(db.getKind()).toBe('dynamic');
    expect(db.getElements()[0].tags).toEqual(['tagged']);
    expect(db.getRelationships()[0].step).toBe(1);
    expect(db.getRelationships()[0].tags).toEqual(['async']);
  });

  it('should keep the softwareSystem kind and render its stereotype label', async () => {
    await populate(`c4-beta context\nsoftwareSystem banking "Internet Banking System"\n`);
    const element = db.getElements()[0];
    expect(element.kind).toBe('softwareSystem');
    const { nodes } = db.getData();
    expect(nodes[0].cssClasses).toBe('c4-shape c4-softwareSystem');
    expect(nodes[0].label).toContain('&laquo;Software System&raquo;');
  });

  it('should keep the deploymentNode kind and render it as a cluster', async () => {
    await populate(`c4-beta deployment\ndeploymentNode aws "AWS" "" "Cloud"\n`);
    const element = db.getElements()[0];
    expect(element.kind).toBe('deploymentNode');
    const { nodes } = db.getData();
    expect(nodes[0].cssClasses).toBe('c4-boundary c4-deploymentNode');
    expect(nodes[0].label).toBe('AWS [Deployment Node: Cloud]');
  });

  describe('getData', () => {
    it('should map a person element to a styled node', async () => {
      await populate(exampleDiagram);
      const { nodes } = db.getData();
      const customer = nodes.find((n) => n.id === 'customer');
      expect(customer).toBeDefined();
      expect(customer?.isGroup).toBe(false);
      expect(customer?.shape).toBe('c4-person');
      expect(customer?.cssClasses).toBe('c4-shape c4-person');
      expect(customer?.cssStyles).toEqual(['fill: #08427B', 'stroke: #073B6F']);
      expect(customer?.label).toBe(
        '<small>&laquo;Person&raquo;</small><br/><b>Personal Banking Customer</b><br/>A customer of the bank.'
      );
    });

    it('should include technology in the node label', async () => {
      await populate(exampleDiagram);
      const { nodes } = db.getData();
      const spa = nodes.find((n) => n.id === 'spa');
      expect(spa?.label).toBe(
        '<small>&laquo;Container&raquo;</small><br/><b>Single-Page App</b><br/><small><i>[JavaScript/Angular]</i></small><br/>Web UI'
      );
      expect(spa?.parentId).toBe('big');
    });

    it('should add the c4-external class for the built-in external tag without inline colors', async () => {
      await populate(exampleDiagram);
      const { nodes } = db.getData();
      const mainframe = nodes.find((n) => n.id === 'mainframe');
      expect(mainframe?.cssClasses).toBe('c4-shape c4-softwareSystem c4-external c4-tag-external');
      // No inline kind colors: the default grey comes from the .c4-external CSS rule.
      expect(mainframe?.cssStyles).toEqual([]);
    });

    it('should let a style statement override the built-in external tag', async () => {
      await populate(`c4-beta context
        style external fill:#123456
        softwareSystem mainframe "Mainframe" :::external
      `);
      const { nodes } = db.getData();
      const mainframe = nodes.find((n) => n.id === 'mainframe');
      expect(mainframe?.cssClasses).toBe('c4-shape c4-softwareSystem c4-external c4-tag-external');
      // Inline cssStyles beat the default .c4-external class rule.
      expect(mainframe?.cssStyles).toContain('fill: #123456');
    });

    it('should render elements with children as boundary clusters', async () => {
      await populate(exampleDiagram);
      const { nodes } = db.getData();
      const big = nodes.find((n) => n.id === 'big');
      expect(big?.isGroup).toBe(true);
      expect(big?.cssClasses).toBe('c4-boundary');
      expect(big?.label).toBe('Big System');
    });

    it('should escape HTML special characters in user text', async () => {
      await populate(`c4-beta
        person evil "<script>alert(1)</script> & more"
      `);
      const { nodes } = db.getData();
      expect(nodes[0].label).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; more');
    });

    it('should map relationships to edges with correct arrow types', async () => {
      await populate(exampleDiagram);
      const { edges } = db.getData();
      expect(edges).toHaveLength(3);

      const forward = edges[0];
      expect(forward.start).toBe('customer');
      expect(forward.end).toBe('banking');
      expect(forward.classes).toBe('c4-rel');
      expect(forward.arrowTypeStart).toBe('none');
      expect(forward.arrowTypeEnd).toBe('arrow_point');
      expect(forward.label).toBe('<b>Views account balances using</b>');

      const withTechnology = edges[1];
      expect(withTechnology.label).toBe(
        '<b>Gets account information from</b><br/><small><i>[XML/HTTPS]</i></small>'
      );

      const bidirectional = edges[2];
      expect(bidirectional.arrowTypeStart).toBe('arrow_point');
      expect(bidirectional.arrowTypeEnd).toBe('arrow_point');
    });

    it('should map non-person elements to the rect shape', async () => {
      await populate(exampleDiagram);
      const { nodes } = db.getData();
      expect(nodes.find((n) => n.id === 'banking')?.shape).toBe('rect');
    });

    it('should warn about element kinds unexpected for the diagram kind', async () => {
      const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      await populate(`c4-beta context
        softwareSystem banking "Internet Banking System"
        container spa "Single-Page App"
      `);
      db.getData();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        'c4-beta: element "spa" of kind "container" is unexpected in a "context" diagram; rendering it anyway'
      );
      warnSpy.mockRestore();
    });

    it('should not warn when element kinds match the diagram kind', async () => {
      const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      await populate(`c4-beta container
        person user "User"
        softwareSystem banking "Internet Banking System"
        container spa "Single-Page App"
      `);
      db.getData();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    describe('technology validation', () => {
      it('should ignore technology on a person and warn', async () => {
        const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
        await populate(`c4-beta context\nperson x "Name" "Desc" "Tech"\n`);
        const { nodes } = db.getData();
        expect(nodes[0].label).not.toContain('Tech');
        expect(nodes[0].label).toBe('<small>&laquo;Person&raquo;</small><br/><b>Name</b><br/>Desc');
        expect(warnSpy).toHaveBeenCalledOnce();
        warnSpy.mockRestore();
      });

      it('should ignore technology on a software system and warn', async () => {
        const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
        await populate(`c4-beta context\nsoftwareSystem y "Name" "Desc" "Tech"\n`);
        const { nodes } = db.getData();
        expect(nodes[0].label).not.toContain('Tech');
        expect(warnSpy).toHaveBeenCalledOnce();
        warnSpy.mockRestore();
      });

      it('should keep technology on a container', async () => {
        await populate(`c4-beta container\ncontainer z "Name" "Desc" "Tech"\n`);
        const { nodes } = db.getData();
        expect(nodes[0].label).toContain('[Tech]');
      });
    });

    describe('tag styles', () => {
      it('should apply tag styles to elements after the built-in kind colors', async () => {
        await populate(`c4-beta context
          style web fill:#1F2937, stroke:#111827, color:#fff
          softwareSystem banking "Internet Banking System" :::web
        `);
        const { nodes } = db.getData();
        expect(nodes[0].cssClasses).toBe('c4-shape c4-softwareSystem c4-tag-web');
        expect(nodes[0].cssStyles).toEqual([
          'fill: #1168BD',
          'stroke: #3C7FC0',
          'fill: #1F2937',
          'stroke: #111827',
          'color: #fff',
        ]);
      });

      it('should map shape:cylinder to the cylinder shape', async () => {
        await populate(`c4-beta container
          style database shape:cylinder
          container db "Database" :::database
        `);
        const { nodes } = db.getData();
        expect(nodes[0].shape).toBe('cylinder');
      });

      it('should apply tag styles and line pattern to relationships', async () => {
        await populate(`c4-beta context
          style async stroke:#0a0, color:#0a0, line:dashed
          a --> b : "Calls" :::async
        `);
        const { edges } = db.getData();
        expect(edges[0].classes).toBe('c4-rel c4-tag-async');
        expect(edges[0].style).toEqual(['stroke: #0a0', 'color: #0a0']);
        expect(edges[0].pattern).toBe('dashed');
      });

      it('should add tag classes even for tags without styles', async () => {
        await populate(`c4-beta context
          softwareSystem a "A" :::critical
          a --> b :::async
        `);
        const data = db.getData();
        expect(data.nodes[0].cssClasses).toBe('c4-shape c4-softwareSystem c4-tag-critical');
        expect(data.edges[0].classes).toBe('c4-rel c4-tag-async');
        expect(data.edges[0].pattern).toBe('solid');
      });

      it('should warn about and ignore unsupported style keys and values', async () => {
        const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
        await populate(`c4-beta context
          style odd border:#fff, shape:hexagon, line:wavy
          softwareSystem a "A" :::odd
        `);
        expect(warnSpy).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalledWith(
          'c4-beta: unsupported style "border:#fff" for tag "odd"; ignoring it'
        );
        const { nodes } = db.getData();
        expect(nodes[0].shape).toBe('rect');
        expect(nodes[0].cssStyles).toEqual(['fill: #1168BD', 'stroke: #3C7FC0']);
        warnSpy.mockRestore();
      });

      it('should merge repeated style statements for the same tag', async () => {
        await populate(`c4-beta context
          style web fill:#111
          style web stroke:#222
          softwareSystem a "A" :::web
        `);
        const { nodes } = db.getData();
        expect(nodes[0].cssStyles).toContain('fill: #111');
        expect(nodes[0].cssStyles).toContain('stroke: #222');
      });
    });

    describe('dynamic diagrams', () => {
      it('should auto-number relationships in declaration order', async () => {
        await populate(`c4-beta dynamic
          container spa "Single-Page App"
          container api "API Application"
          spa --> api : "Submits credentials to" "JSON/HTTPS"
          api --> spa : "Sends back an auth token to"
        `);
        const { edges } = db.getData();
        expect(edges[0].label).toBe(
          '<b>1. Submits credentials to</b><br/><small><i>[JSON/HTTPS]</i></small>'
        );
        expect(edges[1].label).toBe('<b>2. Sends back an auth token to</b>');
      });

      it('should let an explicit step override the counter and continue from it', async () => {
        await populate(`c4-beta dynamic
          container a "A"
          container b "B"
          a --> b : "First"
          a --> b : "Second"
          5: a --> b : "Fifth"
          a --> b : "Sixth"
        `);
        const { edges } = db.getData();
        expect(edges.map((e) => e.label)).toEqual([
          '<b>1. First</b>',
          '<b>2. Second</b>',
          '<b>5. Fifth</b>',
          '<b>6. Sixth</b>',
        ]);
      });

      it('should number relationships without a description', async () => {
        await populate(`c4-beta dynamic
          container a "A"
          container b "B"
          a --> b
        `);
        const { edges } = db.getData();
        expect(edges[0].label).toBe('<b>1.</b>');
      });

      it('should mark repeated step numbers as parallel and resume from the max', async () => {
        await populate(`c4-beta dynamic
          container a "A"
          container b "B"
          container c "C"
          a --> b : "First"
          2: a --> b : "Parallel one"
          2: a --> c : "Parallel two"
          a --> c : "Next"
        `);
        const { edges } = db.getData();
        expect(edges.map((e) => e.label)).toEqual([
          '<b>1. First</b>',
          '<b>2. Parallel one</b>',
          '<b>2. Parallel two</b>',
          '<b>3. Next</b>',
        ]);
      });

      it('should ignore step numbers in non-dynamic diagrams', async () => {
        await populate(`c4-beta context
          softwareSystem a "A"
          softwareSystem b "B"
          3: a --> b : "Calls"
        `);
        const { edges } = db.getData();
        expect(edges[0].label).toBe('<b>Calls</b>');
      });
    });

    describe('deployment diagrams', () => {
      it('should render node elements as clusters even without children', async () => {
        await populate(`c4-beta deployment
          deploymentNode empty "Empty Node" "" "Ubuntu 22.04"
        `);
        const { nodes } = db.getData();
        expect(nodes[0].isGroup).toBe(true);
        expect(nodes[0].cssClasses).toBe('c4-boundary c4-deploymentNode');
        expect(nodes[0].label).toBe('Empty Node [Deployment Node: Ubuntu 22.04]');
      });

      it('should omit the technology from the node label when absent', async () => {
        await populate(`c4-beta deployment
          deploymentNode plain "Plain Node"
        `);
        const { nodes } = db.getData();
        expect(nodes[0].label).toBe('Plain Node [Deployment Node]');
      });

      it('should render an infrastructureNode as a leaf box, not a cluster', async () => {
        await populate(`c4-beta deployment
          infrastructureNode lb "Load Balancer" "Routes traffic." "nginx"
        `);
        const element = db.getElements()[0];
        expect(element.kind).toBe('infrastructureNode');
        const { nodes } = db.getData();
        expect(nodes[0].isGroup).toBe(false);
        expect(nodes[0].cssClasses).toBe('c4-shape c4-infrastructureNode');
        expect(nodes[0].label).toContain('&laquo;Infrastructure Node&raquo;');
        expect(nodes[0].cssStyles).toEqual(['fill: #8b8b8b', 'stroke: #6b6b6b']);
      });

      it('should let an infrastructureNode be a relationship endpoint', async () => {
        await populate(`c4-beta deployment
          infrastructureNode lb "Load Balancer"
          deploymentNode web "Web Server" {
            container app "Web Application"
          }
          lb --> app : "Forwards requests to"
        `);
        const { edges } = db.getData();
        expect(edges).toHaveLength(1);
        expect(edges[0].start).toBe('lb');
        expect(edges[0].end).toBe('app');
      });

      it('should support nesting three levels deep with containers as leaves', async () => {
        await populate(`c4-beta deployment
          deploymentNode aws "AWS" "" "Amazon Web Services" {
            deploymentNode region "US-East-1" "" "AWS Region" {
              deploymentNode ecs "ECS Cluster" "" "AWS ECS" {
                container api "API Application" "Handles requests" "Java"
              }
            }
          }
        `);
        const { nodes } = db.getData();
        const byId = new Map(nodes.map((n) => [n.id, n]));
        expect(byId.get('aws')?.isGroup).toBe(true);
        expect(byId.get('region')?.parentId).toBe('aws');
        expect(byId.get('ecs')?.parentId).toBe('region');
        const api = byId.get('api');
        expect(api?.isGroup).toBe(false);
        expect(api?.parentId).toBe('ecs');
        expect(api?.shape).toBe('rect');
      });

      it('should warn about relationships connecting two clusters', async () => {
        const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
        await populate(`c4-beta deployment
          deploymentNode a "A" {
            container inner1 "Inner 1"
          }
          deploymentNode b "B" {
            container inner2 "Inner 2"
          }
          a --> b : "Cluster to cluster"
          inner1 --> inner2 : "Leaf to leaf"
        `);
        const { edges } = db.getData();
        expect(edges).toHaveLength(2);
        expect(warnSpy).toHaveBeenCalledOnce();
        expect(warnSpy).toHaveBeenCalledWith(
          'c4-beta: relationship "a --> b" connects two clusters; relationships should connect leaf elements'
        );
        warnSpy.mockRestore();
      });
    });

    it('should include direction in the layout data', async () => {
      await populate(`c4-beta
        direction LR
        person a "A"
      `);
      const data = db.getData();
      expect(data.direction).toBe('LR');
    });
  });

  it('should reset state on clear', async () => {
    await populate(exampleDiagram);
    db.clear();
    expect(db.getElements()).toHaveLength(0);
    expect(db.getRelationships()).toHaveLength(0);
    expect(db.getKind()).toBe('context');
    expect(db.getDirection()).toBe('TB');
  });
});
