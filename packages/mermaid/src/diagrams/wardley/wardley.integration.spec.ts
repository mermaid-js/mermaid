import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './wardleyParser.js';
import { db } from './wardleyDb.js';

describe('Wardley Map Parsing — Basic', () => {
  beforeEach(() => db.clear());

  it('should parse simple wardley map with components and edges', async () => {
    await parser.parse(`wardleyMap
      component user "User" [0.5, 0.9]
      component api "API" [0.65, 0.75]
      user -> api
    `);

    const components = db.getComponents();
    expect(components).toHaveLength(2);
    expect(components[0].id).toBe('user');
    expect(components[0].label).toBe('User');
    expect(components[0].x).toBe(0.5);
    expect(components[0].y).toBe(0.9);
    expect(components[1].id).toBe('api');

    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('user');
    expect(edges[0].target).toBe('api');
  });

  it('should parse anchor components', async () => {
    await parser.parse(`wardleyMap
      anchor user "User" [0.9, 0.5]
    `);

    const components = db.getComponents();
    expect(components).toHaveLength(1);
    expect(components[0].id).toBe('user');
    expect(components[0].label).toBe('User');
    expect(components[0].type).toBe('anchor');
    expect(components[0].x).toBe(0.9);
    expect(components[0].y).toBe(0.5);
  });

  it('should parse component with market type', async () => {
    await parser.parse(`wardleyMap
      component mkt "Market" [0.5, 0.5] market
    `);

    const comp = db.getComponent('mkt');
    expect(comp).toBeDefined();
    expect(comp!.type).toBe('market');
  });

  it('should parse component with ecosystem type', async () => {
    await parser.parse(`wardleyMap
      component eco "Ecosystem" [0.4, 0.6] ecosystem
    `);

    const comp = db.getComponent('eco');
    expect(comp).toBeDefined();
    expect(comp!.type).toBe('ecosystem');
  });

  it('should parse component with build sourcing', async () => {
    await parser.parse(`wardleyMap
      component svc "Service" [0.5, 0.5] build
    `);

    const comp = db.getComponent('svc');
    expect(comp).toBeDefined();
    expect(comp!.sourcing).toBe('build');
  });

  it('should parse component with buy sourcing', async () => {
    await parser.parse(`wardleyMap
      component svc "Service" [0.5, 0.5] buy
    `);

    const comp = db.getComponent('svc');
    expect(comp).toBeDefined();
    expect(comp!.sourcing).toBe('buy');
  });

  it('should parse component with outsource sourcing', async () => {
    await parser.parse(`wardleyMap
      component svc "Service" [0.5, 0.5] outsource
    `);

    const comp = db.getComponent('svc');
    expect(comp).toBeDefined();
    expect(comp!.sourcing).toBe('outsource');
  });

  it('should parse component with inertia', async () => {
    await parser.parse(`wardleyMap
      component legacy "Legacy" [0.3, 0.5] inertia
    `);

    const comp = db.getComponent('legacy');
    expect(comp).toBeDefined();
    expect(comp!.inertia).toBe(true);
  });

  it('should parse component with label offset', async () => {
    await parser.parse(`wardleyMap
      component a "A" [0.5, 0.5] label [10, 5]
    `);

    const comp = db.getComponent('a');
    expect(comp).toBeDefined();
    expect(comp!.labelOffset).toEqual({ dx: 10, dy: 5 });
  });

  it('should parse comments', async () => {
    await parser.parse(`wardleyMap
      %% this is a comment
      component a "A" [0.5, 0.5]
      %% another comment
    `);

    const components = db.getComponents();
    expect(components).toHaveLength(1);
    expect(components[0].id).toBe('a');
  });
});

describe('Wardley Map Parsing — Edges', () => {
  beforeEach(() => db.clear());

  it('should parse dependency edges', async () => {
    await parser.parse(`wardleyMap
      component a "A" [0.5, 0.9]
      component b "B" [0.6, 0.7]
      a -> b
    `);

    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].type).toBe('dependency');
    expect(edges[0].source).toBe('a');
    expect(edges[0].target).toBe('b');
  });

  it('should parse flow edges', async () => {
    await parser.parse(`wardleyMap
      component a "A" [0.5, 0.9]
      component b "B" [0.6, 0.7]
      a +> b
    `);

    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].type).toBe('flow');
    expect(edges[0].source).toBe('a');
    expect(edges[0].target).toBe('b');
  });

  it('should parse constraint edges', async () => {
    await parser.parse(`wardleyMap
      component a "A" [0.5, 0.9]
      component b "B" [0.6, 0.7]
      a => b
    `);

    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].type).toBe('constraint');
    expect(edges[0].source).toBe('a');
    expect(edges[0].target).toBe('b');
  });

  it('should parse edge with annotation', async () => {
    await parser.parse(`wardleyMap
      component a "A" [0.5, 0.9]
      component b "B" [0.6, 0.7]
      a -> b ; "depends on"
    `);

    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].annotation).toBe('depends on');
  });
});

