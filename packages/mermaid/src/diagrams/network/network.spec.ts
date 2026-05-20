import { beforeEach, describe, expect, it } from 'vitest';
import { NetworkDBImpl } from './db.js';
import { parser } from './parser.js';

describe('network diagrams', () => {
  let db: NetworkDBImpl;

  beforeEach(() => {
    db = new NetworkDBImpl();
    if (parser.parser) {
      parser.parser.yy = db;
    }
  });

  it('should parse an empty network diagram', async () => {
    await expect(parser.parse('networkDiagram')).resolves.not.toThrow();
    expect(db.getNodes()).toEqual([]);
    expect(db.getLinks()).toEqual([]);
  });

  it('should parse nodes with type and label', async () => {
    const src = `networkDiagram
    title Sample Topology
    accTitle: My Title
    accDescr: My Description
    node router : router "Router"
    node sw1 : switch "Switch 1"
    node srv : server "Server"
    router --- sw1
    sw1 --- srv : "primary"
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();

    expect(db.getDiagramTitle()).toBe('Sample Topology');
    expect(db.getAccTitle()).toBe('My Title');
    expect(db.getAccDescription()).toBe('My Description');

    expect(db.getNodes()).toEqual([
      { id: 'router', nodeType: 'router', label: 'Router' },
      { id: 'sw1', nodeType: 'switch', label: 'Switch 1' },
      { id: 'srv', nodeType: 'server', label: 'Server' },
    ]);

    expect(db.getLinks()).toEqual([
      { source: 'router', target: 'sw1', label: undefined, direction: 'none' },
      { source: 'sw1', target: 'srv', label: 'primary', direction: 'none' },
    ]);
  });

  it('should auto-register nodes referenced only in links', async () => {
    const src = `network
    a --- b
    b --- c
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();

    expect(db.getNodes()).toEqual([
      { id: 'a', nodeType: 'default', label: 'a' },
      { id: 'b', nodeType: 'default', label: 'b' },
      { id: 'c', nodeType: 'default', label: 'c' },
    ]);
    expect(db.getLinks()).toHaveLength(2);
  });

  it('should capture link direction from the arrow operator', async () => {
    const src = `networkDiagram
    a --- b
    a --> b
    a <-- b
    a <--> b
    a -- b
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();
    expect(db.getLinks().map((l) => l.direction)).toEqual([
      'none',
      'forward',
      'backward',
      'both',
      'none',
    ]);
  });

  it('should capture per-node metadata', async () => {
    const src = `networkDiagram
    node r : router ip="10.0.0.1" model="hp-1234"
    node s : switch
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();
    expect(db.getNodes()[0].meta).toEqual([
      { key: 'ip', value: '10.0.0.1' },
      { key: 'model', value: 'hp-1234' },
    ]);
    expect(db.getNodes()[1].meta).toBeUndefined();
  });

  it('should support subnets containing nodes and links', async () => {
    const src = `networkDiagram
    subnet vpc1 "VPC 1" {
      node router : router
      node web : server "Web"
      router --- web
    }
    node external : cloud "Internet"
    external --- router
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();
    const subnets = db.getSubnets();
    expect(subnets).toHaveLength(1);
    expect(subnets[0]).toEqual({ id: 'vpc1', label: 'VPC 1', nodeIds: ['router', 'web'] });
    expect(db.getNodes().find((n) => n.id === 'router')?.subnet).toBe('vpc1');
    expect(db.getNodes().find((n) => n.id === 'external')?.subnet).toBeUndefined();
    expect(db.getLinks()).toHaveLength(2);
  });

  it('should fall back to the id when no label is provided', async () => {
    const src = `network
    node firewall1 : firewall
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();
    expect(db.getNodes()).toEqual([{ id: 'firewall1', nodeType: 'firewall', label: 'firewall1' }]);
  });

  it('should accept the short -- link operator', async () => {
    const src = `network
    a -- b
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();
    expect(db.getLinks()).toEqual([
      { source: 'a', target: 'b', label: undefined, direction: 'none' },
    ]);
  });

  it('should allow declaring a node multiple times without duplicating it', async () => {
    const src = `network
    node a
    node a : router "Edge Router"
    `;
    await expect(parser.parse(src)).resolves.not.toThrow();
    expect(db.getNodes()).toEqual([{ id: 'a', nodeType: 'router', label: 'Edge Router' }]);
  });

  it('should reset on clear', async () => {
    await parser.parse(`network
    node a : router
    a --- b
    `);
    expect(db.getNodes()).toHaveLength(2);
    db.clear();
    expect(db.getNodes()).toEqual([]);
    expect(db.getLinks()).toEqual([]);
  });
});
