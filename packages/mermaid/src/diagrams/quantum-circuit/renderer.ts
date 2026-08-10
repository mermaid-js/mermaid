import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { QuantumCircuitDB } from './db.js';
import type { Barrier, ScheduledGate } from './types.js';

const isBarrier = (item: ScheduledGate | Barrier): item is Barrier =>
  'type' in item && item.type === 'barrier';

const COLUMN_WIDTH = 60;
const WIRE_SPACING = 48;
const WIRE_LABEL_WIDTH = 70;
const WIRE_LABEL_GAP = 10;
const GATE_WIDTH = 40;
const GATE_HEIGHT = 32;
const PADDING = 20;
const CONTROL_RADIUS = 5;
const TARGET_RADIUS = 10;
// Classical wires sit below (LR) or right of (TD) the quantum wires.
const CLASSICAL_WIRE_OFFSET = 24;
const CAPTURE_ARROW_GAP = 6; // gap between gate bottom and capture arrow top

// ── single‑qubit helpers ──────────────────────────────────────────────

const drawGate = (group: SVG, x: number, y: number, gate: ScheduledGate) => {
  const gx = x - GATE_WIDTH / 2;
  const gy = y - GATE_HEIGHT / 2;

  group
    .append('rect')
    .attr('x', gx)
    .attr('y', gy)
    .attr('width', GATE_WIDTH)
    .attr('height', GATE_HEIGHT)
    .attr('rx', 4)
    .attr('class', 'qc-gate-box');

  let label = gate.name;
  if (gate.params) {
    label = `${gate.name}(${gate.params})`;
  }

  group
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('class', 'qc-gate-label')
    .text(label);
};

const drawMeasurement = (group: SVG, x: number, y: number, gate: ScheduledGate) => {
  const gx = x - GATE_WIDTH / 2;
  const gy = y - GATE_HEIGHT / 2;

  group
    .append('rect')
    .attr('x', gx)
    .attr('y', gy)
    .attr('width', GATE_WIDTH)
    .attr('height', GATE_HEIGHT)
    .attr('rx', 4)
    .attr('class', 'qc-gate-box');

  const arcRadius = 8;
  group
    .append('path')
    .attr(
      'd',
      `M ${x - arcRadius} ${y + arcRadius * 0.3} A ${arcRadius} ${arcRadius} 0 0 1 ${x + arcRadius} ${y + arcRadius * 0.3}`
    )
    .attr('class', 'qc-gate-label')
    .attr('fill', 'none');

  group
    .append('line')
    .attr('x1', x)
    .attr('y1', y + arcRadius * 0.3)
    .attr('x2', x + arcRadius * 0.6)
    .attr('y2', y - arcRadius * 0.5)
    .attr('class', 'qc-gate-label');

  if (gate.name !== 'M') {
    const basis = gate.name.startsWith('M') ? gate.name.substring(1) : gate.name;
    group
      .append('text')
      .attr('x', x)
      .attr('y', y + GATE_HEIGHT / 2 + 4)
      .attr('class', 'qc-gate-label')
      .attr('font-size', '10px')
      .text(basis);
  }
};

// ── multi‑qubit helpers ────────────────────────────────────────────────

const drawControl = (group: SVG, x: number, y: number) => {
  group
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', CONTROL_RADIUS)
    .attr('class', 'qc-control');
};

const drawZeroControl = (group: SVG, x: number, y: number) => {
  group
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', CONTROL_RADIUS)
    .attr('class', 'qc-control-zero');
};

const drawTarget = (group: SVG, x: number, y: number) => {
  group
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', TARGET_RADIUS)
    .attr('class', 'qc-target');

  const inner = TARGET_RADIUS - 3;
  group
    .append('line')
    .attr('x1', x - inner)
    .attr('y1', y)
    .attr('x2', x + inner)
    .attr('y2', y)
    .attr('class', 'qc-target-cross');
  group
    .append('line')
    .attr('x1', x)
    .attr('y1', y - inner)
    .attr('x2', x)
    .attr('y2', y + inner)
    .attr('class', 'qc-target-cross');
};

