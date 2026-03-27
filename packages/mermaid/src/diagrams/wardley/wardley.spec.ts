import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './wardleyDb.js';
import {
  getComponentColor,
  getStageBackgroundColors,
  getWardleyThemeVars,
} from './wardleyConfig.js';
import {
  rectanglesOverlap,
  calculateOverlapArea,
  getCandidatePositions,
  findBestLabelPosition,
  calculateTotalOverlap,
} from './wardleyLabelLayout.js';

describe('Wardley Map Database', () => {
  beforeEach(() => db.clear());

  it('should add and retrieve a standard component', () => {
    db.addComponent('comp1', 'Component 1', 0.5, 0.8);
    const c = db.getComponent('comp1');
    expect(c).toBeDefined();
    expect(c!.id).toBe('comp1');
    expect(c!.label).toBe('Component 1');
    expect(c!.x).toBe(0.5);
    expect(c!.y).toBe(0.8);
    expect(c!.type).toBe('standard');
    expect(c!.inertia).toBe(false);
  });

  it('should add and retrieve an anchor component', () => {
    db.addComponent('anchor1', 'Anchor', 0.3, 0.9, { type: 'anchor' });
    expect(db.getComponent('anchor1')!.type).toBe('anchor');
  });

  it('should add and retrieve a market component', () => {
    db.addComponent('mkt', 'Market', 0.6, 0.7, { type: 'market' });
    expect(db.getComponent('mkt')!.type).toBe('market');
  });

  it('should add and retrieve a component with inertia', () => {
    db.addComponent('db1', 'Database', 0.7, 0.4, { inertia: true });
    expect(db.getComponent('db1')!.inertia).toBe(true);
  });

  it('should add and retrieve a component with sourcing', () => {
    db.addComponent('svc', 'Service', 0.5, 0.6, { sourcing: 'build' });
    expect(db.getComponent('svc')!.sourcing).toBe('build');
  });

  it('should add and retrieve a component with label offset', () => {
    db.addComponent('lbl', 'Labeled', 0.4, 0.5, { labelOffset: { dx: 10, dy: -5 } });
    const c = db.getComponent('lbl');
    expect(c!.labelOffset).toEqual({ dx: 10, dy: -5 });
  });

  it('should clamp coordinates to [0,1]', () => {
    db.addComponent('c1', 'Over', 1.5, -0.2);
    const c = db.getComponent('c1');
    expect(c!.x).toBe(1);
    expect(c!.y).toBe(0);
  });

  it('should reject component with empty id', () => {
    db.addComponent('', 'Empty ID', 0.5, 0.5);
    expect(db.getComponents()).toHaveLength(0);
  });

  it('should reject duplicate component id', () => {
    db.addComponent('dup', 'First', 0.3, 0.3);
    db.addComponent('dup', 'Second', 0.6, 0.6);
    expect(db.getComponents()).toHaveLength(1);
    expect(db.getComponent('dup')!.label).toBe('First');
  });

  it('should add dependency edge', () => {
    db.addComponent('a', 'A', 0.3, 0.9);
    db.addComponent('b', 'B', 0.6, 0.7);
    db.addEdge('a', 'b');
    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].type).toBe('dependency');
  });

  it('should add flow edge', () => {
    db.addComponent('a', 'A', 0.3, 0.9);
    db.addComponent('b', 'B', 0.6, 0.7);
    db.addEdge('a', 'b', 'flow');
    expect(db.getEdges()[0].type).toBe('flow');
  });

  it('should add constraint edge', () => {
    db.addComponent('a', 'A', 0.3, 0.9);
    db.addComponent('b', 'B', 0.6, 0.7);
    db.addEdge('a', 'b', 'constraint');
    expect(db.getEdges()[0].type).toBe('constraint');
  });

  it('should add edge with annotation', () => {
    db.addComponent('a', 'A', 0.3, 0.9);
    db.addComponent('b', 'B', 0.6, 0.7);
    db.addEdge('a', 'b', 'dependency', 'uses API');
    expect(db.getEdges()[0].annotation).toBe('uses API');
  });

  it('should reject edge with missing component', () => {
    db.addComponent('a', 'A', 0.3, 0.9);
    db.addEdge('a', 'missing');
    expect(db.getEdges()).toHaveLength(0);
  });

  it('should reject self-loop edge', () => {
    db.addComponent('a', 'A', 0.5, 0.5);
    db.addEdge('a', 'a');
    expect(db.getEdges()).toHaveLength(0);
  });

  it('should reject duplicate edge', () => {
    db.addComponent('a', 'A', 0.3, 0.9);
    db.addComponent('b', 'B', 0.6, 0.7);
    db.addEdge('a', 'b', 'dependency');
    db.addEdge('a', 'b', 'dependency');
    expect(db.getEdges()).toHaveLength(1);
  });

  it('should add evolution', () => {
    db.addComponent('api', 'API', 0.5, 0.7);
    db.addEvolution('api', 0.8);
    const evolutions = db.getEvolutions();
    expect(evolutions).toHaveLength(1);
    expect(evolutions[0].sourceId).toBe('api');
    expect(evolutions[0].targetX).toBe(0.8);
  });

  it('should add evolution with rename', () => {
    db.addComponent('api', 'API', 0.5, 0.7);
    db.addEvolution('api', 0.8, 'API v2');
    expect(db.getEvolutions()[0].targetLabel).toBe('API v2');
  });

  it('should reject evolution for nonexistent component', () => {
    db.addEvolution('ghost', 0.8);
    expect(db.getEvolutions()).toHaveLength(0);
  });

  it('should clamp evolution targetX to [0,1]', () => {
    db.addComponent('api', 'API', 0.5, 0.7);
    db.addEvolution('api', 1.5);
    expect(db.getEvolutions()[0].targetX).toBe(1);
  });

  it('should add pipeline', () => {
    const children = [{ id: 'child1', label: 'Child 1', x: 0.3 }];
    db.addPipeline('pipe1', 'Pipeline', 0.5, 0.6, 0.2, 0.8, children);
    const pipelines = db.getPipelines();
    expect(pipelines).toHaveLength(1);
    expect(pipelines[0].id).toBe('pipe1');
    expect(pipelines[0].children).toHaveLength(1);
  });

  it('should add note', () => {
    db.addNote('Important note', 0.5, 0.5);
    const notes = db.getNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe('Important note');
  });

  it('should add annotation', () => {
    db.addAnnotation(1, 'See details', 'comp1');
    const annotations = db.getAnnotations();
    expect(annotations).toHaveLength(1);
    expect(annotations[0].number).toBe(1);
    expect(annotations[0].text).toBe('See details');
    expect(annotations[0].targetId).toBe('comp1');
  });

  it('should add area', () => {
    db.addArea('Pioneer Zone', 'pioneers', 0.0, 0.5, 0.25, 1.0);
    const areas = db.getAreas();
    expect(areas).toHaveLength(1);
    expect(areas[0].areaType).toBe('pioneers');
    expect(areas[0].label).toBe('Pioneer Zone');
  });

  it('should add submap', () => {
    db.addSubmap('sub1', 'Auth Submap', 0.6, 0.4, 'auth-map');
    const submaps = db.getSubmaps();
    expect(submaps).toHaveLength(1);
    expect(submaps[0].ref).toBe('auth-map');
  });

  it('should add accelerator', () => {
    db.addAccelerator('comp1', 'accelerator');
    const accelerators = db.getAccelerators();
    expect(accelerators).toHaveLength(1);
    expect(accelerators[0].targetId).toBe('comp1');
    expect(accelerators[0].type).toBe('accelerator');
  });

  it('should set custom axis labels', () => {
    db.setXAxisLabels(['Genesis', 'Custom', 'Product', 'Commodity']);
    db.setYAxisLabels(['Invisible', 'Visible']);
    expect(db.getXAxisLabels()).toEqual(['Genesis', 'Custom', 'Product', 'Commodity']);
    expect(db.getYAxisLabels()).toEqual(['Invisible', 'Visible']);
  });

  it('should warn when annotation references unknown component', () => {
    db.addAnnotation(1, 'test', 'nonexistent');
    const annotations = db.getAnnotations();
    expect(annotations).toHaveLength(1);
    expect(annotations[0].targetId).toBe('nonexistent');
  });

  it('should warn when accelerator references unknown component', () => {
    db.addAccelerator('nonexistent', 'accelerator');
    const accelerators = db.getAccelerators();
    expect(accelerators).toHaveLength(1);
    expect(accelerators[0].targetId).toBe('nonexistent');
  });

  it('should reject annotation with non-positive number', () => {
    db.addComponent('a', 'A', 0.5, 0.5);
    db.addAnnotation(0, 'test', 'a');
    db.addAnnotation(-1, 'test', 'a');
    expect(db.getAnnotations()).toHaveLength(0);
  });

  it('should reject pipeline with empty label', () => {
    db.addPipeline('p1', '', 0.5, 0.5, 0.2, 0.8, []);
    expect(db.getPipelines()).toHaveLength(0);
  });

  it('should reject submap with empty label or ref', () => {
    db.addSubmap('s1', '', 0.5, 0.5, 'ref');
    db.addSubmap('s2', 'Sub', 0.5, 0.5, '');
    expect(db.getSubmaps()).toHaveLength(0);
  });

  it('should normalize inverted pipeline coordinates', () => {
    db.addPipeline('p1', 'Pipeline', 0.5, 0.5, 0.8, 0.2, []);
    const pipes = db.getPipelines();
    expect(pipes).toHaveLength(1);
    expect(pipes[0].startX).toBeLessThanOrEqual(pipes[0].endX);
  });

  it('should normalize inverted area coordinates', () => {
    db.addArea('zone', 'pioneers', 0.8, 0.9, 0.2, 0.1);
    const areas = db.getAreas();
    expect(areas).toHaveLength(1);
    expect(areas[0].x1).toBeLessThanOrEqual(areas[0].x2);
    expect(areas[0].y1).toBeLessThanOrEqual(areas[0].y2);
  });

  it('should reject area with NaN coordinates', () => {
    db.addArea('zone', 'pioneers', NaN, 0, 1, 1);
    expect(db.getAreas()).toHaveLength(0);
  });

  it('should clear all data', () => {
    db.addComponent('a', 'A', 0.5, 0.5);
    db.addComponent('b', 'B', 0.6, 0.6);
    db.addEdge('a', 'b');
    db.addEvolution('a', 0.8);
    db.addNote('note', 0.1, 0.1);
    db.addAnnotation(1, 'ann', 'a');
    db.addArea('zone', 'pioneers', 0, 0, 1, 1);
    db.addSubmap('s1', 'Sub', 0.5, 0.5, 'ref');
    db.addAccelerator('a', 'accelerator');
    db.setXAxisLabels(['A', 'B']);

    db.clear();

    expect(db.getComponents()).toHaveLength(0);
    expect(db.getEdges()).toHaveLength(0);
    expect(db.getEvolutions()).toHaveLength(0);
    expect(db.getNotes()).toHaveLength(0);
    expect(db.getAnnotations()).toHaveLength(0);
    expect(db.getAreas()).toHaveLength(0);
    expect(db.getSubmaps()).toHaveLength(0);
    expect(db.getAccelerators()).toHaveLength(0);
    expect(db.getXAxisLabels()).toHaveLength(0);
  });
});

