import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { diagramSvg, imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const USECASE_FIXTURE_DIR = 'e2e/platform/dev-diagrams/diagrams/use-case';

// Derived from the filesystem so newly-added use-case fixtures are swept
// automatically — the dev-explorer generator owns this directory and a
// hardcoded list would silently drift out of date.
const USECASE_FIXTURES = readdirSync(USECASE_FIXTURE_DIR)
  .filter((file) => file.endsWith('.mmd'))
  .sort();

// viewer.js injects the diagram source with innerHTML, so raw `&`, `<`, and `>`
// in fixture files must be entity-escaped to survive the round trip (the inline
// diagrams below are already authored pre-escaped).
const asMermaidElementSource = (source: string): string =>
  source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FULL_DIAGRAM = `usecase-beta
  accTitle: Complete use case example
  accDescr: Actors interact with authentication, payment, notes, and JSON data.
  actor Normal("Normal User") &lt;&lt;Human&gt;&gt;
  actor Hollow@{ type: hollow, business: true }
  actor Awesome@{ type: awesome }
  actor Icon@{ icon: "fa:bell" }
  actor UnknownIcon@{ icon: "fa:not-registered" }
  actor BusinessActor@{ business: true }

  systemBoundary "Authentication System":::framed
    actor ContainedActor("Contained actor")
    Login("\`**Sign in**
securely\`") &lt;&lt;Main&gt;&gt;:::critical
    Reset[Reset password]
  end
  "Authentication System"@{ type: package }

  Payment("Payment")
  Extra("Optional flow")
  Checkout("Checkout")@{ business: true } &lt;&lt;Core&gt;&gt;
  Literal("**Literal markers**")
  Hostile("&lt;img src=x onerror=alert#40;1#41;&gt;")

  Normal assocRel@-- "\`opens **session**\`" --> Login
  Hollow circleRel@--o Reset
  Awesome crossRel@--x Normal
  Awesome generalRel@--|> Normal
  Login includeRel@..> : include Payment
  Extra extendRel@..> : extend Login
  Checkout --> Payment
  note for Login "\`Requires an **active session**\`"

  json Payload@{
    "2": "two",
    "1": "one",
    "colors": ["Red", "Green"],
    "address": { "city": "Oslo" },
    "empty": {}
  }
  Payment jsonRel@--> Payload

  classDef framed fill:#fdf6e3,stroke:#6c71c4,stroke-width:3px
  classDef critical fill:#fff3cd,stroke:#b58900
  classDef emphasized stroke:#268bd2,stroke-width:3px
  class assocRel emphasized
  style Authentication_System fill:#fdf6e3,stroke:#6c71c4,stroke-width:3px
  style Checkout stroke:#dc322f,stroke-width:4px
  style Payload fill:#eef7ff,stroke:#123456
  style assocRel stroke:#2aa198,stroke-width:5px
  assocRel@{ animate: true, animation: fast }
`;

// No classDef or style here on purpose — the theme variables must supply every colour.
const THEMED_DIAGRAM = `usecase-beta
  accTitle: Themed use case example
  accDescr: Exercises every themed element without any inline style overrides.
  actor Normal("Normal User")
  actor Hollow@{ type: hollow }
  actor Business@{ business: true }

  systemBoundary "Authentication System"
    Login("Sign in")
    Reset[Reset password]
  end

  Checkout("Checkout")@{ business: true }
  Normal --> Login
  Hollow --o Reset
  Business --> Checkout
  Login ..> : include Checkout
  note for Login "Requires an active session"

  json Payload@{
    "region": "eu",
    "tags": ["Red", "Green"]
  }
  Checkout --> Payload
`;

// Render without a screenshot — used by the behaviour tests below that assert on
// the DOM/CSS rather than the rendered pixels.
const renderForDom = async (
  page: Page,
  testInfo: TestInfo,
  source: string,
  name: string,
  options: Parameters<typeof renderGraph>[3] = {}
): Promise<void> => {
  await renderGraph(page, testInfo, source, { screenshot: false, name, ...options });
};

const edge = (page: Page, id: string) => page.locator(`path[data-usecase-id="${id}"]`);
const element = (page: Page, id: string) => page.locator(`[data-usecase-id="${id}"]`);

const expectBoxContained = async (
  page: Page,
  containerSelector: string,
  childIds: string[]
): Promise<void> => {
  const body = await page.locator(containerSelector).boundingBox();
  expect(body, `${containerSelector} has a rendered box`).not.toBeNull();
  for (const id of childIds) {
    const child = await element(page, id).boundingBox();
    expect(child, `${id} has a rendered box`).not.toBeNull();
    expect(child!.x).toBeGreaterThanOrEqual(body!.x - 1);
    expect(child!.x + child!.width).toBeLessThanOrEqual(body!.x + body!.width + 1);
    expect(child!.y).toBeGreaterThanOrEqual(body!.y - 1);
    expect(child!.y + child!.height).toBeLessThanOrEqual(body!.y + body!.height + 1);
  }
};

test.describe('Usecase diagram', () => {
  test.describe('dev fixture coverage', () => {
    test('covers every use-case dev fixture', () => {
      expect(USECASE_FIXTURES.length, 'generated use-case fixture inventory').toBeGreaterThan(0);
    });

    USECASE_FIXTURES.forEach((fixture) => {
      test(`renders ${fixture} end to end`, async ({ page }, testInfo) => {
        const source = readFileSync(`${USECASE_FIXTURE_DIR}/${fixture}`, 'utf8');
        expect(source, 'fixture should declare the usecase diagram type').toMatch(
          /(?:^|\n)usecase-beta(?:\s|$)/
        );
        await imgSnapshotTest(page, testInfo, asMermaidElementSource(source));
        await expect(page.locator('svg .error-icon')).toHaveCount(0);
        await expect(page.locator('[data-usecase-kind]')).not.toHaveCount(0);
      });
    });
  });

  test('renders the complete typed use-case contract with stable semantics', async ({
    page,
  }, testInfo) => {
    await renderForDom(page, testInfo, FULL_DIAGRAM, 'usecase-full-contract', {
      usecase: {
        actorFontSize: 21,
        actorFontFamily: 'Courier New',
        actorFontWeight: '600',
        usecaseFontSize: 19,
        usecaseFontFamily: 'Georgia',
        usecaseFontWeight: '500',
        nodeSpacing: 65,
        rankSpacing: 75,
        diagramPadding: 37,
        useMaxWidth: false,
      },
    });

    await expect(element(page, 'Normal')).toHaveAttribute('data-usecase-kind', 'actor');
    await expect(element(page, 'Normal')).toHaveAttribute(
      'aria-label',
      'actor Normal User, stereotype Human'
    );
    await expect(
      element(page, 'Normal').locator(
        '.usecase-actor-shape.usecase-actor-normal .usecase-actor-stick'
      )
    ).not.toHaveCount(0);
    await expect(element(page, 'Hollow')).toHaveAttribute(
      'aria-label',
      'business hollow actor Hollow'
    );
    await expect(element(page, 'Hollow').locator('.usecase-actor-hollow-head')).not.toHaveCount(0);
    await expect(element(page, 'Hollow').locator('.usecase-actor-business-marker')).not.toHaveCount(
      0
    );
    await expect(element(page, 'Awesome')).toHaveAttribute('aria-label', 'awesome actor Awesome');
    await expect(
      element(page, 'Awesome').locator('.usecase-actor-awesome-silhouette')
    ).not.toHaveCount(0);
    await expect(element(page, 'Icon')).toHaveAttribute('aria-label', 'icon actor Icon');
    await expect(element(page, 'Icon').locator('.usecase-actor-icon-symbol')).not.toHaveCount(0);
    await expect(
      element(page, 'UnknownIcon').locator('.usecase-actor-icon-fallback')
    ).not.toHaveCount(0);
    await expect(element(page, 'BusinessActor')).toHaveAttribute(
      'aria-label',
      'business actor BusinessActor'
    );
    await expect(
      element(page, 'BusinessActor').locator('.usecase-actor-business-marker')
    ).not.toHaveCount(0);

    await expect(element(page, 'Login')).toHaveAttribute('data-usecase-kind', 'usecase');
    await expect(element(page, 'Login')).toHaveAttribute(
      'aria-label',
      'use case Sign in\nsecurely, stereotype Main'
    );
    await expect(element(page, 'Login').locator('ellipse')).not.toHaveCount(0);
    await expect(element(page, 'Login').locator('.usecase-stereotype')).toContainText('«Main»');
    await expect(element(page, 'Login').locator('.label strong')).toContainText('Sign in');
    await expect(element(page, 'Reset').locator('rect.label-container')).not.toHaveCount(0);
    await expect(element(page, 'Checkout')).toHaveAttribute(
      'aria-label',
      'business use case Checkout, stereotype Core'
    );
    await expect(element(page, 'Checkout').locator('.usecase-business-marker')).toHaveAttribute(
      'style',
      /stroke:#dc322f/
    );
    await expect(element(page, 'Literal')).toContainText('**Literal markers**');
    await expect(element(page, 'Literal').locator('strong')).toHaveCount(0);

    const boundary = element(page, 'Authentication_System');
    await expect(boundary).toHaveAttribute('data-usecase-kind', 'boundary');
    await expect(boundary).toHaveAttribute('data-boundary-type', 'package');
    await expect(boundary).toHaveAttribute(
      'aria-label',
      'package system boundary Authentication System'
    );
    const boundaryTab = boundary.locator('.boundary-tab.system-boundary-package-tab');
    await expect(boundaryTab).toHaveAttribute('style', /fill:#fdf6e3/);
    await expect(boundaryTab).toHaveAttribute('style', /stroke:#6c71c4/);
    const boundaryBody = boundary.locator('.boundary-body');
    await expect(boundaryBody).toHaveAttribute('style', /fill:#fdf6e3/);
    await expect(boundaryBody).toHaveAttribute('style', /stroke:#6c71c4/);
    await expectBoxContained(page, '[data-usecase-id="Authentication_System"] .boundary-body', [
      'ContainedActor',
      'Login',
      'Reset',
    ]);
    const tabBox = await page
      .locator('[data-usecase-id="Authentication_System"] .boundary-tab')
      .boundingBox();
    const containedBox = await element(page, 'ContainedActor').boundingBox();
    expect(tabBox).not.toBeNull();
    expect(containedBox).not.toBeNull();
    expect(containedBox!.y).toBeGreaterThanOrEqual(tabBox!.y + tabBox!.height - 1);

    await expect(edge(page, 'assocRel')).toHaveAttribute('marker-end', /pointEnd/);
    await expect(edge(page, 'assocRel')).toHaveClass(/emphasized/);
    await expect(edge(page, 'assocRel')).toHaveClass(/edge-animation-fast/);
    await expect(edge(page, 'assocRel')).toHaveAttribute(
      'aria-label',
      'association opens session from Normal User to Sign in\nsecurely'
    );
    await expect(edge(page, 'assocRel')).toHaveAttribute('style', /stroke:#2aa198/);
    await expect(edge(page, 'assocRel')).toHaveAttribute('style', /stroke-width:5px/);
    await expect(edge(page, 'assocRel')).toHaveAttribute('id', /^usecase-.+-assocRel$/);
    await expect(edge(page, 'assocRel')).toHaveAttribute('data-id', 'assocRel');
    await expect(page.locator('.edgeLabel [data-id="assocRel"] strong')).toContainText('session');
    await expect(edge(page, 'circleRel')).toHaveAttribute('marker-end', /circleEnd/);
    await expect(edge(page, 'crossRel')).toHaveAttribute('marker-end', /crossEnd/);
    await expect(edge(page, 'generalRel')).toHaveAttribute('marker-end', /extensionEnd/);
    await expect(edge(page, 'generalRel')).toHaveAttribute(
      'aria-label',
      'generalization from Awesome to Normal User'
    );
    await expect(edge(page, 'includeRel')).toHaveClass(/edge-pattern-dotted/);
    await expect(edge(page, 'includeRel')).toHaveAttribute('marker-end', /pointEnd/);
    await expect(edge(page, 'includeRel')).toHaveAttribute(
      'aria-label',
      'include from Sign in\nsecurely to Payment'
    );
    await expect(edge(page, 'extendRel')).toHaveClass(/edge-pattern-dotted/);
    await expect(edge(page, 'extendRel')).toHaveAttribute(
      'aria-label',
      'extend from Optional flow to Sign in\nsecurely'
    );
    await expect(page.locator('.edgeLabel [data-id="includeRel"]')).toContainText('include');
    await expect(page.locator('.edgeLabel [data-id="extendRel"]')).toContainText('extend');

    await expect(element(page, 'note-0')).toHaveAttribute('data-usecase-kind', 'note');
    await expect(element(page, 'note-0')).toHaveAttribute(
      'aria-label',
      'Note for Sign in\nsecurely: Requires an active session'
    );
    await expect(element(page, 'note-0').locator('strong')).toContainText('active session');
    await expect(edge(page, 'note-0-edge')).toHaveAttribute('data-usecase-kind', 'note-connector');
    await expect(edge(page, 'note-0-edge')).toHaveAttribute('aria-hidden', 'true');
    await expect(edge(page, 'note-0-edge')).toHaveClass(/edge-pattern-dotted/);
    await expect(edge(page, 'note-0-edge')).not.toHaveAttribute('marker-start');
    await expect(edge(page, 'note-0-edge')).not.toHaveAttribute('marker-end');

    await expect(element(page, 'Payload')).toHaveAttribute('data-usecase-kind', 'json');
    await expect(element(page, 'Payload')).toHaveAttribute(
      'aria-label',
      'Payload: 2: two; 1: one; colors: Red; colors: Green; address.city: Oslo; empty: {}'
    );
    await expect(element(page, 'Payload').locator('.usecase-json-border')).toHaveAttribute(
      'style',
      /fill:#eef7ff/
    );
    await expect(element(page, 'Payload').locator('.usecase-json-border')).toHaveAttribute(
      'style',
      /stroke:#123456/
    );
    await expect(element(page, 'Payload').locator('.usecase-json-title')).toContainText('Payload');
    const jsonRows = element(page, 'Payload').locator('.usecase-json-row');
    await expect(jsonRows).toHaveCount(6);
    expect(
      (await jsonRows.allTextContents()).map((text) => text.replace(/\s+/g, ' ').trim())
    ).toEqual(['2two', '1one', 'colorsRed', 'Green', 'address.cityOslo', 'empty{}']);

    await expect(element(page, 'Hostile').locator('img, script, [onerror]')).toHaveCount(0);
    await expect(page.locator('svg > title')).toContainText('Complete use case example');
    await expect(page.locator('svg > desc')).toContainText(
      'Actors interact with authentication, payment, notes, and JSON data.'
    );

    const svgFacts = await diagramSvg(page)
      .first()
      .evaluate((svgElement) => {
        const svg = svgElement as SVGSVGElement;
        const [, , viewBoxWidth, viewBoxHeight] = (svg.getAttribute('viewBox') ?? '')
          .split(/\s+/)
          .map(Number);
        const bounds = svg.getBBox();
        return {
          actorFontSize: svg.style.getPropertyValue('--mermaid-usecase-actor-font-size'),
          usecaseFontSize: svg.style.getPropertyValue('--mermaid-usecase-font-size'),
          width: svg.getAttribute('width'),
          style: svg.getAttribute('style') ?? '',
          viewBoxWidthGap: viewBoxWidth - bounds.width,
          viewBoxHeightGap: viewBoxHeight - bounds.height,
        };
      });
    expect(svgFacts.actorFontSize).toBe('21px');
    expect(svgFacts.usecaseFontSize).toBe('19px');
    expect(svgFacts.width).not.toBe('100%');
    expect(svgFacts.style).not.toMatch(/max-width/);
    expect(svgFacts.viewBoxWidthGap).toBeGreaterThanOrEqual(73);
    expect(svgFacts.viewBoxWidthGap).toBeLessThanOrEqual(75);
    expect(svgFacts.viewBoxHeightGap).toBeGreaterThanOrEqual(73);
    expect(svgFacts.viewBoxHeightGap).toBeLessThanOrEqual(75);
    await expect(element(page, 'Normal').locator('.nodeLabel p').first()).toHaveCSS(
      'font-size',
      '21px'
    );
    await expect(element(page, 'Login').locator('.nodeLabel p').first()).toHaveCSS(
      'font-size',
      '19px'
    );
    await expect(element(page, 'Normal')).toHaveAttribute('id', /-usecase-Normal$/);
  });

  test('honors max-width independently of padding and font configuration', async ({
    page,
  }, testInfo) => {
    await renderForDom(
      page,
      testInfo,
      `usecase-beta
        systemBoundary "Plain Boundary"
          actor User("Main administrator")
          Login("Sign in")
          Report[Generate report]
        end
        User --> Login
        User --> Report`,
      'usecase-max-width',
      {
        usecase: {
          actorFontSize: 18,
          actorFontFamily: 'Courier New',
          usecaseFontSize: 17,
          usecaseFontFamily: 'Georgia',
          diagramPadding: 12,
          useMaxWidth: true,
        },
      }
    );

    const svg = diagramSvg(page).first();
    await expect(svg).toHaveAttribute('width', '100%');
    await expect(svg).toHaveAttribute('style', /max-width: [\d.]+px/);
    // `max-width` is written with `attr('style', …)`, which replaces the whole attribute. The
    // configured fonts must survive that, otherwise the labels are painted in a different
    // typeface than the one they were measured in and their trailing glyphs get clipped.
    const fontFacts = await svg.evaluate((svgElement) => {
      const style = (svgElement as SVGSVGElement).style;
      return {
        actorFontSize: style.getPropertyValue('--mermaid-usecase-actor-font-size'),
        actorFontFamily: style.getPropertyValue('--mermaid-usecase-actor-font-family'),
        usecaseFontSize: style.getPropertyValue('--mermaid-usecase-font-size'),
        usecaseFontFamily: style.getPropertyValue('--mermaid-usecase-font-family'),
      };
    });
    expect(fontFacts.actorFontSize).toBe('18px');
    expect(fontFacts.actorFontFamily).toBe('Courier New');
    expect(fontFacts.usecaseFontSize).toBe('17px');
    expect(fontFacts.usecaseFontFamily).toBe('Georgia');

    const overflowingLabels = await page.evaluate(() => {
      const violations: string[] = [];
      for (const foreignObject of document.querySelectorAll('svg foreignObject')) {
        const label = foreignObject.firstElementChild as HTMLElement | null;
        if (!label) {
          continue;
        }
        const available = Math.ceil(Number(foreignObject.getAttribute('width')));
        if (label.scrollWidth > available) {
          violations.push(`"${label.textContent}" overflows its label box`);
        }
      }
      return violations;
    });
    expect(overflowingLabels).toEqual([]);

    await expect(element(page, 'Plain_Boundary')).toHaveAttribute('data-boundary-type', 'rect');
    await expect(element(page, 'Plain_Boundary')).toHaveClass(/usecase-system-boundary-rect/);
    await expect(element(page, 'Plain_Boundary').locator('.boundary-body')).not.toHaveCount(0);
    await expect(element(page, 'Plain_Boundary').locator('.boundary-tab')).toHaveCount(0);
  });

  test('renders clustered minlen relationships through the registered ELK layout', async ({
    page,
  }, testInfo) => {
    await renderForDom(
      page,
      testInfo,
      `usecase-beta
        systemBoundary "External Layout"
          actor User
          Login("Sign in")
        end
        User longEdge@---> Login`,
      'usecase-elk-minlen',
      {
        layout: 'elk',
        usecase: {
          nodeSpacing: 40,
          rankSpacing: 55,
          diagramPadding: 16,
        },
      }
    );

    await expect(element(page, 'External_Layout')).toHaveAttribute('data-boundary-type', 'rect');
    await expect(element(page, 'User')).toHaveAttribute('data-usecase-kind', 'actor');
    await expect(element(page, 'Login')).toHaveAttribute('data-usecase-kind', 'usecase');
    await expect(edge(page, 'longEdge')).toHaveAttribute('data-usecase-kind', 'relationship');
    await expect(edge(page, 'longEdge')).toHaveAttribute('marker-end', /pointEnd/);

    await expectBoxContained(page, '[data-usecase-id="External_Layout"] .boundary-body', [
      'User',
      'Login',
    ]);
  });

  test('keeps a small representative visual snapshot', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, FULL_DIAGRAM, {
      usecase: { diagramPadding: 24, useMaxWidth: true },
    });
  });

  test('keeps the complete hand-drawn rendering contract covered', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, FULL_DIAGRAM, {
      look: 'handDrawn',
      usecase: { diagramPadding: 24, useMaxWidth: true },
    });
  });

  test('keeps empty-diagram rendering covered without duplicating feature snapshots', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(page, testInfo, 'usecase-beta');
  });

  // THEMED_DIAGRAM deliberately carries no classDef/style, so every colour on screen comes
  // from a theme variable. clusterBkg (system boundary), noteBkgColor/noteBorderColor (note),
  // and the actor/use-case fills are the ones most likely to regress on a dark background.
  //
  // The two colour themes are in the list because they are the only ones that set the
  // `usecase*` role variables: on them an actor, a use case and a boundary each render in
  // their own colour, and `include` and `extend` separate by hue rather than by dash alone.
  // Every other theme leaves those variables unset and must render exactly as before.
  for (const theme of [
    'default',
    'dark',
    'forest',
    'neutral',
    'base',
    'redux-color',
    'redux-dark-color',
  ] as const) {
    test(`renders every themed element on the ${theme} theme`, async ({ page }, testInfo) => {
      await imgSnapshotTest(page, testInfo, THEMED_DIAGRAM, {
        theme,
        usecase: { diagramPadding: 24, useMaxWidth: true },
      });
    });
  }

  // The opt-in scheme: every actor, use case and boundary takes its own slot from the
  // theme's categorical palette instead of its role colour. Only the colour themes carry a
  // palette, so those are the only two where this differs from the default.
  for (const theme of ['redux-color', 'redux-dark-color'] as const) {
    test(`rotates the palette per element on the ${theme} theme`, async ({ page }, testInfo) => {
      await imgSnapshotTest(page, testInfo, THEMED_DIAGRAM, {
        theme,
        usecase: { diagramPadding: 24, useMaxWidth: true, colorScheme: 'rotate' },
      });
    });
  }
});