const drawSwap = (group: SVG, x: number, y: number) => {
  const s = 6;
  group
    .append('line')
    .attr('x1', x - s)
    .attr('y1', y - s)
    .attr('x2', x + s)
    .attr('y2', y + s)
    .attr('class', 'qc-swap');
  group
    .append('line')
    .attr('x1', x + s)
    .attr('y1', y - s)
    .attr('x2', x - s)
    .attr('y2', y + s)
    .attr('class', 'qc-swap');
};

const drawMultiQubitGate = (
  group: SVG,
  x: number,
  wireYs: number[],
  gate: ScheduledGate,
  direction: 'LR' | 'TD' = 'LR'
) => {
  const topY = wireYs[0];
  const bottomY = wireYs[wireYs.length - 1];

  // Vertical (LR) or horizontal (TD) connector
  if (wireYs.length > 1) {
    if (direction === 'LR') {
      group
        .append('line')
        .attr('x1', x)
        .attr('y1', topY)
        .attr('x2', x)
        .attr('y2', bottomY)
        .attr('class', 'qc-connector');
    } else {
      group
        .append('line')
        .attr('x1', topY)
        .attr('y1', x)
        .attr('x2', bottomY)
        .attr('y2', x)
        .attr('class', 'qc-connector');
    }
  }

  const isSwap = gate.name === 'SWAP';
  const isCSwap = gate.name === 'CSWAP';
  const isZTarget = gate.name === 'CZ' || gate.name === 'CCZ';

  const numControls = isCSwap ? 1 : isSwap ? 0 : gate.wireRefs.length - 1;

  // Draw controls
  for (let i = 0; i < numControls; i++) {
    if (gate.wireRefs[i].zeroControl) {
      drawZeroControl(group, x, wireYs[i]);
    } else {
      drawControl(group, x, wireYs[i]);
    }
  }

  // Draw targets
  if (isSwap) {
    drawSwap(group, x, wireYs[0]);
    drawSwap(group, x, wireYs[1]);
  } else if (isCSwap) {
    drawSwap(group, x, wireYs[1]);
    drawSwap(group, x, wireYs[2]);
  } else if (isZTarget) {
    drawGate(group, x, wireYs[wireYs.length - 1], { ...gate, name: 'Z' });
  } else {
    drawTarget(group, x, wireYs[wireYs.length - 1]);
  }
};

// ── barrier ────────────────────────────────────────────────────────────

const drawBarrierLR = (group: SVG, x: number, yStart: number, yEnd: number) => {
  group
    .append('line')
    .attr('x1', x)
    .attr('y1', yStart - WIRE_SPACING / 2)
    .attr('x2', x)
    .attr('y2', yEnd + WIRE_SPACING / 2)
    .attr('class', 'qc-barrier');
};

const drawBarrierTD = (group: SVG, y: number, xStart: number, xEnd: number) => {
  group
    .append('line')
    .attr('x1', xStart - WIRE_SPACING / 2)
    .attr('y1', y)
    .attr('x2', xEnd + WIRE_SPACING / 2)
    .attr('y2', y)
    .attr('class', 'qc-barrier');
};

// ── classical wire helpers ─────────────────────────────────────────────

/**
 * Draw the double-line symbol for a classical wire segment.
 * For LR mode: two horizontal lines with a small gap between them.
 */
const drawClassicalWireLR = (svg: SVG, x1: number, x2: number, y: number) => {
  const gap = 2;
  svg
    .append('line')
    .attr('x1', x1)
    .attr('y1', y - gap)
    .attr('x2', x2)
    .attr('y2', y - gap)
    .attr('class', 'qc-classical-wire');
  svg
    .append('line')
    .attr('x1', x1)
    .attr('y1', y + gap)
    .attr('x2', x2)
    .attr('y2', y + gap)
    .attr('class', 'qc-classical-wire');
};

const drawClassicalWireTD = (svg: SVG, y1: number, y2: number, x: number) => {
  const gap = 2;
  svg
    .append('line')
    .attr('x1', x - gap)
    .attr('y1', y1)
    .attr('x2', x - gap)
    .attr('y2', y2)
    .attr('class', 'qc-classical-wire');
  svg
    .append('line')
    .attr('x1', x + gap)
    .attr('y1', y1)
    .attr('x2', x + gap)
    .attr('y2', y2)
    .attr('class', 'qc-classical-wire');
};

/**
 * Draw a measurement-to-classical-bit capture arrow (LR mode).
 * Draws a diagonal line from the bottom of the measurement gate to the
 * classical wire, with a small arrowhead.
 */
