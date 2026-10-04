import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Wardley Maps', () => {
  ['dark', 'forest', 'neutral', 'base'].forEach((theme) => {
    test(`should render under the ${theme} theme`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
wardley-beta
title Theme Test - ${theme}
size [1100, 800]

anchor User [0.95, 0.85]
component App [0.75, 0.70]
component API [0.55, 0.55]
component Database [0.30, 0.60]
component Cache [0.50, 0.40]

User -> App
App -> API
API -> Database
API -> Cache

evolve Database 0.80
        `,
        { theme }
      );
    });
  });

  // autoPlaceLabels is set through the config object rather than as .mmd
  // fixtures under e2e/diagrams/wardley/: frontmatter `wardley-beta` config is
  // dropped by sanitizeDirective because the key is not in configKeys.
  test('should render dense map labels without overlap when autoPlaceLabels is enabled', async ({
    page,
  }, testInfo) => {
    // Seven long-named components packed into a tiny coordinate box. Without
    // auto-placement their default NE-offset labels collide into an unreadable
    // blob, so this map genuinely exercises the placement algorithm.
    await imgSnapshotTest(
      page,
      testInfo,
      `
wardley-beta
title Overlapping Label Stress Test
size [1100, 800]

component Customer Service Portal [0.55, 0.62]
component Customer Support Desk [0.58, 0.60]
component Customer Records Store [0.52, 0.64]
component Customer Data Platform [0.56, 0.585]
component Account Management API [0.53, 0.59]
component Billing And Invoicing [0.57, 0.635]
component Identity Provider [0.545, 0.61]

Customer Service Portal -> Customer Data Platform
Customer Support Desk -> Customer Records Store
Account Management API -> Billing And Invoicing
Identity Provider -> Customer Data Platform
      `,
      { 'wardley-beta': { autoPlaceLabels: true } }
    );
  });

  test('should keep collision-free manual labels when autoPlaceLabels is enabled', async ({
    page,
  }, testInfo) => {
    // Three cases: `Kept Manual Label` is isolated with a manual label that
    // lands in clear space and has no link touching it -> kept untouched.
    // `Colliding Manual` has a manual label dropped onto a node cluster ->
    // re-placed. The remaining components are untuned -> auto-placed.
    await imgSnapshotTest(
      page,
      testInfo,
      `
wardley-beta
title Manual Label Mix
size [1100, 800]

component Kept Manual Label [0.25, 0.30] label [20, -18]
component Colliding Manual [0.55, 0.60] label [-90, 2]
component Crowded Node A [0.52, 0.62]
component Crowded Node B [0.56, 0.585]
component Crowded Node C [0.53, 0.59]
component Untuned Component [0.78, 0.40]

Colliding Manual -> Crowded Node B
Crowded Node A -> Untuned Component
      `,
      { 'wardley-beta': { autoPlaceLabels: true } }
    );
  });

  test('should place pipeline child labels underneath when autoPlaceLabels is enabled', async ({
    page,
  }, testInfo) => {
    // Pipeline child components have no manual `label [x,y]`, so they are
    // auto-placed; their preferred direction is straight down.
    await imgSnapshotTest(
      page,
      testInfo,
      `
wardley-beta
title Pipeline Autoplace
size [1100, 800]

component Kettle [0.57, 0.45]
component Power [0.10, 0.70]

Kettle -> Power

pipeline Kettle {
  component Campfire Kettle [0.30]
  component Electric Kettle [0.52]
  component Smart Kettle [0.74]
}

Campfire Kettle -> Kettle
Electric Kettle -> Kettle
Smart Kettle -> Kettle
      `,
      { 'wardley-beta': { autoPlaceLabels: true } }
    );
  });
});
