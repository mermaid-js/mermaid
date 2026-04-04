import { computeGanttLayout, defaultGanttLayout } from './ganttRenderer.js';

describe('ganttRenderer layout scaling', () => {
  const createConfig = (overrides = {}) => ({
    titleTopMargin: defaultGanttLayout.titleTopMargin,
    barHeight: defaultGanttLayout.barHeight,
    barGap: defaultGanttLayout.barGap,
    topPadding: defaultGanttLayout.topPadding,
    rightPadding: defaultGanttLayout.rightPadding,
    leftPadding: defaultGanttLayout.leftPadding,
    gridLineStartPadding: defaultGanttLayout.gridLineStartPadding,
    fontSize: 11,
    ...overrides,
  });

  it('does not change layout when fontSize = 11', () => {
    const config = createConfig({ fontSize: 11 });

    const layout = computeGanttLayout(config, {});

    expect(layout.barHeight).toBe(defaultGanttLayout.barHeight);
    expect(layout.taskLabelOffset).toBe(defaultGanttLayout.taskLabelOffset);
    expect(layout.sectionLabelX).toBe(defaultGanttLayout.sectionLabelX);
  });

  it('scales layout when fontSize increases', () => {
    const config = createConfig({ fontSize: 20 });

    const layout = computeGanttLayout(config, {});

    expect(layout.barHeight).toBeGreaterThan(defaultGanttLayout.barHeight);
    expect(layout.taskLabelOffset).toBeGreaterThan(defaultGanttLayout.taskLabelOffset);
    expect(layout.sectionLabelX).toBeGreaterThan(defaultGanttLayout.sectionLabelX);
  });

  it('does not scale explicitly set values', () => {
    const config = createConfig({ fontSize: 20, barHeight: 20 });

    const layout = computeGanttLayout(config, { barHeight: 20 });

    expect(layout.barHeight).toBe(20);
  });
});