describe('Wardley Map Config', () => {
  it('should return component color by evolution position', () => {
    const genesis = getComponentColor(0.1);
    const custom = getComponentColor(0.3);
    const product = getComponentColor(0.6);
    const commodity = getComponentColor(0.9);

    expect(genesis).not.toBe(custom);
    expect(custom).not.toBe(product);
    expect(product).not.toBe(commodity);
  });

  it('should return four stage background colors', () => {
    const colors = getStageBackgroundColors();
    expect(colors).toHaveLength(4);
    colors.forEach((c) => expect(typeof c).toBe('string'));
  });

  it('should return theme vars', () => {
    const vars = getWardleyThemeVars();
    const requiredKeys = [
      'genesisColor',
      'customColor',
      'productColor',
      'commodityColor',
      'stageBackground0',
      'stageBackground1',
      'stageBackground2',
      'stageBackground3',
      'axisColor',
      'textColor',
      'labelBackground',
      'labelBorder',
      'edgeColor',
      'arrowColor',
      'componentStroke',
      'backgroundColor',
      'pipelineFill',
      'inertiaColor',
      'evolveArrowColor',
      'flowColor',
      'constraintColor',
    ];
    for (const key of requiredKeys) {
      expect(vars).toHaveProperty(key);
    }
  });
});

