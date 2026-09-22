import { createHash } from 'node:crypto';
import type { SizesFixture } from './types.js';
import { DDLT_SIZE_CAPTURE_VERSION } from './captureContract.js';

export { DDLT_SIZE_CAPTURE_VERSION } from './captureContract.js';

export interface FixtureFreshnessOptions {
  fixtureId: string;
  mmdSource: string;
  requireMetadata?: boolean;
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

  if (metadata.captureVersion !== DDLT_SIZE_CAPTURE_VERSION) {
    throw new Error(
      `unsupported DDLT size fixture "${options.fixtureId}": captureVersion ` +
        `${String(metadata.captureVersion)} does not match ${DDLT_SIZE_CAPTURE_VERSION}`
    );
  }

  const currentSourceSha256 = hashDdltFixtureSource(options.mmdSource);
  if (metadata.sourceSha256 !== currentSourceSha256) {
    throw new Error(
      `stale DDLT size fixture "${options.fixtureId}": sourceSha256 ` +
        `${String(metadata.sourceSha256)} does not match current source ${currentSourceSha256}`
    );
  }
}
