import { parse } from '@mermaid-js/parser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { log } from '../../logger.js';
import { C4BetaDB } from './db.js';
import { populateDb } from './parser.js';

const exampleDiagram = `c4-beta context
title Internet Banking System - System Context
direction TB

person customer "Personal Banking Customer" "A customer of the bank."
system banking "Internet Banking System" "Allows customers to view accounts."
external system mainframe "Mainframe Banking System" "Stores core banking information."
system big "Big System" {
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
    expect(mainframe?.external).toBe(true);
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
      system a "A" :::tagged
      1: a --> b : "Calls" :::async
    `);
    expect(db.getKind()).toBe('dynamic');
    expect(db.getElements()[0].tags).toEqual(['tagged']);
    expect(db.getRelationships()[0].step).toBe(1);
    expect(db.getRelationships()[0].tags).toEqual(['async']);
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
        '<small>&laquo;person&raquo;</small><br/><b>Personal Banking Customer</b><br/>A customer of the bank.'
      );
    });

    it('should include technology in the node label', async () => {
      await populate(exampleDiagram);
      const { nodes } = db.getData();
      const spa = nodes.find((n) => n.id === 'spa');
      expect(spa?.label).toBe(
        '<small>&laquo;container&raquo;</small><br/><b>Single-Page App</b><br/><small><i>[JavaScript/Angular]</i></small><br/>Web UI'
      );
      expect(spa?.parentId).toBe('big');
    });

    it('should override colors and classes for external elements', async () => {
      await populate(exampleDiagram);
      const { nodes } = db.getData();
      const mainframe = nodes.find((n) => n.id === 'mainframe');
      expect(mainframe?.cssClasses).toBe('c4-shape c4-system c4-external');
      expect(mainframe?.cssStyles).toEqual(['fill: #999999', 'stroke: #8A8A8A']);
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
        system banking "Internet Banking System"
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
        system banking "Internet Banking System"
        container spa "Single-Page App"
      `);
      db.getData();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
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