describe('Label Layout', () => {
  it('should detect overlapping rectangles', () => {
    const rect1 = { x: 100, y: 100, width: 50, height: 50 };
    const rect2 = { x: 120, y: 120, width: 50, height: 50 };
    expect(rectanglesOverlap(rect1, rect2)).toBe(true);
  });

  it('should detect non-overlapping rectangles', () => {
    const rect1 = { x: 100, y: 100, width: 50, height: 50 };
    const rect2 = { x: 500, y: 500, width: 50, height: 50 };
    expect(rectanglesOverlap(rect1, rect2)).toBe(false);
  });

  it('should calculate overlap area', () => {
    const rect1 = { x: 100, y: 100, width: 100, height: 100 };
    const rect2 = { x: 150, y: 150, width: 100, height: 100 };
    expect(calculateOverlapArea(rect1, rect2)).toBeGreaterThan(0);

    const rect3 = { x: 500, y: 500, width: 100, height: 100 };
    expect(calculateOverlapArea(rect1, rect3)).toBe(0);
  });

  it('should return four candidate positions', () => {
    const candidates = getCandidatePositions(100, 100, 8, 60, 20);
    expect(candidates).toHaveLength(4);
    expect(candidates[0].y).toBeLessThan(100); // above
    expect(candidates[1].y).toBeGreaterThan(100); // below
    expect(candidates[2].x).toBeLessThan(100); // left
    expect(candidates[3].x).toBeGreaterThan(100); // right
  });

  it('should find best label position with no existing labels', () => {
    const pos = findBestLabelPosition(100, 100, 8, 60, 20, []);
    expect(pos).toBeDefined();
    expect(pos.width).toBe(60);
    expect(pos.height).toBe(20);
  });

  it('should find position that avoids existing labels', () => {
    const above = { x: 100, y: 82, width: 60, height: 20 };
    const pos = findBestLabelPosition(100, 100, 8, 60, 20, [above]);
    // Should prefer a position other than above since that's occupied
    const overlapWithAbove = calculateOverlapArea(pos, above);
    const aboveCandidate = getCandidatePositions(100, 100, 8, 60, 20)[0];
    const naiveOverlap = calculateOverlapArea(aboveCandidate, above);
    expect(overlapWithAbove).toBeLessThanOrEqual(naiveOverlap);
  });

  it('should calculate total overlap correctly', () => {
    const candidate = { x: 100, y: 100, width: 50, height: 50 };
    const existing = [
      { x: 120, y: 120, width: 50, height: 50 },
      { x: 500, y: 500, width: 50, height: 50 },
    ];
    const total = calculateTotalOverlap(candidate, existing);
    const first = calculateOverlapArea(candidate, existing[0]);
    expect(total).toBe(first); // second rect doesn't overlap
    expect(total).toBeGreaterThan(0);
  });
});
