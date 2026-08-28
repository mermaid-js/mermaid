/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { Buffer } from 'buffer';
import type { MermaidConfig } from '../../packages/mermaid/src/config.type.js';
import { buildCaptureMetadata, writeArgosMetadataSidecar } from './argos-metadata.ts';
import { collectCoverage, startCoverage } from './coverage.js';

interface E2EConfig {
  listUrl?: boolean;
  listId?: string;
  name?: string;
  screenshot?: boolean;
  /**
   * Relative path (without extension) for the captured screenshot, mirroring how
   * the source is stored — e.g. the mmd runner passes `diagrams/<type>/<name>`
   * so the composite sheets group by diagram folder instead of the runner spec file.
   * When unset, the screenshot is written under the spec's own folder.
   */
  screenshotPath?: string;
  /** Fail when mermaid renders its syntax-error diagram instead of the requested type. Default true. */
  rejectErrorDiagram?: boolean;
  /**
   * Skip the dagre baseline pin and let the diagram choose its own layout.
   * Needed by diagrams that select ELK through their *syntax* — see
   * {@link E2E_BASELINE_LAYOUT}.
   */
  useDiagramLayout?: boolean;
}
type E2EMermaidConfig = MermaidConfig & E2EConfig;

interface CodeObject {
  code: string | string[];
  mermaid: E2EMermaidConfig;
}

export const utf8ToB64 = (str: string): string => {
  return Buffer.from(decodeURIComponent(encodeURIComponent(str))).toString('base64');
};

const batchId: string =
  'mermaid-batch-' +
  (process.env.USE_APPLI
    ? Date.now().toString()
    : (process.env.PLAYWRIGHT_COMMIT ?? Date.now().toString()));

/** Keep screenshot names within filesystem limits (ENAMETOOLONG on long test titles). */
const shortenScreenshotName = (name: string, maxLen = 180): string => {
  const sanitized = name.replace(/\s+/g, '-');
  if (sanitized.length <= maxLen) {
    return sanitized;
  }
  const hash = createHash('sha1').update(sanitized).digest('hex').slice(0, 8);
  return `${sanitized.slice(0, maxLen - 9)}-${hash}`;
};

/**
 * Layout the visual suite's screenshots were originally captured against.
 *
 * ELK is mermaid's default layout now, so without a pin every existing
 * screenshot in the suite would move at once. Pinning here rather than at the
 * ~1600 individual call sites keeps those baselines meaningful; specs that
 * exercise ELK opt in with `layout: 'elk'`, and there are dedicated ELK suites.
 *
 * Two ways a diagram picks its own layout, and how each interacts with this:
 * - Frontmatter `config.layout` is a directive, which already outranks this
 *   site-level value, so those diagrams need nothing.
 * - The diagram type itself picks one, which `flowDiagram.init` ranks BELOW a
 *   user-supplied layout — so pinning would silently override it. Those are
 *   detected by {@link selectsOwnLayout} and left unpinned.
 */
const E2E_BASELINE_LAYOUT = 'dagre';

/**
 * Diagram syntaxes that select their own layout, which the baseline pin must
 * not override.
 *
 * Two routes, both resolved in `flowDiagram.init` below a user-supplied layout:
 * the ELK detector (`flowchart-elk` / `graph-elk`), and a diagram definition's
 * own `defaultLayout` (`swimlane-beta`, via `createFlowDiagram`).
 *
 * Detected from the diagram source rather than left to each spec to remember,
 * because getting it wrong does not fail loudly — a swimlanes diagram pinned to
 * dagre still renders, just without its lanes, which in a screenshot-only test
 * means a silently wrong baseline.
 *
 * Deliberately does NOT cover `flowchart.defaultRenderer: 'elk'`: only
 * `flowDiagram.init` promotes that into the real config, so on the class/er/
 * mindmap fixtures that carry it the setting is inert and they must stay
 * pinned. Those few flowcharts that need it pass `useDiagramLayout` instead.
 */
const SELF_SELECTED_LAYOUT_RE = /^\s*(?:flowchart-elk|graph-elk|swimlane-beta)\b/m;

const selectsOwnLayout = (graphStr: string | string[]): boolean =>
  (Array.isArray(graphStr) ? graphStr : [graphStr]).some((graph) =>
    SELF_SELECTED_LAYOUT_RE.test(graph)
  );

