import { test, expect } from '@playwright/test';

import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Ishikawa diagram', () => {
  test('1: should render a simple ishikawa diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `
    );
  });

  test('2: should render with many causes on both sides', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Manufacturing Defect
        Machine
            Worn tooling
            Calibration
        Method
            Missing step
        Material
            Contamination
            Wrong grade
        Manpower
            Insufficient training
      `
    );
  });

  test('3: should render with deeply nested causes', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Server Outage
        Hardware
            Disk
                Bad sectors
                Full capacity
            Memory
                Leak detected
        Software
            Bug
                Race condition
      `
    );
  });

  test('4: should render with a single cause', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Problem
        Cause A
      `
    );
  });

  test('5: should render with no children (root only)', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Problem
      `
    );
  });

  test('6: should render with handDrawn look', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { look: 'handDrawn' }
    );
  });

  test('7: should render with forest theme', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { theme: 'forest' }
    );
  });

  test('8: should render with dark theme', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { theme: 'dark' }
    );
  });

  test('9: should render with custom diagramPadding', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { diagramPadding: 50 } }
    );
  });

  test('10: should render when useMaxWidth is true', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
  });

  test('11: should render when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThan(0);
    const height = parseFloat((await svg.getAttribute('height')) ?? '0');
    expect(height).toBeGreaterThan(0);
    await expect(svg).not.toHaveAttribute('style');
  });

  test('12: should render correctly when effect is indented more than causes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Problem
Cause A
  Subcause A1
  Subcause A2
Cause B
  Subcause B1
Cause C
      `
    );
  });

  test('13: should render a very deep nested diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `ishikawa-beta
    Very deep
    Cause 1
      1-1
      1-2
      1-3
          1-3-1
          1-3-2
          1-3-3
          1-3-4
    Cause 2
      2-1
        2-1-1
        2-1-2
      2-2
        2-2-1
        2-2-2
          2-2-2-1
            2-2-2-1-1
            2-2-2-1-2
              2-2-2-1-2-1
          2-2-2-1
      2-3
        2-3-1
    Cause 3
       3-1
         3-1-1
            3-1-1-1
              3-1-1-1-1
                3-1-1-1-1-1
                  3-1-1-1-1-1-1
    Cause 4
        4-1
          4-1-1
          4-1-2
          4-1-3
          4-1-4
          4-1-5
          4-1-6
          4-1-7
          4-1-8
        4-2
          4-2-1
          4-2-2
    Cause 5
        5-1
    Cause 6
        6-1
        6-2
        6-3
        6-4
        6-5
        6-6
      `
    );
  });
});
