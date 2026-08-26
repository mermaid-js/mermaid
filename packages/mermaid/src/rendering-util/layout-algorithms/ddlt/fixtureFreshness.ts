import { createHash } from 'node:crypto';
import type { SizesFixture } from './types.js';
import { DDLT_SIZE_CAPTURE_VERSION } from './captureContract.js';

export { DDLT_SIZE_CAPTURE_VERSION } from './captureContract.js';

export interface FixtureFreshnessOptions {
  fixtureId: string;
  mmdSource: string;
  requireMetadata?: boolean;
  /**
   * Lowest capture version this consumer can work with. Omit when any supported
   * version will do.
   */
  minCaptureVersion?: number;
  /**
   * Theme and look the caller expects the capture to have been taken at.
   *
   * Both change the measured sizes AND the shape outlines — `look: 'neo'` uses
   * different padding than `'classic'` — so a fixture captured at one
   * configuration does not describe another. Without this check a re-capture at
   * the wrong configuration moves every score in the sweep with nothing failing.
   */
  expectedTheme?: string;
  expectedLook?: string;
}

export function hashDdltFixtureSource(source: string): string {
  return createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
}

export function assertSizesFixtureFresh(
  fixture: SizesFixture,
  options: FixtureFreshnessOptions
): void {
  const metadata = fixture.metadata;
  if (!metadata) {
    if (options.requireMetadata) {
      throw new Error(
        `DDLT size fixture "${options.fixtureId}" is missing freshness metadata. ` +
          'Regenerate or annotate the fixture before relying on captured browser sizes.'
      );
    }
    return;
  }

  // A range, not an equality. Capture versions have only ever ADDED optional
  // fields, so an older fixture still describes everything it used to describe
  // and stays valid for the backends that never needed the additions. A
  // consumer that does need them asserts for itself — the ELK sweep requires
  // v2, because `measureLayoutWithFixture` cannot rebuild a shape's outline
  // without the per-node `labelBBox` that version introduced. A NEWER version
  // than this build knows about is still rejected: those fields have meanings
  // this code cannot honour.
  const captureVersion = metadata.captureVersion;
  if (
    typeof captureVersion !== 'number' ||
    captureVersion < 1 ||
    captureVersion > DDLT_SIZE_CAPTURE_VERSION
  ) {
    throw new Error(
      `unsupported DDLT size fixture "${options.fixtureId}": captureVersion ` +
        `${String(captureVersion)} is not in the supported range 1..${DDLT_SIZE_CAPTURE_VERSION}`
    );
  }
  if (options.minCaptureVersion !== undefined && captureVersion < options.minCaptureVersion) {
    throw new Error(
      `DDLT size fixture "${options.fixtureId}" is at captureVersion ${captureVersion}, ` +
        `but this consumer needs at least ${options.minCaptureVersion}. Re-capture it.`
    );
  }

  const currentSourceSha256 = hashDdltFixtureSource(options.mmdSource);
  if (metadata.sourceSha256 !== currentSourceSha256) {
    throw new Error(
      `stale DDLT size fixture "${options.fixtureId}": sourceSha256 ` +
        `${String(metadata.sourceSha256)} does not match current source ${currentSourceSha256}`
    );
  }

  assertCaptureConfig(fixture, options, 'theme', options.expectedTheme);
  assertCaptureConfig(fixture, options, 'look', options.expectedLook);
}

function assertCaptureConfig(
  fixture: SizesFixture,
  options: FixtureFreshnessOptions,
  field: 'theme' | 'look',
  expected: string | undefined
): void {
  if (expected === undefined) {
    return;
  }
  const actual = fixture.metadata?.[field];
  if (actual !== expected) {
    throw new Error(
      `DDLT size fixture "${options.fixtureId}" was captured at ${field}=${String(actual)}, ` +
        `but the sweep expects ${field}=${expected}. Re-capture with ` +
        `\`node scripts/capture-ddlt-sizes.mjs --dir <dir> --layout <layout> ` +
        `--theme <theme> --look <look>\`.`
    );
  }
}
