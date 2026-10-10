import { beforeEach, describe, expect, it } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import { PacketDB } from './db.js';
import { parser } from './parser.js';
import { renderer } from './renderer.js';

const diagramId = 'packet-diagram';

/** Where a bit number sits on its block, read back from the rendered text anchor. */
type BitPosition = 'left' | 'center' | 'right';

interface RenderedBit {
  position: BitPosition;
  text: string;
  x: number;
}

interface RenderedBlock {
  label: string;
  x: number;
  width: number;
  bits: RenderedBit[];
}

const bitPositions: Record<string, BitPosition> = {
  start: 'left',
  middle: 'center',
  end: 'right',
};

const classesOf = (element: Element) => element.getAttribute('class')?.split(' ') ?? [];
const numberAttr = (element: Element, name: string) => Number(element.getAttribute(name));

/**
 * Reads the rendered SVG back as one entry per row, each listing that row's blocks left to right.
 *
 * The renderer appends a block's rectangle, then its label, then its bit numbers, so the elements
 * of a row can be folded back into blocks by walking them in document order.
 */
const readRows = (): RenderedBlock[][] =>
  [...document.querySelectorAll(`#${diagramId} > g`)].map((row) => {
    const blocks: RenderedBlock[] = [];
    for (const element of row.children) {
      const classes = classesOf(element);
      if (classes.includes('packetBlock')) {
        blocks.push({
          label: '',
          x: numberAttr(element, 'x'),
          width: numberAttr(element, 'width'),
          bits: [],
        });
      } else if (classes.includes('packetLabel')) {
        blocks.at(-1)!.label = element.textContent ?? '';
      } else if (classes.includes('packetByte')) {
        blocks.at(-1)!.bits.push({
          position: bitPositions[element.getAttribute('text-anchor') ?? ''],
          text: element.textContent ?? '',
          x: numberAttr(element, 'x'),
        });
      }
    }
    return blocks.sort((a, b) => a.x - b.x);
  });

/** Every bit number of a row, in the order a reader meets them going left to right. */
const bitNumbersLeftToRight = (row: RenderedBlock[]) =>
  row.flatMap(({ bits }) => bits.map(({ text }) => Number(text)));

/** Each field's drawn width, keyed by label, which `bitOrder` must not change. */
const widthsByLabel = (rows: RenderedBlock[][]) =>
  Object.fromEntries(rows.flat().map(({ label, width }) => [label, width]));

const renderPacket = async (text: string, packet: PacketDiagramConfig = {}) => {
  configApi.setConfig({ packet });
  document.body.innerHTML = `<svg id="${diagramId}"></svg>`;
  const db = new PacketDB();
  if (parser.parser) {
    parser.parser.yy = db;
  }
  await parser.parse(text);
  await renderer.draw(text, diagramId, 'test', { db } as unknown as Diagram);
  return readRows();
};

const twoFields = `packet
0-7: "foo"
8-15: "bar"
`;

const register = `packet
0-7: "DATA"
8-11: "TYPE"
12: "EN"
13-15: "RESERVED"
`;