export const mermaidUrl = (
  graphStr: string | string[],
  options: E2EMermaidConfig,
  api: boolean
): string => {
  options.handDrawnSeed = 1;
  if (!options.useDiagramLayout && !selectsOwnLayout(graphStr)) {
    options.layout ??= E2E_BASELINE_LAYOUT;
  }
  options.architecture = { seed: 1, ...(options.architecture ?? {}) };
  options.cynefin = { seed: 1, ...(options.cynefin ?? {}) };
  const codeObject: CodeObject = {
    code: graphStr,
    mermaid: options,
  };
  const objStr: string = JSON.stringify(codeObject);
  let url = `/e2e.html?graph=${utf8ToB64(objStr)}`;
  if (api && typeof graphStr === 'string') {
    url = `/xss.html?graph=${graphStr}`;
  }

  if (options.listUrl) {
    console.log(options.listId, ' ', url);
  }

  return url;
};

export const imgSnapshotTest = async (
  page: Page,
  testInfo: TestInfo,
  graphStr: string,
  _options: E2EMermaidConfig = {},
  api = false,
  validation?: any
): Promise<void> => {
  const options: E2EMermaidConfig = {
    ..._options,
    fontFamily: _options.fontFamily ?? 'courier',
    // @ts-ignore TODO: Fix type of fontSize
    fontSize: _options.fontSize ?? '16px',
    sequence: {
      ...(_options.sequence ?? {}),
      actorFontFamily: 'courier',
      noteFontFamily: _options.sequence?.noteFontFamily ?? 'courier',
      messageFontFamily: 'courier',
    },
  };

  const url: string = mermaidUrl(graphStr, options, api);
  await openURLAndVerifyRendering(page, testInfo, url, options, validation);
};

export const urlSnapshotTest = async (
  page: Page,
  testInfo: TestInfo,
  url: string,
  options: E2EMermaidConfig = {},
  _api = false,
  validation?: any
): Promise<void> => {
  await openURLAndVerifyRendering(page, testInfo, url, options, validation);
};

export const renderGraph = async (
  page: Page,
  testInfo: TestInfo,
  graphStr: string | string[],
  options: E2EMermaidConfig = {},
  api = false
): Promise<void> => {
  const url: string = mermaidUrl(graphStr, options, api);
  await openURLAndVerifyRendering(page, testInfo, url, options);
};

/** Root mermaid diagram SVG — excludes nested icon/asset SVGs (e.g. architecture services). */
export const diagramSvg = (page: Page) => page.locator('svg[aria-roledescription]');

/** Assert the page shows a real diagram, not mermaid's syntax-error fallback SVG. */
export const assertDiagramNotError = async (page: Page): Promise<void> => {
  const svg = diagramSvg(page).first();
  await expect(svg).not.toHaveAttribute('aria-roledescription', 'error');
  await expect(svg.locator('.error-icon')).toHaveCount(0);
};

export const openURLAndVerifyRendering = async (
  page: Page,
  testInfo: TestInfo,
  url: string,
  { screenshot = true, rejectErrorDiagram = true, ...options }: E2EMermaidConfig,
  validation?: any
): Promise<void> => {
  const name: string = shortenScreenshotName(options.name ?? testInfo.titlePath.join(' '));

  // Capture browser-side errors so a render failure reports the real cause
  // instead of a bare "svg not visible" timeout.
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(`[pageerror] ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[console.error] ${msg.text()}`);
    }
  });

  await startCoverage(page);
  await page.goto(url);

  // Prefer the explicit rendered flag from viewer.js; fall back to SVG visibility.
  try {
    await page.waitForFunction(() => (window as any).rendered === true, undefined, {
      timeout: 5_000,
    });
  } catch {
    try {
      await diagramSvg(page).first().waitFor({ state: 'visible', timeout: 15_000 });
    } catch (error) {
      const details = [...pageErrors, ...consoleErrors];
      if (details.length > 0) {
        throw new Error(
          `Diagram did not render (window.rendered never set, no SVG). Browser errors:\n${details.join('\n')}`
        );
      }
      throw error;
    }
  }

  // xssAttack() throws after injecting #the-malware and still leaves an SVG, so a
  // catch-only check misses it. Do not fail on every pageerror: error-diagram
  // tests and "render after error" cases throw mermaid parse errors on purpose.
  const xssErrors = pageErrors.filter((msg) => msg.includes('XSS Succeeded'));
  if (xssErrors.length > 0) {
    throw new Error(`XSS payload executed during render:\n${xssErrors.join('\n')}`);
  }

  if (options.securityLevel === 'sandbox') {
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    if (validation) {
      await validation(iframe);
    }
  } else {
    const svg = diagramSvg(page).first();
    await expect(svg).toBeVisible();
    await expect(svg).not.toHaveAttribute('viewbox'); // cspell:ignore viewbox

    if (rejectErrorDiagram) {
      await assertDiagramNotError(page);
    }

    if (validation) {
      await validation(svg);
    }
  }

  if (screenshot) {
    await verifyScreenshot(page, testInfo, name, options.screenshotPath, url);
  }

  await collectCoverage(page, testInfo);
};

