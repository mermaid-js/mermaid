import { describe, expect, it } from 'vitest';
import { QuantumCircuitDB } from './db.js';
import { parser } from './parser.js';
import { draw } from './renderer.js';
import { Diagram } from '../../Diagram.js';
import { addDetector } from '../../diagram-api/detectType.js';
import { quantumCircuit } from './detector.js';
import { ensureNodeFromSelector, jsdomIt } from '../../tests/util.js';

const { id, detector, loader } = quantumCircuit;
addDetector(id, detector, loader);

describe('quantum circuit', () => {
  let db: QuantumCircuitDB;
  beforeEach(() => {
    db = new QuantumCircuitDB();
    if (parser.parser) {
      parser.parser.yy = db;
    }
  });

  it('parses an empty circuit', async () => {
    await expect(parser.parse('quantumCircuit')).resolves.not.toThrow();
    expect(db.getWires()).toHaveLength(0);
    expect(db.getLayers()).toHaveLength(0);
    expect(db.getDirection()).toBe('LR');
  });

  it('parses a minimal circuit with auto-created wires using integer indices', async () => {
    const str = `quantumCircuit
    H[0]
    H[1]
    CNOT[0, 1]
    M[0]
    M[1]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getWires()).toHaveLength(2);
    // H[0] and H[1] act on different wires so ASAP places them in the same layer
    expect(db.getLayers()).toHaveLength(3);
    expect(db.getLayers()[0]).toHaveLength(2); // H on q0 and H on q1
    expect(db.getLayers()[0][0]).toMatchObject({ name: 'H' });
    expect(db.getLayers()[1]).toHaveLength(1); // CNOT[q0, q1]
    expect(db.getLayers()[1][0]).toMatchObject({ name: 'CNOT' });
    expect(db.getLayers()[2]).toHaveLength(2); // M on q0 and M on q1
  });

  it('integer wire indices resolve to their positional wire name', async () => {
    const str = `quantumCircuit
    wires alice(psi), bob(0)
    H[0]
    CNOT[0, 1]
    M[1]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const wires = db.getWires();
    expect(wires).toHaveLength(2);
    expect(wires[0].name).toBe('alice');
    expect(wires[1].name).toBe('bob');
    // H[0] → alice, CNOT[0,1] → alice,bob → layer after H
    expect(db.getLayers()).toHaveLength(3);
    expect(db.getLayers()[0][0]).toMatchObject({ name: 'H', wireRefs: [{ wire: 'alice' }] });
    expect(db.getLayers()[1][0]).toMatchObject({
      name: 'CNOT',
      wireRefs: [{ wire: 'alice' }, { wire: 'bob' }],
    });
  });

  it('uses explicit wire declarations', async () => {
    const str = `quantumCircuit-beta LR
    wires a(0), b(1), anc(+)
    H[a]
    CNOT[a, b]
    M[a]
    M[b]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getWires()).toHaveLength(3);
    expect(db.getWires()[0]).toMatchObject({ name: 'a', initialState: '0' });
    expect(db.getWires()[1]).toMatchObject({ name: 'b', initialState: '1' });
    expect(db.getWires()[2]).toMatchObject({ name: 'anc', initialState: '+' });
  });

  it('rejects duplicate wire names', async () => {
    const str = `quantumCircuit
    wires q0(0), q0(1)`;
    await expect(parser.parse(str)).rejects.toThrow('Duplicate wire name');
  });

  it('propagates title and accessibility', async () => {
    const str = `quantumCircuit
    title My Circuit
    accTitle: Accessible Title
    accDescr: A description of the circuit
    H[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getDiagramTitle()).toBe('My Circuit');
    expect(db.getAccTitle()).toBe('Accessible Title');
    expect(db.getAccDescription()).toBe('A description of the circuit');
  });

  it('supports TD direction', async () => {
    const str = `quantumCircuit-beta TD
    H[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getDirection()).toBe('TD');
  });

  it('defaults to LR direction', async () => {
    const str = `quantumCircuit
    H[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getDirection()).toBe('LR');
  });

  it('parallel single-qubit gates share a layer', async () => {
    const str = `quantumCircuit
    wires a(0), b(0), c(0)
    H[a]
    H[b]
    H[c]
    M[a]
    M[b]
    M[c]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getLayers()).toHaveLength(2);
    expect(db.getLayers()[0]).toHaveLength(3);
    expect(db.getLayers()[1]).toHaveLength(3);
  });

  it('sequential gates on the same wire get separate layers', async () => {
    const str = `quantumCircuit
    wires q0(0)
    H[q0]
    X[q0]
    Z[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getLayers()).toHaveLength(4);
  });

  it('handles CNOT scheduling', async () => {
    const str = `quantumCircuit
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getLayers()).toHaveLength(3);
    expect(db.getLayers()[0][0]).toMatchObject({ name: 'H' });
    expect(db.getLayers()[1][0]).toMatchObject({ name: 'CNOT' });
  });

  it('handles Toffoli (CCX) spanning 3 wires', async () => {
    const str = `quantumCircuit
    wires a(0), b(0), c(0)
    H[a]
    H[b]
    CCX[a, b, c]
    M[a]
    M[b]
    M[c]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getLayers()).toHaveLength(3);
    expect(db.getLayers()[0]).toHaveLength(2);
    expect(db.getLayers()[1]).toHaveLength(1);
    expect(db.getLayers()[1][0]).toMatchObject({ name: 'CCX' });
    expect(db.getLayers()[2]).toHaveLength(3);
  });

  it('handles zero-control gates', async () => {
    const str = `quantumCircuit
    wires a(0), b(0), c(0)
    H[a]
    H[b]
    CCX[!a, b, c]
    M[a]
    M[b]
    M[c]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('handles CNOT with zero-control', async () => {
    const str = `quantumCircuit
    wires a(0), b(0)
    CNOT[!a, b]
    M[a]
    M[b]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('rejects zero-control on target wire', async () => {
    const str = `quantumCircuit
    wires a(0), b(0)
    CNOT[a, !b]`;
    await expect(parser.parse(str)).rejects.toThrow('Zero-control');
  });

  it('rejects zero-control on single-qubit gate', async () => {
    const str = `quantumCircuit
    H[!q0]`;
    await expect(parser.parse(str)).rejects.toThrow('Zero-control');
  });

  it('rejects zero-control on SWAP', async () => {
    const str = `quantumCircuit
    wires a(0), b(0)
    SWAP[!a, b]`;
    await expect(parser.parse(str)).rejects.toThrow('Zero-control');
  });

  it('handles barriers', async () => {
    const str = `quantumCircuit
    wires q0(0), q1(0)
    H[q0]
    H[q1]
    barrier
    CNOT[q0, q1]
    barrier
    M[q0]
    M[q1]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getLayers()).toHaveLength(5);
    expect(db.getLayers()[0]).toHaveLength(2);
    expect(db.getLayers()[1][0]).toMatchObject({ type: 'barrier' });
    expect(db.getLayers()[2]).toHaveLength(1);
    expect(db.getLayers()[3][0]).toMatchObject({ type: 'barrier' });
    expect(db.getLayers()[4]).toHaveLength(2);
  });

  it('handles SWAP gate', async () => {
    const str = `quantumCircuit
    wires a(0), b(0)
    H[a]
    H[b]
    SWAP[a, b]
    M[a]
    M[b]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getLayers()).toHaveLength(3);
  });

  it('handles parameterised gates', async () => {
    const str = `quantumCircuit
    wires q0(0)
    Rx(pi/2)[q0]
    Ry(theta)[q0]
    Rz(phi)[q0]
    U(theta, phi, lambda)[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const layers = db.getLayers();
    expect(layers[0][0]).toMatchObject({ name: 'Rx', params: 'pi/2' });
    expect(layers[1][0]).toMatchObject({ name: 'Ry', params: 'theta' });
    expect(layers[2][0]).toMatchObject({ name: 'Rz', params: 'phi' });
    expect(layers[3][0]).toMatchObject({ name: 'U', params: 'theta, phi, lambda' });
  });

  it('handles all built-in single-qubit gates including Sdg and Tdg', async () => {
    const str = `quantumCircuit
    wires q0(0)
    H[q0]
    X[q0]
    Y[q0]
    Z[q0]
    S[q0]
    T[q0]
    Sdg[q0]
    Tdg[q0]
    I[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getLayers()).toHaveLength(10);
  });

  it('handles measurement basis variants', async () => {
    const str = `quantumCircuit
    wires q0(0), q1(0)
    MZ[q0]
    MX[q1]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('handles custom gate names', async () => {
    const str = `quantumCircuit
    wires q0(0)
    MyGate[q0]
    U3(0.5,0,0)[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('auto-creates undeclared wires from gate references', async () => {
    const str = `quantumCircuit
    H[alice]
    CNOT[alice, bob]
    M[alice]
    M[bob]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getWires()).toHaveLength(2);
    expect(db.getWires()[0]).toMatchObject({ name: 'alice', initialState: '0' });
    expect(db.getWires()[1]).toMatchObject({ name: 'bob', initialState: '0' });
  });

  it('CX and CNOT are interchangeable', async () => {
    const str1 = `quantumCircuit\n    wires a(0), b(0)\n    CNOT[a, b]`;
    const str2 = `quantumCircuit\n    wires a(0), b(0)\n    CX[a, b]`;
    await expect(parser.parse(str1)).resolves.not.toThrow();
    await expect(parser.parse(str2)).resolves.not.toThrow();
  });

  // ── Classical wires ───────────────────────────────────────────────────

  it('parses cbits declaration', async () => {
    const str = `quantumCircuit
    wires q0(0), q1(0)
    cbits c0, c1
    H[q0]
    M[q0]`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getCbits()).toHaveLength(2);
    expect(db.getCbits()[0]).toMatchObject({ name: 'c0' });
    expect(db.getCbits()[1]).toMatchObject({ name: 'c1' });
  });

  it('rejects duplicate classical bit names', async () => {
    const str = `quantumCircuit
    cbits c0, c0`;
    await expect(parser.parse(str)).rejects.toThrow('Duplicate classical bit name');
  });

  it('parses measurement capture (-> cbit)', async () => {
    const str = `quantumCircuit
    wires q0(0)
    cbits c0
    H[q0]
    M[q0] -> c0`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const layers = db.getLayers();
    const measureLayer = layers[layers.length - 1];
    expect(measureLayer[0]).toMatchObject({ name: 'M', captureTarget: 'c0' });
  });

  it('parses classically-conditioned gate (if cbit)', async () => {
    const str = `quantumCircuit
    wires q0(0), q1(0)
    cbits c0
    H[q0]
    M[q0] -> c0
    X[q1] if c0`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    const layers = db.getLayers();
    const xLayer = layers[layers.length - 1];
    expect(xLayer[0]).toMatchObject({ name: 'X', conditionCbit: 'c0' });
  });

  it('rejects capture to undeclared classical bit', async () => {
    const str = `quantumCircuit
    wires q0(0)
    M[q0] -> c_missing`;
    await expect(parser.parse(str)).rejects.toThrow('not a declared classical bit');
  });

  it('rejects condition on undeclared classical bit', async () => {
    const str = `quantumCircuit
    wires q0(0), q1(0)
    X[q1] if c_missing`;
    await expect(parser.parse(str)).rejects.toThrow('not a declared classical bit');
  });

  it('parses full teleportation circuit with classical feed-forward', async () => {
    const str = `quantumCircuit LR
    wires msg(psi), alice(0), bob(0)
    cbits c_msg, c_alice
    H[alice]
    CNOT[alice, bob]
    CNOT[msg, alice]
    H[msg]
    M[msg]   -> c_msg
    M[alice] -> c_alice
    X[bob] if c_alice
    Z[bob] if c_msg`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getWires()).toHaveLength(3);
    expect(db.getCbits()).toHaveLength(2);
  });
});

describe('quantum circuit renderer', { timeout: 15_000 }, () => {
  async function drawDiagram(text: string): Promise<Element> {
    const diagram = await Diagram.fromText(text, {});
    await draw('NOT_USED', 'svg', '1.0.0', diagram);
    return ensureNodeFromSelector('#svg');
  }

  jsdomIt('draws wires and labels for a minimal circuit', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0), q1(0)
    H[q0]
    H[q1]
    M[q0]
    M[q1]`);

    // Wires
    const wires = svgNode.querySelectorAll('.qc-wire');
    expect(wires.length).toBe(2);

    // Labels
    const labels = svgNode.querySelectorAll('.qc-wire-label');
    expect(labels.length).toBe(2);
    expect(labels[0].textContent).toContain('q0');
    expect(labels[1].textContent).toContain('q1');
  });

  jsdomIt('draws gate boxes', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0)
    H[q0]
    X[q0]
    M[q0]`);

    const gateBoxes = svgNode.querySelectorAll('.qc-gate-box');
    expect(gateBoxes.length).toBe(3);
  });

  jsdomIt('draws gate labels correctly including Sdg and Tdg', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0)
    H[q0]
    X[q0]
    Sdg[q0]
    M[q0]`);

    const labels = svgNode.querySelectorAll('.qc-gate-label');
    const texts = [...labels].map((el) => el.textContent);
    expect(texts).toContain('H');
    expect(texts).toContain('X');
    expect(texts).toContain('Sdg');
  });

  jsdomIt('draws parameterised gate labels', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0)
    Rx(pi/2)[q0]
    M[q0]`);

    const labels = svgNode.querySelectorAll('.qc-gate-label');
    const texts = [...labels].map((el) => el.textContent);
    expect(texts).toContain('Rx(pi/2)');
  });

  jsdomIt('draws barriers as dashed lines', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0), q1(0)
    H[q0]
    barrier
    M[q0]`);

    const barriers = svgNode.querySelectorAll('.qc-barrier');
    expect(barriers.length).toBe(1);
  });

  jsdomIt('supports TD direction', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta TD
    wires q0(0)
    H[q0]
    M[q0]`);

    // In TD mode, wires should be vertical lines
    const wires = svgNode.querySelectorAll('.qc-wire');
    expect(wires.length).toBe(1);
    // Should still draw gates
    const gateBoxes = svgNode.querySelectorAll('.qc-gate-box');
    expect(gateBoxes.length).toBe(2);
  });

  jsdomIt('handles empty circuit gracefully', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta
    wires q0(0), q1(0)`);

    const wires = svgNode.querySelectorAll('.qc-wire');
    expect(wires.length).toBe(2);
  });

  jsdomIt('supports YAML frontmatter with title', async () => {
    const svgNode = await drawDiagram(`---
title: My Circuit
---
quantumCircuit-beta LR
    wires q0(0)
    H[q0]
    M[q0]`);

    const wires = svgNode.querySelectorAll('.qc-wire');
    expect(wires.length).toBe(1);
  });

  jsdomIt('draws CNOT with control dot, target, and connector', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0), q1(0)
    CNOT[q0, q1]
    M[q0]
    M[q1]`);

    const controls = svgNode.querySelectorAll('.qc-control');
    expect(controls.length).toBe(1);

    const targets = svgNode.querySelectorAll('.qc-target');
    expect(targets.length).toBe(1);

    const crosses = svgNode.querySelectorAll('.qc-target-cross');
    expect(crosses.length).toBe(2);

    const connectors = svgNode.querySelectorAll('.qc-connector');
    expect(connectors.length).toBe(1);
  });

  jsdomIt('draws zero-control as open circle', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0), q1(0)
    CNOT[!q0, q1]
    M[q0]
    M[q1]`);

    const zeroControls = svgNode.querySelectorAll('.qc-control-zero');
    expect(zeroControls.length).toBe(1);

    const controls = svgNode.querySelectorAll('.qc-control');
    expect(controls.length).toBe(0);
  });

  jsdomIt('draws Toffoli with two controls and one target', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires a(0), b(0), c(0)
    CCX[a, b, c]
    M[a]`);

    const controls = svgNode.querySelectorAll('.qc-control');
    expect(controls.length).toBe(2);

    const targets = svgNode.querySelectorAll('.qc-target');
    expect(targets.length).toBe(1);

    const connectors = svgNode.querySelectorAll('.qc-connector');
    expect(connectors.length).toBe(1);
  });

  jsdomIt('draws SWAP with crossing lines', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires a(0), b(0)
    SWAP[a, b]
    M[a]`);

    const swaps = svgNode.querySelectorAll('.qc-swap');
    expect(swaps.length).toBe(4); // 2 crossing lines per wire
  });

  jsdomIt('draws CZ with control dot and Z gate box', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0), q1(0)
    CZ[q0, q1]
    M[q0]`);

    const controls = svgNode.querySelectorAll('.qc-control');
    expect(controls.length).toBe(1);

    const gateBoxes = svgNode.querySelectorAll('.qc-gate-box');
    expect(gateBoxes.length).toBe(1);

    const gateLabels = svgNode.querySelectorAll('.qc-gate-label');
    const texts = [...gateLabels].map((el) => el.textContent);
    expect(texts).toContain('Z');
  });

  jsdomIt('draws CSWAP with one control and two swap markers', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires a(0), b(0), c(0)
    CSWAP[a, b, c]
    M[a]`);

    const controls = svgNode.querySelectorAll('.qc-control');
    expect(controls.length).toBe(1);

    const swaps = svgNode.querySelectorAll('.qc-swap');
    expect(swaps.length).toBe(4); // 2 crosses each on b and c
  });

  jsdomIt('draws mixed-polarity Toffoli', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires a(0), b(0), c(0)
    CCX[!a, b, c]
    M[a]`);

    const zeroControls = svgNode.querySelectorAll('.qc-control-zero');
    expect(zeroControls.length).toBe(1);

    const controls = svgNode.querySelectorAll('.qc-control');
    expect(controls.length).toBe(1);

    const targets = svgNode.querySelectorAll('.qc-target');
    expect(targets.length).toBe(1);
  });

  jsdomIt('draws multiple CNOTs in the same circuit', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0), q1(0), q2(0)
    CNOT[q0, q1]
    CNOT[q1, q2]
    M[q0]
    M[q1]
    M[q2]`);

    const controls = svgNode.querySelectorAll('.qc-control');
    expect(controls.length).toBe(2);

    const targets = svgNode.querySelectorAll('.qc-target');
    expect(targets.length).toBe(2);

    const connectors = svgNode.querySelectorAll('.qc-connector');
    expect(connectors.length).toBe(2);
  });

  jsdomIt('draws classical wires as double lines', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0)
    cbits c0
    H[q0]
    M[q0] -> c0`);

    const classicalWires = svgNode.querySelectorAll('.qc-classical-wire');
    // Two lines per classical wire (double-line style)
    expect(classicalWires.length).toBe(2);
  });

  jsdomIt('draws measurement capture arrow to classical wire', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0)
    cbits c0
    M[q0] -> c0`);

    const arrows = svgNode.querySelectorAll('.qc-capture-arrow');
    expect(arrows.length).toBeGreaterThan(0);
  });

  jsdomIt('draws condition indicator on classically-conditioned gate', async () => {
    const svgNode = await drawDiagram(`quantumCircuit-beta LR
    wires q0(0), q1(0)
    cbits c0
    M[q0] -> c0
    X[q1] if c0`);

    const conditionDots = svgNode.querySelectorAll('.qc-condition-dot');
    expect(conditionDots.length).toBe(1);
  });
});
