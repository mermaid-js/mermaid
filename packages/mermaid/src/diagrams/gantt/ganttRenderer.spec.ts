import { computeGanttLayout, defaultGanttLayout } from './ganttRenderer.js';

describe('ganttRenderer layout scaling', () => {
  const createMergedConfig = (overrides = {}) => ({
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

  const createUserDefinedConfig = (overrides = {}) => ({
    ...overrides,
  });

  it('does not change layout when fontSize = 11', () => {
    const mergedConfig = createMergedConfig({ fontSize: 11 });
    const userDefinedConfig = createUserDefinedConfig({ fontSize: 11 });

    const layout = computeGanttLayout(mergedConfig, userDefinedConfig);

    expect(layout.barHeight).toBe(defaultGanttLayout.barHeight);
    expect(layout.taskLabelOffset).toBe(defaultGanttLayout.taskLabelOffset);
    expect(layout.sectionLabelX).toBe(defaultGanttLayout.sectionLabelX);
  });

  it('scales layout when fontSize increases', () => {
    const mergedConfig = createMergedConfig({ fontSize: 20 });
    const userDefinedConfig = createUserDefinedConfig({ fontSize: 20 });

    const layout = computeGanttLayout(mergedConfig, userDefinedConfig);

    expect(layout.barHeight).toBeGreaterThan(defaultGanttLayout.barHeight);
    expect(layout.barGap).toBeGreaterThan(defaultGanttLayout.barGap);
    expect(layout.taskLabelOffset).toBeGreaterThan(defaultGanttLayout.taskLabelOffset);
    expect(layout.sectionLabelX).toBeGreaterThan(defaultGanttLayout.sectionLabelX);
  });

  it('does not scale explicitly set values', () => {
    const mergedConfig = createMergedConfig({ fontSize: 20, barHeight: 30, barGap: 8 });
    const userDefinedConfig = createUserDefinedConfig({ fontSize: 20, barHeight: 30, barGap: 8 });

    const layout = computeGanttLayout(mergedConfig, userDefinedConfig);

    expect(layout.barHeight).toBe(30);
    expect(layout.barGap).toBe(8);
  });

  it('does not scale explicit values that equal the documented defaults', () => {
    const mergedConfig = createMergedConfig({
      fontSize: 20,
      barHeight: defaultGanttLayout.barHeight,
      titleTopMargin: defaultGanttLayout.titleTopMargin,
    });
    const userDefinedConfig = createUserDefinedConfig({
      fontSize: 20,
      barHeight: defaultGanttLayout.barHeight,
      titleTopMargin: defaultGanttLayout.titleTopMargin,
    });

    const layout = computeGanttLayout(mergedConfig, userDefinedConfig);

    expect(layout.barHeight).toBe(defaultGanttLayout.barHeight);
    expect(layout.titleTopMargin).toBe(defaultGanttLayout.titleTopMargin);
  });

  it('keeps non-config label offsets proportional when fontSize increases', () => {
    const mergedConfig = createMergedConfig({ fontSize: 20, barHeight: 30 });
    const userDefinedConfig = createUserDefinedConfig({ fontSize: 20, barHeight: 30 });

    const layout = computeGanttLayout(mergedConfig, userDefinedConfig);

    expect(layout.barHeight).toBe(30);
    expect(layout.taskLabelOffset).toBeGreaterThan(defaultGanttLayout.taskLabelOffset);
    expect(layout.sectionLabelX).toBeGreaterThan(defaultGanttLayout.sectionLabelX);
  });
});
