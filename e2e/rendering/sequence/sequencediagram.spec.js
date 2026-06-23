import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Sequence diagram', () => {
  test('should render a sequence diagram with boxes', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    sequenceDiagram
      box LightGrey Alice and Bob
      participant Alice
      participant Bob
      end
      participant John as John<br/>Second Line
      Alice ->> Bob: Hello Bob, how are you?
      Bob-->>John: How about you John?
      Bob--x Alice: I am good thanks!
      Bob-x John: I am good thanks!
      Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
      Bob-->Alice: Checking with John...
      alt either this
        Alice->>John: Yes
        else or this
        Alice->>John: No
        else or this will happen
        Alice->John: Maybe
      end
      par this happens in parallel
      Alice -->> Bob: Parallel message 1
      and
      Alice -->> John: Parallel message 2
      end
    `,
      { sequence: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(830 * 0.95);
    expect(width).toBeLessThanOrEqual(830 * 1.05);
    await expect(svg).not.toHaveAttribute('style');
  });

  test.describe('auth width scaling', () => {
    test('should have actor-top and actor-bottom classes on top and bottom actor box and symbol and actor-box and actor-man classes for text tags', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          actor Bob
          Alice->>Bob: Hi Bob
          Bob->>Alice: Hi Alice
      `,
        {}
      );
      await expect(page.locator('.actor.actor-top')).not.toHaveCount(0);
      await expect(page.locator('.actor-man.actor-top')).not.toHaveCount(0);
      await expect(page.locator('.actor.actor-top')).not.toHaveClass(/actor-bottom/);
      await expect(page.locator('.actor-man.actor-top')).not.toHaveClass(/actor-bottom/);
      await expect(page.locator('.actor.actor-bottom')).not.toHaveCount(0);
      await expect(page.locator('.actor-man.actor-bottom')).not.toHaveCount(0);
      await expect(page.locator('.actor.actor-bottom')).not.toHaveClass(/actor-top/);
      await expect(page.locator('.actor-man.actor-bottom')).not.toHaveClass(/actor-top/);
      await expect(page.locator('text.actor-box').first()).toContainText('Alice');
      await expect(page.locator('text.actor-box').last()).toContainText('Alice');
      await expect(page.locator('text.actor-man').first()).toContainText('Bob');
      await expect(page.locator('text.actor-man').last()).toContainText('Bob');
    });
  });

  // These verify that an in-diagram %%{init}%% directive overrides the site
  // config passed via imgSnapshotTest's 4th arg (mermaid.initialize()). Kept in
  // TS — a fixture (frontmatter only, no initialize()) can't exercise
  // directive-over-initialize precedence.
  test.describe('directives', () => {
    test('should override config with directive settings', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": true }}}%%
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: config set to mirrorActors: false<br/>directive set to mirrorActors: true
        Bob->>Alice: Short as well
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: false, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
    test('should override config with directive settings 2', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": false, "wrap": true }}}%%
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: config: mirrorActors=true<br/>directive: mirrorActors=false
        Bob->>Alice: Short as well
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: true, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
  });

  test.describe('links', () => {
    test('should support actor links', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        link Alice: Dashboard @ https://dashboard.contoso.com/alice
        link Alice: Wiki @ https://wiki.contoso.com/alice
        link John: Dashboard @ https://dashboard.contoso.com/john
        link John: Wiki @ https://wiki.contoso.com/john
        Alice->>John: Hello John<br/>
        John-->>Alice: Great<br/><br/>day!
      `,
        { securityLevel: 'loose' }
      );
      await page.locator('#root-0').click();
      await expect(page.locator('#actor0_popup')).toHaveAttribute('style', 'display: block;');
      await page.locator('#root-0').click();
      await expect(page.locator('#actor0_popup')).toHaveAttribute('style', 'display: none;');
    });

    // The %%{init}%% directive (forceMenus / hideUnusedParticipants) overrides the
    // initialize() config passed as the 4th arg — kept in TS for that precedence.
    test('should support actor links and properties EXPERIMENTAL: USE WITH CAUTION', async ({
      page,
    }, testInfo) => {
      //Be aware that the syntax for "properties" is likely to be changed.
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": true, "forceMenus": true }}}%%
        sequenceDiagram
        participant a as Alice
        participant j as John
        note right of a: Hello world!
        properties a: {"class": "internal-service-actor", "type": "@clock"}
        properties j: {"class": "external-service-actor", "type": "@computer"}
        links a: {"Repo": "https://www.contoso.com/repo", "Swagger": "https://www.contoso.com/swagger"}
        links j: {"Repo": "https://www.contoso.com/repo"}
        links a: {"Dashboard": "https://www.contoso.com/dashboard", "On-Call": "https://www.contoso.com/oncall"}
        link a: Contacts @ https://contacts.contoso.com/?contact=alice@contoso.com
        a->>j: Hello John, how are you?
        j-->>a: Great!
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: true, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
    test('should support actor links and properties when not mirrored EXPERIMENTAL: USE WITH CAUTION', async ({
      page,
    }, testInfo) => {
      //Be aware that the syntax for "properties" is likely to be changed.
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": false, "forceMenus": true, "wrap": true }}}%%
        sequenceDiagram
        participant a as Alice
        participant j as John
        note right of a: Hello world!
        properties a: {"class": "internal-service-actor", "type": "@clock"}
        properties j: {"class": "external-service-actor", "type": "@computer"}
        links a: {"Repo": "https://www.contoso.com/repo", "Swagger": "https://www.contoso.com/swagger"}
        links j: {"Repo": "https://www.contoso.com/repo"}
        links a: {"Dashboard": "https://www.contoso.com/dashboard", "On-Call": "https://www.contoso.com/oncall"}
        a->>j: Hello John, how are you?
        j-->>a: Great!
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: false, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
    test("shouldn't display unused participants", async ({ page }, testInfo) => {
      //Be aware that the syntax for "properties" is likely to be changed.
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "sequence": {"hideUnusedParticipants": true }}}}%%
        sequenceDiagram
        participant a
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: false, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
  });
  test.describe('svg size', () => {
    test('should render a sequence diagram when useMaxWidth is true (default)', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        participant Alice
        participant Bob
        participant John as John<br/>Second Line
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
          else or this
          Alice->>John: No
          else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
        Alice -->> Bob: Parallel message 1
        and
        Alice -->> John: Parallel message 2
        end
      `,
        { sequence: { useMaxWidth: true } }
      );
      const svg = page.locator('svg');
      await expect(svg).toHaveAttribute('width', '100%');
      const style = await svg.getAttribute('style');
      expect(style).toMatch(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).toBeGreaterThanOrEqual(820 * 0.95);
      expect(maxWidthValue).toBeLessThanOrEqual(820 * 1.05);
    });
    test('should render a sequence diagram when useMaxWidth is false', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        participant Alice
        participant Bob
        participant John as John<br/>Second Line
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
          else or this
          Alice->>John: No
          else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
        Alice -->> Bob: Parallel message 1
        and
        Alice -->> John: Parallel message 2
        end
      `,
        { sequence: { useMaxWidth: false } }
      );
      const svg = page.locator('svg');
      const width = parseFloat((await svg.getAttribute('width')) ?? '0');
      expect(width).toBeGreaterThanOrEqual(820 * 0.95);
      expect(width).toBeLessThanOrEqual(820 * 1.05);
      await expect(svg).not.toHaveAttribute('style');
    });
  });
  test.describe('render after error', () => {
    test('should render diagram after fixing destroy participant error', async ({
      page,
    }, testInfo) => {
      page.on('pageerror', () => {
        // ignore expected render errors while recovering
      });

      await renderGraph(
        page,
        testInfo,
        [
          `sequenceDiagram
    Alice->>Bob: Hello Bob, how are you ?
    Bob->>Alice: Fine, thank you. And you?
    create participant Carl
    Alice->>Carl: Hi Carl!
    create actor D as Donald
    Carl->>D: Hi!
    destroy Carl
    Alice-xCarl: We are too many
    destroy Bo
    Bob->>Alice: I agree`,
          `sequenceDiagram
    Alice->>Bob: Hello Bob, how are you ?
    Bob->>Alice: Fine, thank you. And you?
    create participant Carl
    Alice->>Carl: Hi Carl!
    create actor D as Donald
    Carl->>D: Hi!
    destroy Carl
    Alice-xCarl: We are too many
    destroy Bob
    Bob->>Alice: I agree`,
        ],
        { rejectErrorDiagram: false }
      );
    });
  });
});