describe('Wardley Map Parsing — Evolution', () => {
  beforeEach(() => db.clear());

  it('should parse evolve statement', async () => {
    await parser.parse(`wardleyMap
      component api "API" [0.6, 0.7]
      evolve api 0.8
    `);

    const evolutions = db.getEvolutions();
    expect(evolutions).toHaveLength(1);
    expect(evolutions[0].sourceId).toBe('api');
    expect(evolutions[0].targetX).toBe(0.8);
  });

  it('should parse evolve with rename', async () => {
    await parser.parse(`wardleyMap
      component api "API" [0.6, 0.7]
      evolve api -> newApi 0.8
    `);

    const evolutions = db.getEvolutions();
    expect(evolutions).toHaveLength(1);
    expect(evolutions[0].sourceId).toBe('api');
    expect(evolutions[0].targetX).toBe(0.8);
    expect(evolutions[0].targetLabel).toBe('newApi');
  });
});

describe('Wardley Map Parsing — Pipelines', () => {
  beforeEach(() => db.clear());

  it('should parse pipeline with children', async () => {
    await parser.parse(`wardleyMap
      pipeline platform "Platform" [0.7, 0.3, 0.8] {
        svcA "Service A" [0.4]
        svcB "Service B" [0.7]
      }
    `);

    const pipelines = db.getPipelines();
    expect(pipelines).toHaveLength(1);
    expect(pipelines[0].id).toBe('platform');
    expect(pipelines[0].label).toBe('Platform');
    expect(pipelines[0].children).toHaveLength(2);
    expect(pipelines[0].children[0].id).toBe('svcA');
    expect(pipelines[0].children[0].label).toBe('Service A');
    expect(pipelines[0].children[1].id).toBe('svcB');
  });
});

describe('Wardley Map Parsing — Notes & Annotations', () => {
  beforeEach(() => db.clear());

  it('should parse notes', async () => {
    await parser.parse(`wardleyMap
      note "Important" [0.5, 0.5]
    `);

    const notes = db.getNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe('Important');
    expect(notes[0].x).toBe(0.5);
    expect(notes[0].y).toBe(0.5);
  });

  it('should parse annotations', async () => {
    await parser.parse(`wardleyMap
      component api "API" [0.6, 0.7]
      annotation 1 "Critical" api
    `);

    const annotations = db.getAnnotations();
    expect(annotations).toHaveLength(1);
    expect(annotations[0].number).toBe(1);
    expect(annotations[0].text).toBe('Critical');
    expect(annotations[0].targetId).toBe('api');
  });
});

describe('Wardley Map Parsing — Areas', () => {
  beforeEach(() => db.clear());

  it('should parse pioneers area', async () => {
    await parser.parse(`wardleyMap
      pioneers "Innovation" [0.0, 0.0, 0.25, 1.0]
    `);

    const areas = db.getAreas();
    expect(areas).toHaveLength(1);
    expect(areas[0].areaType).toBe('pioneers');
    expect(areas[0].label).toBe('Innovation');
    expect(areas[0].x1).toBe(0.0);
    expect(areas[0].y1).toBe(0.0);
    expect(areas[0].x2).toBe(0.25);
    expect(areas[0].y2).toBe(1.0);
  });

  it('should parse settlers area', async () => {
    await parser.parse(`wardleyMap
      settlers "Growth" [0.25, 0.0, 0.5, 1.0]
    `);

    const areas = db.getAreas();
    expect(areas).toHaveLength(1);
    expect(areas[0].areaType).toBe('settlers');
    expect(areas[0].label).toBe('Growth');
  });

  it('should parse interest area', async () => {
    await parser.parse(`wardleyMap
      interest "Focus" [0.3, 0.3, 0.7, 0.7]
    `);

    const areas = db.getAreas();
    expect(areas).toHaveLength(1);
    expect(areas[0].areaType).toBe('interest');
    expect(areas[0].label).toBe('Focus');
  });
});

describe('Wardley Map Parsing — Submaps & Accelerators', () => {
  beforeEach(() => db.clear());

  it('should parse submap', async () => {
    await parser.parse(`wardleyMap
      submap auth "Auth" [0.5, 0.5] ref "auth-map"
    `);

    const submaps = db.getSubmaps();
    expect(submaps).toHaveLength(1);
    expect(submaps[0].id).toBe('auth');
    expect(submaps[0].label).toBe('Auth');
    expect(submaps[0].x).toBe(0.5);
    expect(submaps[0].y).toBe(0.5);
    expect(submaps[0].ref).toBe('auth-map');
  });

  it('should parse accelerator', async () => {
    await parser.parse(`wardleyMap
      component api "API" [0.6, 0.7]
      accelerator api
    `);

    const accelerators = db.getAccelerators();
    expect(accelerators).toHaveLength(1);
    expect(accelerators[0].targetId).toBe('api');
    expect(accelerators[0].type).toBe('accelerator');
  });

  it('should parse deaccelerator', async () => {
    await parser.parse(`wardleyMap
      component legacy "Legacy" [0.3, 0.5]
      deaccelerator legacy
    `);

    const accelerators = db.getAccelerators();
    expect(accelerators).toHaveLength(1);
    expect(accelerators[0].targetId).toBe('legacy');
    expect(accelerators[0].type).toBe('deaccelerator');
  });
});

