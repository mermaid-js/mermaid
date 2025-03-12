import { it, describe, expect } from 'vitest';
import { db } from './db.js';
import { parser } from './parser.js';

const { clear, getPacket, getDiagramTitle, getAccTitle, getAccDescription } = db;

describe('packet diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a packet-beta definition', async () => {
    const str = `packet-beta`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot('[]');
  });

  it('should handle diagram with data and title', async () => {
    const str = `packet-beta
    title Packet diagram
    accTitle: Packet accTitle
    accDescr: Packet accDescription
    0-10: "test"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getDiagramTitle()).toMatchInlineSnapshot('"Packet diagram"');
    expect(getAccTitle()).toMatchInlineSnapshot('"Packet accTitle"');
    expect(getAccDescription()).toMatchInlineSnapshot('"Packet accDescription"');
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 10,
            "label": "test",
            "start": 0,
          },
        ],
      ]
    `);
  });

  it('should handle single bits', async () => {
    const str = `packet-beta
    0-10: "test"
    11: "single"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 10,
            "label": "test",
            "start": 0,
          },
          {
            "end": 11,
            "label": "single",
            "start": 11,
          },
        ],
      ]
    `);
  });

  it('should split into multiple rows', async () => {
    const str = `packet-beta
    0-10: "test"
    11-90: "multiple"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 10,
            "label": "test",
            "start": 0,
          },
          {
            "end": 31,
            "label": "multiple",
            "start": 11,
          },
        ],
        [
          {
            "end": 63,
            "label": "multiple",
            "start": 32,
          },
        ],
        [
          {
            "end": 90,
            "label": "multiple",
            "start": 64,
          },
        ],
      ]
    `);
  });

  it('should split into multiple rows when cut at exact length', async () => {
    const str = `packet-beta
    0-16: "test"
    17-63: "multiple"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "end": 16,
            "label": "test",
            "start": 0,
          },
          {
            "end": 31,
            "label": "multiple",
            "start": 17,
          },
        ],
        [
          {
            "end": 63,
            "label": "multiple",
            "start": 32,
          },
        ],
      ]
    `);
  });

  it('should throw error if numbers are not continuous', async () => {
    const str = `packet-beta
    0-16: "test"
    18-20: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 18 - 20 is not contiguous. It should start from 17.]`
    );
  });

  it('should throw error if numbers are not continuous for single packets', async () => {
    const str = `packet-beta
    0-16: "test"
    18: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 18 - 18 is not contiguous. It should start from 17.]`
    );
  });

  it('should throw error if numbers are not continuous for single packets - 2', async () => {
    const str = `packet-beta
    0-16: "test"
    17: "good"
    19: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 19 - 19 is not contiguous. It should start from 18.]`
    );
  });

  it('should throw error if end is less than start', async () => {
    const str = `packet-beta
    0-16: "test"
    25-20: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 25 - 20 is invalid. End must be greater than start.]`
    );
  });
});
