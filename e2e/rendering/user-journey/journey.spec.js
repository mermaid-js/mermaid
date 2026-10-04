import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

test.describe('User journey diagram', () => {
  test('should render a user journey diagram when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `journey
title E-Commerce
section Order from website
  Add to cart: 5: Me
section Checkout from website
  Add payment details: 5: Me
    `,
      { journey: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    await expect(svg).toHaveAttribute('height');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    expect(maxWidthValue).toBe(700);
  });

  test('should initialize with a left margin of 150px for user journeys', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
      ---
      config:
        journey:
          maxLabelWidth: 320
      ---
      journey
        title User Journey Example
        section Onboarding
            Sign Up: 5:
            Browse Features: 3:
            Use Core Functionality: 4:
        section Engagement
            Browse Features: 3
            Use Core Functionality: 4
      `,
      { journey: { useMaxWidth: true } }
    );

    const diagramStartX = parseFloat(
      (await page
        .locator('foreignobject')
        .filter({ hasText: 'Sign Up' })
        .first()
        .getAttribute('x')) ?? '0'
    );
    expect(Math.abs(diagramStartX - 150)).toBeLessThanOrEqual(2);
  });

  test('should maintain sufficient space between legend and diagram when legend labels are longer', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `journey
      title  Web hook life cycle
      section Darkoob
        Make preBuilt:5: Darkoob user
        register slug : 5: Darkoob userf deliberately increasing the size of this label to check if distance between legend and diagram is  maintained
        Map slug to a Prebuilt Job:5: Darkoob user
      section External Service
        set Darkoob slug as hook for an Event : 5 : admin Exjjjnjjjj qwerty
        listen to the events : 5 :  External Service
        call darkoob endpoint : 5 : External Service
      section Darkoob
        check for inputs : 5 : DarkoobAPI
        run the prebuilt job : 5 : DarkoobAPI
        `,
      { journey: { useMaxWidth: true } }
    );

    const { labelEndX, diagramStartX } = await page.evaluate(() => {
      const legendText = [...document.querySelectorAll('tspan')].find((el) =>
        el.textContent?.includes('Darkoob userf')
      );
      if (!legendText) {
        throw new Error('legend label not found');
      }
      const legendBBox = legendText.getBBox();
      const diagram = [...document.querySelectorAll('foreignobject')].find((el) =>
        el.textContent?.includes('Make preBuilt')
      );
      if (!diagram) {
        throw new Error('diagram node not found');
      }
      return {
        labelEndX: legendBBox.x + legendBBox.width,
        diagramStartX: parseFloat(diagram.getAttribute('x') ?? '0'),
      };
    });
    expect(diagramStartX).toBeGreaterThanOrEqual(labelEndX);
  });

  test('should wrap a single long word with hyphenation', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
      ---
      config:
        journey:
          maxLabelWidth: 100
      ---
      journey
        title Long Word Test
        section Test
          VeryLongWord: 5: Supercalifragilisticexpialidocious
      `,
      { journey: { useMaxWidth: true } }
    );

    const hasHyphen = await page
      .locator('tspan')
      .evaluateAll((tspans) => tspans.some((t) => t.textContent?.trim().endsWith('-')));
    expect(hasHyphen).toBe(true);
  });

  test('should wrap text on whitespace without adding hyphens', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
      ---
      config:
        journey:
          maxLabelWidth: 200
      ---
      journey
        title Whitespace Test
        section Test
          TextWithSpaces: 5: Gustavo Fring is played by Giancarlo Esposito and is a character in Breaking Bad.
      `,
      { journey: { useMaxWidth: true } }
    );

    const tspans = page.locator('tspan');
    const count = await tspans.count();
    for (let i = 0; i < count; i++) {
      const text = (await tspans.nth(i).textContent())?.trim() ?? '';
      expect(text).not.toMatch(/-$/);
    }
  });

  test('should wrap long labels into multiple lines, keep them under max width, and maintain margins', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
      ---
      config:
        journey:
          maxLabelWidth: 320
      ---
      journey
        title User Journey Example
        section Onboarding
            Sign Up: 5: This is a long label that will be split into multiple lines to test the wrapping functionality
            Browse Features: 3: This is another long label that will be split into multiple lines to test the wrapping functionality
            Use Core Functionality: 4: This is yet another long label that will be split into multiple lines to test the wrapping functionality
        section Engagement
            Browse Features: 3
            Use Core Functionality: 4
      `,
      { journey: { useMaxWidth: true } }
    );

    const { diagramStartX, maxLineWidth, legendLines } = await page.evaluate(() => {
      const diagram = [...document.querySelectorAll('foreignobject')].find((el) =>
        el.textContent?.includes('Sign Up')
      );
      if (!diagram) {
        throw new Error('diagram node not found');
      }
      const lines = [...document.querySelectorAll('text.legend')];
      let maxWidth = 0;
      for (const line of lines) {
        const bbox = line.getBBox();
        if (bbox.width > 320) {
          throw new Error(`legend line exceeds max width: ${bbox.width}`);
        }
        maxWidth = Math.max(maxWidth, bbox.width);
      }
      return {
        diagramStartX: parseFloat(diagram.getAttribute('x') ?? '0'),
        maxLineWidth: maxWidth,
        legendLines: lines.map((line) => line.textContent?.trim() ?? ''),
      };
    });
    // This test is about wrapping mechanics and margins -- not about how many lines a
    // particular typeface needs. An exact line count silently encoded the default theme's
    // font: these labels wrap into 9 lines in Trebuchet and 6 in Recursive, so the
    // assertion used to break on a theme change that had nothing to do with wrapping.
    //
    // A total-vs-label-count comparison is not the answer either, because it is not a
    // per-label check: with three labels, one wrapping into four lines while the other two
    // stay on a single line each gives four lines in total and passes -- the very case the
    // check is meant to exclude. The legend lines are flat siblings with no per-label
    // grouping in the DOM, so walk them in order and consume as many as each label needs.
    const LONG_LABELS = [
      'This is a long label that will be split into multiple lines to test the wrapping functionality',
      'This is another long label that will be split into multiple lines to test the wrapping functionality',
      'This is yet another long label that will be split into multiple lines to test the wrapping functionality',
    ];
    const remaining = [...legendLines];
    for (const label of LONG_LABELS) {
      const consumed = [];
      while (remaining.length > 0 && consumed.join(' ') !== label) {
        consumed.push(remaining.shift());
      }
      // Reassembling the label also catches text being dropped or reordered by wrapping,
      // and gives the per-label count its meaning: without this, a run of unrelated lines
      // could satisfy the length check below.
      expect(consumed.join(' '), `legend lines did not reassemble into: ${label}`).toBe(label);
      // No exact count, so a different typeface is free to need a different number --
      // only that this label, on its own, did not fit on one line.
      expect(consumed.length, `label did not wrap onto multiple lines: ${label}`).toBeGreaterThan(
        1
      );
    }
    // Nothing left over: an extra legend entry would mean the fixture and LONG_LABELS have
    // drifted apart, which would quietly weaken every assertion above.
    expect(remaining).toEqual([]);
    expect(Math.abs(diagramStartX - maxLineWidth - 150)).toBeLessThanOrEqual(2);
  });

  test('should correctly render the user journey diagram title with the specified styling', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `---
config:
  journey:
    titleColor: "#2900A5"
    titleFontFamily: "Times New Roman"
    titleFontSize: "5rem"
---

journey
    title User Journey Example
    section Onboarding
        Sign Up: 5: John, Shahir
        Complete Profile: 4: John
    section Engagement
        Browse Features: 3: John
        Use Core Functionality: 4: John
    section Retention
        Revisit Application: 5: John
        Invite Friends: 3: John

        size: 2rem
    `
    );

    const title = page.getByText('User Journey Example');
    await expect(title).toHaveAttribute('fill', '#2900A5');
    await expect(title).toHaveAttribute('font-family', 'Times New Roman');
    await expect(title).toHaveAttribute('font-size', '5rem');
  });
});