const drawCaptureLR = (
  svg: SVG,
  gateX: number,
  gateBottomY: number,
  classicalY: number
) => {
  const x1 = gateX;
  const y1 = gateBottomY + CAPTURE_ARROW_GAP;
  const x2 = gateX;
  const y2 = classicalY;

  svg
    .append('line')
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('class', 'qc-capture-arrow');

  // arrowhead
  const ah = 6;
  svg
    .append('path')
    .attr('d', `M ${x2 - ah / 2} ${y2 - ah} L ${x2} ${y2} L ${x2 + ah / 2} ${y2 - ah}`)
    .attr('class', 'qc-capture-arrow')
    .attr('fill', 'none');
};

const drawCaptureTD = (
  svg: SVG,
  gateY: number,
  gateRightX: number,
  classicalX: number
) => {
  const x1 = gateRightX + CAPTURE_ARROW_GAP;
  const y1 = gateY;
  const x2 = classicalX;
  const y2 = gateY;

  svg
    .append('line')
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('class', 'qc-capture-arrow');

  const ah = 6;
  svg
    .append('path')
    .attr('d', `M ${x2 - ah} ${y2 - ah / 2} L ${x2} ${y2} L ${x2 - ah} ${y2 + ah / 2}`)
    .attr('class', 'qc-capture-arrow')
    .attr('fill', 'none');
};

/**
 * Draw a classical condition indicator — a small filled dot on the classical
 * wire connected by a dashed line to the gate.
 */
const drawConditionLR = (
  svg: SVG,
  gateX: number,
  gateTopY: number,
  classicalY: number
) => {
  svg
    .append('line')
    .attr('x1', gateX)
    .attr('y1', classicalY)
    .attr('x2', gateX)
    .attr('y2', gateTopY - CAPTURE_ARROW_GAP)
    .attr('class', 'qc-condition-line');

  svg
    .append('circle')
    .attr('cx', gateX)
    .attr('cy', classicalY)
    .attr('r', 4)
    .attr('class', 'qc-condition-dot');
};

const drawConditionTD = (
  svg: SVG,
  gateY: number,
  gateRightX: number,
  classicalX: number
) => {
  svg
    .append('line')
    .attr('x1', classicalX)
    .attr('y1', gateY)
    .attr('x2', gateRightX + CAPTURE_ARROW_GAP)
    .attr('y2', gateY)
    .attr('class', 'qc-condition-line');

  svg
    .append('circle')
    .attr('cx', classicalX)
    .attr('cy', gateY)
    .attr('r', 4)
    .attr('class', 'qc-condition-dot');
};

// ── LR layout ──────────────────────────────────────────────────────────

