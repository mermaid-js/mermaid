import { test } from '@playwright/test';

import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('packet structure', () => {
  test('should render a simple packet-beta diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `packet-beta
  title Hello world
  0-10: "hello"
`
    );
  });

  test('should render a simple packet diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `packet
  title Hello world
  0-10: "hello"
`
    );
  });

  test('should render a simple packet diagram without ranges', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `packet
  0: "h"
  1: "i"
`
    );
  });

  test('should render a complex packet diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `packet
        0-15: "Source Port"
        16-31: "Destination Port"
        32-63: "Sequence Number"
        64-95: "Acknowledgment Number"
        96-99: "Data Offset"
        100-105: "Reserved"
        106: "URG"
        107: "ACK"
        108: "PSH"
        109: "RST"
        110: "SYN"
        111: "FIN"
        112-127: "Window"
        128-143: "Checksum"
        144-159: "Urgent Pointer"
        160-191: "(Options and Padding)"
        192-223: "data"
      `
    );
  });

  test('should render a complex packet diagram with showBits false', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      title: "Packet Diagram"
      config:
        packet:
          showBits: false
      ---
      packet
        0-15: "Source Port"
        16-31: "Destination Port"
        32-63: "Sequence Number"
        64-95: "Acknowledgment Number"
        96-99: "Data Offset"
        100-105: "Reserved"
        106: "URG"
        107: "ACK"
        108: "PSH"
        109: "RST"
        110: "SYN"
        111: "FIN"
        112-127: "Window"
        128-143: "Checksum"
        144-159: "Urgent Pointer"
        160-191: "(Options and Padding)"
        192-223: "data"
      `
    );
  });
});
