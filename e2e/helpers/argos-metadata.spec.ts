import { describe, it, expect } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  annotationFromScreenshotRelPath,
  annotateTilePosition,
  argosMetadataSidecarPath,
  buildCaptureMetadata,
  buildSheetMetadata,
  formatTileTitle,
} from './argos-metadata.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('argos-metadata', () => {
  it('maps mmd snapshot PNG paths to fixture annotations', () => {
    expect(
      annotationFromScreenshotRelPath('diagrams/packet/should-render-a-simple-packet-diagram.png')
    ).toStrictEqual({
      type: 'mmd-fixture',
      description: 'e2e/diagrams/packet/should-render-a-simple-packet-diagram.mmd',
      location: {
        file: 'e2e/diagrams/packet/should-render-a-simple-packet-diagram.mmd',
        line: 1,
        column: 1,
      },
    });
  });

  it('maps spec-based PNG paths to test annotations', () => {
    expect(
      annotationFromScreenshotRelPath('rendering/flowchart/flowchart.spec.js/a-test.png')
    ).toStrictEqual({
      type: 'test',
      description: 'rendering/flowchart/flowchart.spec.js › a test',
      location: { file: 'e2e/rendering/flowchart/flowchart.spec.js', line: 1, column: 1 },
    });
  });

  it('builds capture metadata with mmd and runner test annotations', () => {
    const meta = buildCaptureMetadata({
      testInfo: {
        title: 'should render foo',
        titlePath: ['mmd snapshots', 'packet', 'should render foo'],
        file: join(repoRoot, 'e2e/rendering/mmd-snapshots.spec.ts'),
        line: 26,
        column: 5,
      } as never,
      screenshotPath: 'diagrams/packet/should-render-foo',
      url: 'http://localhost/e2e.html?graph=abc',
    });

    expect(meta.url).toBe('http://localhost/e2e.html?graph=abc');
    expect(meta.test?.annotations).toStrictEqual([
      {
        type: 'mmd-fixture',
        description: 'e2e/diagrams/packet/should-render-foo.mmd',
        location: { file: 'e2e/diagrams/packet/should-render-foo.mmd', line: 1, column: 1 },
      },
      {
        type: 'test',
        description: 'mmd snapshots › packet › should render foo',
        location: { file: 'e2e/rendering/mmd-snapshots.spec.ts', line: 26, column: 5 },
      },
    ]);
    expect(meta.automationLibrary.name).toBe('playwright');
    expect(meta.sdk.name).toBe('@argos-ci/cli');
  });

  it('builds sheet metadata with one annotation per tile', () => {
    const meta = buildSheetMetadata({
      group: 'diagrams/packet',
      sheetBasename: 'packet-001',
      tileAnnotations: [
        {
          type: 'tile',
          description: 'R1 C1: e2e/diagrams/packet/a.mmd',
          location: { file: 'e2e/diagrams/packet/a.mmd', line: 1, column: 1 },
        },
      ],
    });
    expect(meta.test?.titlePath).toStrictEqual(['diagrams/packet', 'packet-001']);
    expect(meta.test?.annotations).toHaveLength(1);
  });

  it('prefixes tile grid coordinates onto annotations', () => {
    expect(
      annotateTilePosition(0, 2, {
        type: 'mmd-fixture',
        description: 'e2e/diagrams/flowchart/foo.mmd',
      })
    ).toStrictEqual({
      type: 'tile',
      description: 'R1 C3: e2e/diagrams/flowchart/foo.mmd',
    });
  });

  it('uses the Argos sidecar naming convention', () => {
    expect(argosMetadataSidecarPath('/tmp/foo.png')).toBe('/tmp/foo.png.argos.json');
  });

  it('restores hyphenated screenshot slugs to titles', () => {
    expect(formatTileTitle('1-should-render-a-basic-treemap')).toBe(
      '1 should render a basic treemap'
    );
  });
});