const drawLR = (svg: SVG, db: QuantumCircuitDB) => {
  const wires = db.getWires();
  const cbits = db.getCbits();
  const layers = db.getLayers();
  const numWires = wires.length;
  const numCbits = cbits.length;
  const numLayers = layers.length;

  const totalWireRows = numWires + numCbits;
  const svgWidth = PADDING * 2 + WIRE_LABEL_WIDTH + WIRE_LABEL_GAP + numLayers * COLUMN_WIDTH;
  const svgHeight =
    PADDING * 2 +
    (numWires - 1) * WIRE_SPACING +
    (numCbits > 0 ? CLASSICAL_WIRE_OFFSET + (numCbits - 1) * WIRE_SPACING : 0);

  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, false);

  const wireY = (i: number) => PADDING + i * WIRE_SPACING;
  const cbitY = (i: number) =>
    PADDING + (numWires - 1) * WIRE_SPACING + CLASSICAL_WIRE_OFFSET + i * WIRE_SPACING;
  const colX = (c: number) =>
    PADDING + WIRE_LABEL_WIDTH + WIRE_LABEL_GAP + c * COLUMN_WIDTH + COLUMN_WIDTH / 2;

  const wireStartX = PADDING + WIRE_LABEL_WIDTH + WIRE_LABEL_GAP;
  const wireEndX = wireStartX + numLayers * COLUMN_WIDTH;

  // Build cbit index map
  const cbitIdx = new Map<string, number>();
  cbits.forEach((c, i) => cbitIdx.set(c.name, i));

  // ── Quantum wires ──────────────────────────────────────────────────
  for (let i = 0; i < numWires; i++) {
    svg
      .append('line')
      .attr('x1', wireStartX)
      .attr('y1', wireY(i))
      .attr('x2', wireEndX)
      .attr('y2', wireY(i))
      .attr('class', 'qc-wire');
  }

  // Wire labels
  for (let i = 0; i < numWires; i++) {
    const w = wires[i];
    const label = `${w.name}: |${w.initialState}⟩`;
    svg
      .append('text')
      .attr('x', PADDING + WIRE_LABEL_WIDTH)
      .attr('y', wireY(i))
      .attr('class', 'qc-wire-label')
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .text(label);
  }

  // ── Classical wires ────────────────────────────────────────────────
  for (let i = 0; i < numCbits; i++) {
    drawClassicalWireLR(svg, wireStartX, wireEndX, cbitY(i));
    svg
      .append('text')
      .attr('x', PADDING + WIRE_LABEL_WIDTH)
      .attr('y', cbitY(i))
      .attr('class', 'qc-wire-label')
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .text(cbits[i].name);
  }

  // ── Gate layers ────────────────────────────────────────────────────
  for (let li = 0; li < numLayers; li++) {
    const layer = layers[li];
    const x = colX(li);

    if (layer.length === 1 && isBarrier(layer[0])) {
      drawBarrierLR(svg, x, wireY(0), wireY(numWires - 1));
      continue;
    }

    for (const item of layer) {
      if (isBarrier(item)) {
        continue;
      }

      const gate = item;

      // Multi‑qubit gate
      if (gate.wireRefs.length > 1) {
        const wireIndices = gate.wireRefs.map((ref) =>
          wires.findIndex((w) => w.name === ref.wire)
        );
        const wireYs = wireIndices.map((i) => wireY(i));
        drawMultiQubitGate(svg, x, wireYs, gate);
      } else {
        // Single‑qubit gate
        const gateWireIdx = wires.findIndex((w) => w.name === gate.wireRefs[0]?.wire);
        if (gateWireIdx === -1) {
          continue;
        }
        const y = wireY(gateWireIdx);

        if (gate.name === 'M' || gate.name === 'MZ' || gate.name === 'MX') {
          drawMeasurement(svg, x, y, gate);
        } else {
          drawGate(svg, x, y, gate);
        }
      }

      // ── Classical capture arrow ──────────────────────────────────
      if (gate.captureTarget) {
        const cidx = cbitIdx.get(gate.captureTarget);
        if (cidx !== undefined) {
          const gateWireIdx = wires.findIndex((w) => w.name === gate.wireRefs[0]?.wire);
          const gateBottomY = wireY(gateWireIdx) + GATE_HEIGHT / 2;
          drawCaptureLR(svg, x, gateBottomY, cbitY(cidx));
        }
      }

      // ── Classical condition indicator ────────────────────────────
      if (gate.conditionCbit) {
        const cidx = cbitIdx.get(gate.conditionCbit);
        if (cidx !== undefined) {
          const gateWireIdx = wires.findIndex((w) => w.name === gate.wireRefs[0]?.wire);
          const gateTopY = wireY(gateWireIdx) - GATE_HEIGHT / 2;
          drawConditionLR(svg, x, gateTopY, cbitY(cidx));
        }
      }
    }
  }
};

// ── TD layout ──────────────────────────────────────────────────────────

