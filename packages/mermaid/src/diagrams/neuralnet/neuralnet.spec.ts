import { setConfig } from '../../diagram-api/diagramAPI.js';
import { db } from './neuralnetDb.js';
import { parser } from './neuralnetParser.js';

setConfig({ securityLevel: 'strict' });

describe('neuralnet', () => {
  beforeEach(() => db.clear());

  // ── 4 targeted cases ────────────────────────────────────────────────────

  describe('targeted parse cases', () => {
    it('case 1: neuralnet sequential → mode is sequential', async () => {
      await parser.parse(`neuralnet sequential
        Input[1]
      `);
      expect(db.getMode()).toBe('sequential');
    });

    it('case 2: conv1: Conv2D[32, 3x3] → id=conv1, type=Conv2D, params=[32,3x3]', async () => {
      await parser.parse(`neuralnet
        conv1: Conv2D[32, 3x3]
      `);
      const nodes = db.getNodes();
      expect(nodes.has('conv1')).toBe(true);
      const n = nodes.get('conv1')!;
      expect(n.layerType).toBe('Conv2D');
      expect(n.params).toEqual(['32', '3x3']);
    });

    it('case 3: conv1 --> pool1 → edge registered', async () => {
      await parser.parse(`neuralnet
        conv1: Conv2D[32, 3x3]
        pool1: MaxPool2D[2x2]
        conv1 --> pool1
      `);
      const edges = db.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0]).toEqual({ from: 'conv1', to: 'pool1' });
    });

    it('case 4: Flatten and Add with no params → empty params array', async () => {
      await parser.parse(`neuralnet sequential
        Flatten
        Add
      `);
      const nodes = db.getNodes();
      const order = db.getNodeOrder();
      expect(nodes.get(order[0])!.layerType).toBe('Flatten');
      expect(nodes.get(order[0])!.params).toEqual([]);
      expect(nodes.get(order[1])!.layerType).toBe('Add');
      expect(nodes.get(order[1])!.params).toEqual([]);
    });
  });

  // ── Sequential mode ─────────────────────────────────────────────────────

  describe('sequential mode', () => {
    it('parses the "sequential" keyword and sets mode', async () => {
      await parser.parse(`neuralnet sequential
        Input[28, 28, 1]
        Dense[128, relu]
      `);
      expect(db.getMode()).toBe('sequential');
    });

    it('auto-wires edges between consecutive layers', async () => {
      await parser.parse(`neuralnet sequential
        Input[28, 28, 1]
        Dense[64, relu]
        Dense[10, softmax]
      `);
      const edges = db.getEdges();
      expect(edges).toHaveLength(2);
      const nodeOrder = db.getNodeOrder();
      expect(edges[0].from).toBe(nodeOrder[0]);
      expect(edges[0].to).toBe(nodeOrder[1]);
      expect(edges[1].from).toBe(nodeOrder[1]);
      expect(edges[1].to).toBe(nodeOrder[2]);
    });

    it('stores layer types and params', async () => {
      await parser.parse(`neuralnet sequential
        Input[28, 28, 1]
        Conv2D[32, 3x3, relu]
        MaxPool2D[2x2]
        Flatten
        Dense[10, softmax]
      `);
      const nodes = db.getNodes();
      const order = db.getNodeOrder();

      const conv = nodes.get(order[1])!;
      expect(conv.layerType).toBe('Conv2D');
      expect(conv.params).toEqual(['32', '3x3', 'relu']);

      const pool = nodes.get(order[2])!;
      expect(pool.layerType).toBe('MaxPool2D');

      const flatten = nodes.get(order[3])!;
      expect(flatten.layerType).toBe('Flatten');
    });
  });

  // ── Graph mode ──────────────────────────────────────────────────────────

  describe('graph mode', () => {
    it('defaults to graph mode when "sequential" is absent', async () => {
      await parser.parse(`neuralnet
        input: Input[28, 28, 1]
        out: Dense[10, softmax]
        input --> out
      `);
      expect(db.getMode()).toBe('graph');
    });

    it('registers named nodes with correct ids', async () => {
      await parser.parse(`neuralnet
        inp: Input[4]
        hidden: Dense[16, relu]
        inp --> hidden
      `);
      const nodes = db.getNodes();
      expect(nodes.has('inp')).toBe(true);
      expect(nodes.has('hidden')).toBe(true);
      expect(nodes.get('inp')!.layerType).toBe('Input');
    });

    it('stores explicit edges', async () => {
      await parser.parse(`neuralnet
        a: Input[10]
        b: Dense[32]
        c: Dense[10]
        a --> b
        b --> c
      `);
      const edges = db.getEdges();
      expect(edges).toHaveLength(2);
      expect(edges[0]).toEqual({ from: 'a', to: 'b' });
      expect(edges[1]).toEqual({ from: 'b', to: 'c' });
    });

    it('supports skip connections (multiple edges from one node)', async () => {
      await parser.parse(`neuralnet
        x: Input[64]
        h: Dense[32, relu]
        add: Add
        x --> h
        h --> add
        x --> add
      `);
      const edges = db.getEdges();
      expect(edges).toHaveLength(3);
    });
  });

  // ── Title & accessibility ────────────────────────────────────────────────

  describe('title', () => {
    it('parses diagram title', async () => {
      await parser.parse(`neuralnet sequential
        title My CNN
        Input[28]
      `);
      expect(db.getDiagramTitle()).toBe('My CNN');
    });
  });

  // ── DB state isolation ───────────────────────────────────────────────────

  describe('db.clear()', () => {
    it('resets all state between tests', async () => {
      await parser.parse(`neuralnet sequential
        Input[10]
        Dense[5]
      `);
      db.clear();
      expect(db.getNodes().size).toBe(0);
      expect(db.getEdges()).toHaveLength(0);
      expect(db.getNodeOrder()).toHaveLength(0);
      expect(db.getMode()).toBe('graph');
    });
  });
});