describe('packet renderer', () => {
  beforeEach(() => {
    configApi.reset();
  });

  describe('ascending bit order', () => {
    it('lays fields out from bit 0, each numbered from its start bit', async () => {
      const [row] = await renderPacket(twoFields);
      expect(row).toStrictEqual([
        {
          label: 'foo',
          x: 1,
          width: 251,
          bits: [
            { position: 'left', text: '0', x: 1 },
            { position: 'right', text: '7', x: 252 },
          ],
        },
        {
          label: 'bar',
          x: 257,
          width: 251,
          bits: [
            { position: 'left', text: '8', x: 257 },
            { position: 'right', text: '15', x: 508 },
          ],
        },
      ]);
    });

    it('renders an explicit ascending bitOrder exactly like the default', async () => {
      const byDefault = await renderPacket(register, { bitsPerRow: 16 });
      const explicit = await renderPacket(register, { bitsPerRow: 16, bitOrder: 'ascending' });
      expect(explicit).toStrictEqual(byDefault);
    });
  });

  describe('descending bit order', () => {
    it('mirrors the row so it reads from the most significant bit down', async () => {
      const [row] = await renderPacket(twoFields, { bitsPerRow: 16, bitOrder: 'descending' });
      expect(row).toStrictEqual([
        {
          label: 'bar',
          x: 1,
          width: 251,
          bits: [
            { position: 'left', text: '15', x: 1 },
            { position: 'right', text: '8', x: 252 },
          ],
        },
        {
          label: 'foo',
          x: 257,
          width: 251,
          bits: [
            { position: 'left', text: '7', x: 257 },
            { position: 'right', text: '0', x: 508 },
          ],
        },
      ]);
    });

    it('numbers a row of mixed-width fields straight down from its highest bit', async () => {
      const [ascending] = await renderPacket(register, { bitsPerRow: 16 });
      const [descending] = await renderPacket(register, {
        bitsPerRow: 16,
        bitOrder: 'descending',
      });
      expect(descending.map(({ label }) => label)).toStrictEqual([
        'RESERVED',
        'EN',
        'TYPE',
        'DATA',
      ]);
      expect(bitNumbersLeftToRight(ascending)).toStrictEqual([0, 7, 8, 11, 12, 13, 15]);
      expect(bitNumbersLeftToRight(descending)).toStrictEqual([15, 13, 12, 11, 8, 7, 0]);
    });

    it('keeps every field the width it has in ascending order', async () => {
      const ascending = await renderPacket(register, { bitsPerRow: 16 });
      const descending = await renderPacket(register, { bitsPerRow: 16, bitOrder: 'descending' });
      expect(widthsByLabel(descending)).toStrictEqual(widthsByLabel(ascending));
    });

    it('centres the number on a single-bit field, as ascending order does', async () => {
      const [ascending] = await renderPacket(register, { bitsPerRow: 16 });
      const [descending] = await renderPacket(register, {
        bitsPerRow: 16,
        bitOrder: 'descending',
      });
      const enableBit = { position: 'center', text: '12' };
      expect(ascending.find(({ label }) => label === 'EN')?.bits).toMatchObject([enableBit]);
      expect(descending.find(({ label }) => label === 'EN')?.bits).toMatchObject([enableBit]);
    });

    it('mirrors each row of a multi-row packet on its own', async () => {
      const rows = await renderPacket(twoFields, { bitsPerRow: 8, bitOrder: 'descending' });
      expect(
        rows.map((row) => row.map(({ label, x, width }) => ({ label, x, width })))
      ).toStrictEqual([[{ label: 'foo', x: 1, width: 251 }], [{ label: 'bar', x: 1, width: 251 }]]);
      expect(rows.map(bitNumbersLeftToRight)).toStrictEqual([
        [7, 0],
        [15, 8],
      ]);
    });

    it('mirrors within bitsPerRow, so a part-filled row is flush right', async () => {
      const [row] = await renderPacket(`packet
0-7: "foo"
`);
      const [mirrored] = await renderPacket(
        `packet
0-7: "foo"
`,
        { bitOrder: 'descending' }
      );
      // 8 bits of a 32-bit row: flush left ascending, flush right descending.
      expect(row).toMatchObject([{ x: 1, width: 251 }]);
      expect(mirrored).toMatchObject([{ x: 24 * 32 + 1, width: 251 }]);
    });
  });

  describe('showBits', () => {
    it.each(['ascending', 'descending'] as const)(
      'draws no bit numbers with showBits false and bitOrder %s',
      async (bitOrder) => {
        const rows = await renderPacket(register, { bitsPerRow: 16, showBits: false, bitOrder });
        expect(rows.flat().flatMap(({ bits }) => bits)).toStrictEqual([]);
        expect(document.querySelectorAll('.packetByte')).toHaveLength(0);
      }
    );

    it('still mirrors the row with showBits false', async () => {
      const [row] = await renderPacket(register, {
        bitsPerRow: 16,
        showBits: false,
        bitOrder: 'descending',
      });
      expect(row.map(({ label }) => label)).toStrictEqual(['RESERVED', 'EN', 'TYPE', 'DATA']);
    });
  });
});
