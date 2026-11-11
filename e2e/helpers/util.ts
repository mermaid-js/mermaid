/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { expect, type ConsoleMessage, type Page, type TestInfo } from '@playwright/test';
import { Buffer } from 'buffer';
import type { MermaidConfig } from '../../packages/mermaid/src/config.type.js';
import { applitoolsBatch, applitoolsTestName } from './applitools.ts';
import { buildCaptureMetadata, writeArgosMetadataSidecar } from './argos-metadata.ts';
import { collectCoverage, flushCoverage, startCoverage } from './coverage.js';

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
}
export type E2EMermaidConfig = MermaidConfig & E2EConfig;

interface CodeObject {
  code: string | string[];
  mermaid: E2EMermaidConfig;
}

export const utf8ToB64 = (str: string): string => {
  return Buffer.from(decodeURIComponent(encodeURIComponent(str))).toString('base64');
};

/** Keep screenshot names within filesystem limits (ENAMETOOLONG on long test titles). */
const shortenScreenshotName = (name: string, maxLen = 180): string => {
  const sanitized = name.replace(/\s+/g, '-');
  if (sanitized.length <= maxLen) {
    return sanitized;
  }
  const hash = createHash('sha1').update(sanitized).digest('hex').slice(0, 8);
  return `${sanitized.slice(0, maxLen - 9)}-${hash}`;
};

export const mermaidUrl = (
  graphStr: string | string[],
  options: E2EMermaidConfig,
  api: boolean
): string => {
  options.handDrawnSeed = 1;
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

const withE2EDefaults = (options: E2EMermaidConfig): E2EMermaidConfig => ({
  ...options,
  fontFamily: options.fontFamily ?? 'courier',
  // @ts-ignore TODO: Fix type of fontSize
  fontSize: options.fontSize ?? '16px',
  sequence: {
    ...(options.sequence ?? {}),
    actorFontFamily: 'courier',
    noteFontFamily: options.sequence?.noteFontFamily ?? 'courier',
    messageFontFamily: 'courier',
  },
});

export const imgSnapshotTest = async (
  page: Page,
  testInfo: TestInfo,
  graphStr: string,
  _options: E2EMermaidConfig = {},
  api = false,
  validation?: any
): Promise<void> => {
  const options = withE2EDefaults(_options);
  const url: string = mermaidUrl(graphStr, options, api);
  await openURLAndVerifyRendering(page, testInfo, url, options, validation);
};

/**
 * Renders into an already-open `e2e.html` page instead of navigating, so a worker
 * can reuse one page (and its loaded bundles) across tests.
 */
export const renderInPage = async (
  page: Page,
  testInfo: TestInfo,
  graphStr: string,
  _options: E2EMermaidConfig = {}
): Promise<void> => {
  const options = withE2EDefaults(_options);
  const url = mermaidUrl(graphStr, options, false);
  const errors = captureBrowserErrors(page);
  try {
    await page.evaluate((graphObj) => (window as any).renderGraph(graphObj), {
      code: graphStr,
      mermaid: options,
    });
    await verifyRendering(page, testInfo, url, options, errors);
  } finally {
    errors.stop();
  }
  // A screenshot of an element larger than the viewport resizes it temporarily, which
  // shifts text layout in later renders on the same page until it reloads.
  const box = await diagramSvg(page).first().boundingBox();
  const viewport = page.viewportSize();
  if (
    box &&
    viewport &&
    (box.x + box.width > viewport.width || box.y + box.height > viewport.height)
  ) {
    await flushCoverage(page);
    await page.reload();
    await waitForRenderGraph(page);
  }
};

export const waitForRenderGraph = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => typeof (window as any).renderGraph === 'function');
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

interface BrowserErrors {
  pageErrors: string[];
  consoleErrors: string[];
  stop: () => void;
}

// Capture browser-side errors so a render failure reports the real cause
// instead of a bare "svg not visible" timeout.
const captureBrowserErrors = (page: Page): BrowserErrors => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const onPageError = (error: Error) => pageErrors.push(`[pageerror] ${error.message}`);
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[console.error] ${msg.text()}`);
    }
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  return {
    pageErrors,
    consoleErrors,
    stop: () => {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
    },
  };
};

export const openURLAndVerifyRendering = async (
  page: Page,
  testInfo: TestInfo,
  url: string,
  options: E2EMermaidConfig,
  validation?: any
): Promise<void> => {
  const errors = captureBrowserErrors(page);
  await startCoverage(page);
  await page.goto(url);
  await verifyRendering(page, testInfo, url, options, errors, validation);
  await collectCoverage(page);
};

const verifyRendering = async (
  page: Page,
  testInfo: TestInfo,
  url: string,
  { screenshot = true, rejectErrorDiagram = true, ...options }: E2EMermaidConfig,
  { pageErrors, consoleErrors }: BrowserErrors,
  validation?: any
): Promise<void> => {
  const name: string = shortenScreenshotName(options.name ?? testInfo.titlePath.join(' '));

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
  const specRelPath = relative(testInfo.project.testDir, testInfo.file).split(sep).join('/');

  if (useAppli) {
    // One Applitools batch per diagram folder or spec file, a check per screenshot
    // scoped to the diagram SVG (full window when there is none). API key, branch,
    // and parent branch are read from the APPLITOOLS_* env vars by the SDK.
    // Imported lazily so the SDK is only loaded for Applitools runs.
    const { Eyes, ClassicRunner, Target } = await import('@applitools/eyes-playwright');
    const runId = process.env.APPLITOOLS_BATCH_ID;
    if (!runId) {
      throw new Error(
        'APPLITOOLS_BATCH_ID is unset; playwright.config.ts should seed it for USE_APPLI runs'
      );
    }
    const eyes = new Eyes(new ClassicRunner());
    eyes.setConfiguration({
      appName: 'Mermaid',
      batch: applitoolsBatch(runId, specRelPath, screenshotPath),
    });
    await eyes.open(page, 'Mermaid', applitoolsTestName(name, specRelPath, screenshotPath));
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
