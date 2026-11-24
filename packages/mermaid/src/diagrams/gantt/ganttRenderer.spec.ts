import { describe, expect } from 'vitest';
import { Diagram } from '../../Diagram.js';
import { addDetector } from '../../diagram-api/detectType.js';
import { ensureNodeFromSelector, jsdomIt } from '../../tests/util.js';
import ganttDetector from './ganttDetector.js';
import { draw } from './ganttRenderer.js';

const { id, detector, loader } = ganttDetector;

addDetector(id, detector, loader);

describe('gantt diagram SVGs', () => {
  jsdomIt('adds the exact task date range as a native SVG tooltip', async () => {
    const svgNode = await drawDiagram(`gantt
        dateFormat YYYY-MM-DD HH:mm
        Timed task : task1, 2026-01-02 09:30, 2026-01-02 17:45
    `);

    const taskTitle = ensureNodeFromSelector('#svg-task1 > title', svgNode);
    expect(taskTitle.textContent).toBe('2026-01-02 09:30 - 2026-01-02 17:45');
  });
});

async function drawDiagram(diagramText: string): Promise<Element> {
  const diagram = await Diagram.fromText(diagramText, {});
  draw('NOT_USED', 'svg', '1.0.0', diagram);
  return ensureNodeFromSelector('#svg');
}
