import { expect } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';

addDiagrams();

jsdomIt('keeps five-day ticks evenly spaced across a month boundary on both axes', async () => {
  const { svg } = await mermaidAPI.render(
    'gantt-day-ticks',
    `---
config:
  gantt:
    topAxis: true
---
gantt
    dateFormat YYYY-MM-DD
    axisFormat %Y-%m-%d
    tickInterval 5day
    section Work
    Task A : 2024-12-20, 2025-01-10`
  );

  const diagram = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const axes = [...diagram.querySelectorAll('.grid')];
  const labels = axes.map((axis) =>
    [...axis.querySelectorAll('.tick text')].map((tick) => tick.textContent)
  );
  const expected = ['2024-12-21', '2024-12-26', '2024-12-31', '2025-01-05', '2025-01-10'];

  expect(labels).toEqual([expected, expected]);
});