describe('Wardley Map Parsing — Custom Axis Labels', () => {
  beforeEach(() => db.clear());

  it('should parse custom x-axis labels', async () => {
    await parser.parse(`wardleyMap
      xAxis "Gen", "Custom", "Product", "Utility"
    `);

    const labels = db.getXAxisLabels();
    expect(labels).toEqual(['Gen', 'Custom', 'Product', 'Utility']);
  });

  it('should parse custom y-axis labels', async () => {
    await parser.parse(`wardleyMap
      yAxis "Invisible", "Visible"
    `);

    const labels = db.getYAxisLabels();
    expect(labels).toEqual(['Invisible', 'Visible']);
  });
});

describe('Wardley Map Parsing — Accessibility', () => {
  beforeEach(() => db.clear());

  it('should parse accTitle', async () => {
    await parser.parse(`wardleyMap
      accTitle: My Strategic Map
      component a "A" [0.5, 0.5]
    `);

    expect(db.getAccTitle()).toBe('My Strategic Map');
  });

  it('should parse accDescr', async () => {
    await parser.parse(`wardleyMap
      accDescr: A detailed description of the map
      component a "A" [0.5, 0.5]
    `);

    expect(db.getAccDescription()).toBe('A detailed description of the map');
  });
});

describe('Wardley Map Parsing — Re-parse after clear', () => {
  beforeEach(() => db.clear());

  it('should have fresh state after clear and re-parse', async () => {
    await parser.parse(`wardleyMap
      component a "A" [0.5, 0.9]
      component b "B" [0.6, 0.7]
      a -> b
    `);

    expect(db.getComponents()).toHaveLength(2);
    expect(db.getEdges()).toHaveLength(1);

    db.clear();

    expect(db.getComponents()).toHaveLength(0);
    expect(db.getEdges()).toHaveLength(0);

    await parser.parse(`wardleyMap
      component x "X" [0.1, 0.2]
    `);

    expect(db.getComponents()).toHaveLength(1);
    expect(db.getComponents()[0].id).toBe('x');
    expect(db.getEdges()).toHaveLength(0);
  });
});

describe('Wardley Map Parsing — Complex diagram', () => {
  beforeEach(() => db.clear());

  it('should parse a complex diagram with many features', async () => {
    await parser.parse(`wardleyMap
      accTitle: Platform Architecture
      accDescr: Full platform map with all feature types

      anchor customer "Customer" [0.95, 0.5]
      component web "Web App" [0.85, 0.6]
      component mobile "Mobile App" [0.82, 0.55]
      component api "API Gateway" [0.7, 0.65]
      component auth "Auth Service" [0.6, 0.7]
      component db "Database" [0.5, 0.8]
      component cache "Cache" [0.55, 0.75]
      component infra "Infrastructure" [0.3, 0.9]
      component monitor "Monitoring" [0.4, 0.85] market

      customer -> web
      customer -> mobile
      web -> api
      mobile -> api
      api -> auth
      api -> db
      api +> cache ; "data flow"
      auth => db

      evolve api 0.8
      evolve db -> cloudDb 0.9

      note "Key bottleneck" [0.55, 0.65]
      annotation 1 "Critical path" api

      pioneers "Innovation" [0.0, 0.0, 0.25, 1.0]

      accelerator api
      deaccelerator infra

      xAxis "Genesis", "Custom", "Product", "Commodity"
    `);

    const components = db.getComponents();
    expect(components.length).toBeGreaterThanOrEqual(9);

    const customer = db.getComponent('customer');
    expect(customer).toBeDefined();
    expect(customer!.type).toBe('anchor');

    const monitor = db.getComponent('monitor');
    expect(monitor).toBeDefined();
    expect(monitor!.type).toBe('market');

    const edges = db.getEdges();
    expect(edges.length).toBeGreaterThanOrEqual(8);

    const flowEdge = edges.find((e) => e.type === 'flow');
    expect(flowEdge).toBeDefined();
    expect(flowEdge!.annotation).toBe('data flow');

    const constraintEdge = edges.find((e) => e.type === 'constraint');
    expect(constraintEdge).toBeDefined();
    expect(constraintEdge!.source).toBe('auth');
    expect(constraintEdge!.target).toBe('db');

    const evolutions = db.getEvolutions();
    expect(evolutions).toHaveLength(2);
    expect(evolutions[1].targetLabel).toBe('cloudDb');

    const notes = db.getNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe('Key bottleneck');

    const annotations = db.getAnnotations();
    expect(annotations).toHaveLength(1);
    expect(annotations[0].targetId).toBe('api');

    const areas = db.getAreas();
    expect(areas).toHaveLength(1);
    expect(areas[0].areaType).toBe('pioneers');

    const accelerators = db.getAccelerators();
    expect(accelerators).toHaveLength(2);

    const xLabels = db.getXAxisLabels();
    expect(xLabels).toEqual(['Genesis', 'Custom', 'Product', 'Commodity']);

    expect(db.getAccTitle()).toBe('Platform Architecture');
    expect(db.getAccDescription()).toBe('Full platform map with all feature types');
  });
});