export const verifyScreenshot = async (
  page: Page,
  testInfo: TestInfo,
  name: string,
  screenshotPath?: string,
  pageUrl?: string
): Promise<void> => {
  const useAppli = !!process.env.USE_APPLI;
  const useArgos = process.env.RUN_VISUAL_TEST === 'true';

  // Capture only the rendered diagram SVG so each screenshot is a tight crop of
  // the diagram rather than the whole viewport (mostly empty space). Fall back
  // to the full page when there is no top-level diagram SVG — e.g. sandboxed
  // diagrams (the SVG lives in an iframe) and the iife/xss/external-diagram tests.
  const svg = diagramSvg(page).first();
  const hasSvg = (await svg.count()) > 0;
  const target = hasSvg ? svg : page;

  if (useAppli) {
    // Mirrors the Cypress eyes integration: one Applitools batch per spec file,
    // a check per screenshot scoped to the diagram SVG (full window when there
    // is none). API key, branch, and parent branch are read from the APPLITOOLS_*
    // env vars by the SDK. Imported lazily so the SDK is only loaded for
    // Applitools runs, not for Argos/local snapshot runs.
    const { Eyes, ClassicRunner, Target } = await import('@applitools/eyes-playwright');
    const specName = basename(testInfo.file);
    const eyes = new Eyes(new ClassicRunner());
    eyes.setConfiguration({
      appName: 'Mermaid',
      batch: { id: batchId + specName, name: specName },
    });
    await eyes.open(page, 'Mermaid', name);
    await eyes.check(
      'Click!',
      hasSvg ? Target.region('svg[aria-roledescription]') : Target.window().fully()
    );
    await eyes.close(true);
    return;
  }

  if (useArgos) {
    // Capture a native PNG; a dedicated CI job composites these into sheets
    // (grouped by folder) and uploads them once.
    const screenshotDir = process.env.SCREENSHOT_DIR ?? 'e2e/screenshots';
    const sanitizeSegment = (segment: string) =>
      segment.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
    let outPath: string;
    if (screenshotPath) {
      // Mirror the source's storage path (e.g. diagrams/<type>/<name>) so the
      // sheets group by that folder rather than the runner spec file.
      const safeSubpath = screenshotPath.split('/').map(sanitizeSegment).join('/');
      outPath = join(screenshotDir, `${safeSubpath}.png`);
    } else {
      // `name` carries the spec path + test title and may contain characters
      // GitHub artifacts reject (" : < > | * ?) or path separators; flatten it to
      // a safe slug. The spec folder lives in specRelPath, which the batch job
      // groups by, so the filename only needs to be unique within the spec.
      const specRelPath = relative(testInfo.project.testDir, testInfo.file).split(sep).join('/');
      outPath = join(screenshotDir, specRelPath, `${sanitizeSegment(name)}.png`);
    }
    mkdirSync(dirname(outPath), { recursive: true });
    const buffer = await target.screenshot({ animations: 'disabled', scale: 'device' });
    writeFileSync(outPath, buffer);
    await writeArgosMetadataSidecar(
      outPath,
      buildCaptureMetadata({
        testInfo,
        screenshotPath,
        url: pageUrl ?? page.url(),
      })
    );
  } else {
    const snapshotName = `${name}.png`;
    const snapshotPath = testInfo.snapshotPath(snapshotName, { kind: 'screenshot' });

    if (!existsSync(snapshotPath)) {
      mkdirSync(dirname(snapshotPath), { recursive: true });
      const screenshot = await target.screenshot({ animations: 'disabled', scale: 'device' });
      writeFileSync(snapshotPath, screenshot);
      return;
    }

    await expect(target).toHaveScreenshot(snapshotName);
  }
};

/**
 * Asserts that no element ID appears more than once in the current document.
 */
export const assertNoDuplicateIds = async (page: Page): Promise<void> => {
  const duplicates = await page.evaluate(() => {
    const allElements = document.querySelectorAll('[id]');
    const idCounts: Record<string, number> = {};
    for (const el of allElements) {
      const id = el.getAttribute('id')!;
      idCounts[id] = (idCounts[id] || 0) + 1;
    }
    return Object.entries(idCounts).filter(([, count]) => count > 1);
  });

  expect(
    duplicates,
    `Duplicate IDs found: ${duplicates.map(([id, n]) => `${id} (${n}x)`).join(', ')}`
  ).toHaveLength(0);
};

export const verifyNumber = (value: number, expected: number, deltaPercent = 10): void => {
  const low = expected * (1 - deltaPercent / 100);
  const high = expected * (1 + deltaPercent / 100);
  expect(value).toBeGreaterThanOrEqual(low);
  expect(value).toBeLessThanOrEqual(high);
};
