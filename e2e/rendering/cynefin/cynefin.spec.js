import { test } from '@playwright/test';

import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('cynefin framework', () => {
  test('should render a simple cynefin diagram with all five domains', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Incident Response

        complex
          "Investigate root cause"
          "Run chaos experiment"

        complicated
          "Analyze performance data"
          "Expert review needed"

        clear
          "Restart service"
          "Apply known fix"

        chaotic
          "Page on-call immediately"

        confusion
          "Unknown failure mode"
      `
    );
  });

  test('should render a cynefin diagram with transitions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Strategy Categorization

        complex
          "Market research"

        complicated
          "Competitive analysis"

        clear
          "Standard pricing"

        chaotic
          "Crisis management"

        complex --> complicated : "Pattern identified"
        complicated --> clear : "Best practice codified"
        clear --> chaotic : "Complacency"
        chaotic --> complex : "Stabilized"
      `
    );
  });

  test('should render an empty cynefin framework', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Empty Framework

        complex
        complicated
        clear
        chaotic
      `
    );
  });

  test('should render cynefin with many items per domain', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Software Delivery

        complex
          "New product discovery"
          "User behavior analysis"
          "A/B testing strategy"

        complicated
          "Performance optimization"
          "Security audit"
          "Database migration"

        clear
          "Deploy to staging"
          "Run test suite"
          "Merge pull request"

        chaotic
          "Production outage"
          "Data breach response"
      `
    );
  });

  test('should render cynefin with config override', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        complex
          "Adaptive work"
        clear
          "Standard work"
      `,
      { cynefin: { width: 1000, height: 700, boundaryAmplitude: 15 } }
    );
  });

  test('should render cynefin without domain descriptions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Minimal Labels

        complex
          "Item A"
        clear
          "Item B"
      `,
      { cynefin: { showDomainDescriptions: false } }
    );
  });

  test('should render cynefin with theme override', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        complex
          "Test item"
        clear
          "Standard"
      `,
      {
        theme: 'base',
        themeVariables: {
          cynefin: {
            complexBg: '#FFE4B5',
            clearBg: '#E6E6FA',
            boundaryColor: '#FF0000',
          },
        },
      }
    );
  });

  test('should render cynefin with straight boundaries when amplitude is zero', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Straight Boundaries

        complex
          "Item A"
        complicated
          "Item B"
        clear
          "Item C"
        chaotic
          "Item D"
      `,
      { cynefin: { boundaryAmplitude: 0 } }
    );
  });

  test('should render cynefin with confusion domain items without overflow', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Confusion Items

        confusion
          "Unknown A"
          "Unknown B"
          "Unknown C"
          "Unknown D"
          "Unknown E"
      `
    );
  });

  test('should render cynefin with self-loop transitions silently dropped', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Self-loop Handling

        complex
          "Emergent work"
        complicated
          "Expert work"

        complex --> complicated : "Pattern found"
        complex --> complex : "Self-loop (dropped)"
      `
    );
  });

  test('should render cynefin with accessibility directives', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        accTitle: Cynefin framework for software delivery
        accDescr: A Cynefin map categorizing software tasks by complexity domain

        complex
          "Feature discovery"
        complicated
          "Refactoring"
        clear
          "Hotfix"
        chaotic
          "Incident"
      `
    );
  });

  test('should render cynefin deterministically with an explicit seed override', async ({
    page,
  }, testInfo) => {
    // Exercises the cynefin.seed config knob added for #7727. The default
    // helper-injected seed is 1; using a different value here proves the
    // config plumbing reaches the boundary RNG.
    await imgSnapshotTest(
      page,
      testInfo,
      `cynefin-beta
        title Seeded Boundaries

        complex
          "Probe"
        complicated
          "Analyse"
        clear
          "Categorise"
        chaotic
          "Act"
      `,
      { cynefin: { seed: 42 } }
    );
  });
});