const drawTD = (svg: SVG, db: QuantumCircuitDB) => {
  const wires = db.getWires();
  const cbits = db.getCbits();
  const layers = db.getLayers();
  const numWires = wires.length;
  const numCbits = cbits.length;
  const numLayers = layers.length;

  const svgWidth =
    PADDING * 2 +
    (numWires - 1) * WIRE_SPACING +
    (numCbits > 0 ? CLASSICAL_WIRE_OFFSET + (numCbits - 1) * WIRE_SPACING : 0);
  const svgHeight = PADDING * 2 + WIRE_LABEL_WIDTH + WIRE_LABEL_GAP + numLayers * COLUMN_WIDTH;

  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, false);

  const wireX = (i: number) => PADDING + i * WIRE_SPACING;
  const cbitX = (i: number) =>
    PADDING + (numWires - 1) * WIRE_SPACING + CLASSICAL_WIRE_OFFSET + i * WIRE_SPACING;
  const rowY = (r: number) =>
    PADDING + WIRE_LABEL_WIDTH + WIRE_LABEL_GAP + r * COLUMN_WIDTH + COLUMN_WIDTH / 2;

  const wireStartY = PADDING + WIRE_LABEL_WIDTH + WIRE_LABEL_GAP;
  const wireEndY = wireStartY + numLayers * COLUMN_WIDTH;

  const cbitIdx = new Map<string, number>();
  cbits.forEach((c, i) => cbitIdx.set(c.name, i));

  // ── Quantum wires ──────────────────────────────────────────────────
  for (let i = 0; i < numWires; i++) {
    svg
      .append('line')
      .attr('x1', wireX(i))
      .attr('y1', wireStartY)
      .attr('x2', wireX(i))
      .attr('y2', wireEndY)
      .attr('class', 'qc-wire');
  }

  // Wire labels
  for (let i = 0; i < numWires; i++) {
    const w = wires[i];
    const label = `${w.name}: |${w.initialState}⟩`;
    svg
      .append('text')
      .attr('x', wireX(i))
      .attr('y', PADDING + WIRE_LABEL_WIDTH)
      .attr('class', 'qc-wire-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'auto')
      .text(label);
  }

  // ── Classical wires ────────────────────────────────────────────────
  for (let i = 0; i < numCbits; i++) {
    drawClassicalWireTD(svg, wireStartY, wireEndY, cbitX(i));
    svg
      .append('text')
      .attr('x', cbitX(i))
      .attr('y', PADDING + WIRE_LABEL_WIDTH)
      .attr('class', 'qc-wire-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'auto')
      .text(cbits[i].name);
  }

  // ── Gate layers ────────────────────────────────────────────────────
  for (let li = 0; li < numLayers; li++) {
    const layer = layers[li];
    const y = rowY(li);

    if (layer.length === 1 && isBarrier(layer[0])) {
      drawBarrierTD(svg, y, wireX(0), wireX(numWires - 1));
      continue;
    }

    for (const item of layer) {
      if (isBarrier(item)) {
        continue;
      }

      const gate = item;

      // Multi‑qubit gate
      if (gate.wireRefs.length > 1) {
        const wireIndices = gate.wireRefs.map((ref) =>
          wires.findIndex((w) => w.name === ref.wire)
        );
        const wireXs = wireIndices.map((i) => wireX(i));
        drawMultiQubitGate(svg, y, wireXs, gate, 'TD');
      } else {
        // Single‑qubit gate
        const gateWireIdx = wires.findIndex((w) => w.name === gate.wireRefs[0]?.wire);
        if (gateWireIdx === -1) {
          continue;
        }
        const x = wireX(gateWireIdx);

        if (gate.name === 'M' || gate.name === 'MZ' || gate.name === 'MX') {
          drawMeasurement(svg, x, y, gate);
        } else {
          drawGate(svg, x, y, gate);
        }
      }

      // ── Classical capture arrow ──────────────────────────────────
      if (gate.captureTarget) {
        const cidx = cbitIdx.get(gate.captureTarget);
        if (cidx !== undefined) {
          const gateWireIdx = wires.findIndex((w) => w.name === gate.wireRefs[0]?.wire);
          const gateRightX = wireX(gateWireIdx) + GATE_WIDTH / 2;
          drawCaptureTD(svg, y, gateRightX, cbitX(cidx));
        }
      }

      // ── Classical condition indicator ────────────────────────────
      if (gate.conditionCbit) {
        const cidx = cbitIdx.get(gate.conditionCbit);
        if (cidx !== undefined) {
          const gateWireIdx = wires.findIndex((w) => w.name === gate.wireRefs[0]?.wire);
          const gateRightX = wireX(gateWireIdx) + GATE_WIDTH / 2;
          drawConditionTD(svg, y, gateRightX, cbitX(cidx));
        }
      }
    }
  }
};

// ── entry point ────────────────────────────────────────────────────────

export const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as QuantumCircuitDB;
  const direction = db.getDirection();
  const svg: SVG = selectSvgElement(id);

  if (direction === 'TD') {
    drawTD(svg, db);
  } else {
    drawLR(svg, db);
  }
};

export const renderer: DiagramRenderer = { draw };
