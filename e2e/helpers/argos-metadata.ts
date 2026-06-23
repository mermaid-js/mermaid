import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { TestInfo } from '@playwright/test';

export const ARGOS_METADATA_SCHEMA = 'https://api.argos-ci.com/v2/screenshot-metadata.json';

const SPEC_SEGMENT_RE = /\.spec\.[cm]?[jt]s$/;

const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(moduleDir, '../..');
const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as {
  devDependencies: Record<string, string>;
};

const playwrightVersion =
  pkg.devDependencies['@playwright/test']?.replace(/^[<=>^~]*/, '') ?? 'unknown';
const argosCliVersion = pkg.devDependencies['@argos-ci/cli']?.replace(/^[<=>^~]*/, '') ?? 'unknown';

export interface ArgosLocation {
  file: string;
  line: number;
  column: number;
}

export interface ArgosTestAnnotation {
  type: string;
  description: string;
  location?: ArgosLocation;
}

export interface ArgosScreenshotMetadata {
  $schema?: string;
  url?: string;
  test?: {
    title: string;
    titlePath?: string[];
    location?: ArgosLocation;
    annotations?: ArgosTestAnnotation[];
  };
  automationLibrary: { name: string; version: string };
  sdk: { name: string; version: string };
}

const baseMetadata = (): Pick<ArgosScreenshotMetadata, 'automationLibrary' | 'sdk'> => ({
  automationLibrary: { name: 'playwright', version: playwrightVersion },
  sdk: { name: '@argos-ci/cli', version: argosCliVersion },
});

/** Companion metadata path for a screenshot PNG (Argos sidecar convention). */
export function argosMetadataSidecarPath(pngPath: string): string {
  return `${pngPath}.argos.json`;
}

/** Repo-relative path (forward slashes), e.g. `e2e/rendering/foo.spec.js`. */
export function repoRelativePath(absPath: string): string {
  return relative(repoRoot, absPath).split(sep).join('/');
}

/** Restore spaces from sanitized Playwright / Cypress screenshot slugs. */
export function formatTileTitle(name: string): string {
  return name.replace(/-/g, ' ');
}

/**
 * Infer the diagram fixture or spec test that produced an argos-screenshots
 * relative PNG path (no leading `e2e/argos-screenshots/`).
 */
export function annotationFromScreenshotRelPath(relPath: string): ArgosTestAnnotation {
  const withoutExt = relPath.replace(/\.png$/i, '');

  if (withoutExt.startsWith('diagrams/')) {
    const mmdFile = `e2e/${withoutExt}.mmd`;
    return {
      type: 'mmd-fixture',
      description: mmdFile,
      location: { file: mmdFile, line: 1, column: 1 },
    };
  }

  const parts = withoutExt.split('/');
  const specIdx = parts.findIndex((p) => SPEC_SEGMENT_RE.test(p));
  if (specIdx >= 0 && specIdx < parts.length - 1) {
    const specRel = parts.slice(0, specIdx + 1).join('/');
    const testSlug = parts[parts.length - 1]!;
    const specFile = `e2e/${specRel}`;
    const title = formatTileTitle(testSlug);
    return {
      type: 'test',
      description: `${specRel} › ${title}`,
      location: { file: specFile, line: 1, column: 1 },
    };
  }

  return {
    type: 'screenshot',
    description: withoutExt,
  };
}

export interface BuildCaptureMetadataOptions {
  testInfo: TestInfo;
  /** mmd runner passes `diagrams/<type>/<name>` (no extension). */
  screenshotPath?: string;
  url?: string;
}

/** Metadata written beside each per-test PNG under e2e/argos-screenshots. */
export function buildCaptureMetadata(
  options: BuildCaptureMetadataOptions
): ArgosScreenshotMetadata {
  const { testInfo, screenshotPath, url } = options;
  const specFile = repoRelativePath(testInfo.file);
  const annotations: ArgosTestAnnotation[] = [];

  if (screenshotPath?.startsWith('diagrams/')) {
    annotations.push({
      type: 'mmd-fixture',
      description: `e2e/${screenshotPath}.mmd`,
      location: { file: `e2e/${screenshotPath}.mmd`, line: 1, column: 1 },
    });
  }

  annotations.push({
    type: 'test',
    description: testInfo.titlePath.join(' › '),
    location: {
      file: specFile,
      line: testInfo.line,
      column: testInfo.column,
    },
  });

  return {
    $schema: ARGOS_METADATA_SCHEMA,
    ...(url ? { url } : {}),
    test: {
      title: testInfo.title,
      titlePath: [...testInfo.titlePath],
      location: {
        file: specFile,
        line: testInfo.line,
        column: testInfo.column,
      },
      annotations,
    },
    ...baseMetadata(),
  };
}

export interface BuildSheetMetadataOptions {
  group: string;
  sheetBasename: string;
  tileAnnotations: ArgosTestAnnotation[];
}

/** Metadata written beside each composite sheet PNG under e2e/argos-sheets. */
export function buildSheetMetadata(options: BuildSheetMetadataOptions): ArgosScreenshotMetadata {
  const { group, sheetBasename, tileAnnotations } = options;
  return {
    $schema: ARGOS_METADATA_SCHEMA,
    test: {
      title: sheetBasename,
      titlePath: [group, sheetBasename],
      annotations: tileAnnotations,
    },
    automationLibrary: { name: 'playwright', version: playwrightVersion },
    sdk: { name: '@argos-ci/cli', version: argosCliVersion },
  };
}

/** Prefix a tile annotation with its grid cell for sheet-level metadata. */
export function annotateTilePosition(
  row: number,
  col: number,
  annotation: ArgosTestAnnotation
): ArgosTestAnnotation {
  return {
    ...annotation,
    type: 'tile',
    description: `R${row + 1} C${col + 1}: ${annotation.description}`,
  };
}

/** Read a tile's sidecar if present; otherwise infer from the PNG path. */
export function readTileAnnotation(inputDir: string, source: string): ArgosTestAnnotation {
  const sidecarPath = join(inputDir, argosMetadataSidecarPath(source));
  try {
    const meta = JSON.parse(readFileSync(sidecarPath, 'utf8')) as ArgosScreenshotMetadata;
    const fixture = meta.test?.annotations?.find((a) => a.type === 'mmd-fixture');
    if (fixture) {
      return fixture;
    }
    const testAnnotation = meta.test?.annotations?.find((a) => a.type === 'test');
    if (testAnnotation) {
      return testAnnotation;
    }
    if (meta.test?.title) {
      return {
        type: 'test',
        description: meta.test.titlePath?.join(' › ') ?? meta.test.title,
        location: meta.test.location,
      };
    }
  } catch {
    // Fall back to path inference when no sidecar exists (older artifacts).
  }
  return annotationFromScreenshotRelPath(source);
}

export function writeArgosMetadataSidecar(
  pngPath: string,
  metadata: ArgosScreenshotMetadata
): void {
  writeFileSync(argosMetadataSidecarPath(pngPath), `${JSON.stringify(metadata, null, 2)}\n`);
}
