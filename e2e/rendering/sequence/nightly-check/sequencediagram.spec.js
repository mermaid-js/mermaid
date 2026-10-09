import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../../helpers/util.ts';

test.describe('Sequence diagram', () => {
  // These verify that an in-diagram %%{init}%% directive overrides the site
  // config passed via imgSnapshotTest's 4th arg (mermaid.initialize()). Kept in
  // TS — a fixture (frontmatter only, no initialize()) can't exercise
  // directive-over-initialize precedence. Neither test has an assertion beyond
  // the render itself; the precedence testing is what blocks conversion here,
  // not an assertion to drop.
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
    // Not convertible even ignoring the assertions below: this test .click()s
    // an element twice to toggle a popup open/closed, which is interactive
    // behavior a static screenshot fixture can't express.
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
    // No assertion follows either render; precedence testing is the blocker.
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
  });

  test.describe('render after error', () => {
    // Blocked by two things, not just the lack of an assertion (there isn't
    // one here to drop): `rejectErrorDiagram: false` is a JS-test-harness-only
    // flag the fixture runner's fixed call site never sets (same blocker as
    // errorDiagram.spec.ts), and the first of the two array diagrams
    // deliberately errors (a typo'd `destroy Bo`) — the whole point of the
    // test is recovering from that error on the second render, which a
    // fixture (one diagram, no sequencing) can't express. The second diagram
    // alone (no typo) is actually valid and could become its own new fixture,
    // but that would be unrelated to what this test verifies.
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
