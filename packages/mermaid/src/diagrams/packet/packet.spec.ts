import { it, describe, expect, beforeEach, afterEach } from 'vitest';
import mermaid from '../../mermaid.js';
import { PacketDB } from './db.js';
import { parser } from './parser.js';

describe('packet diagrams', () => {
  let db: PacketDB;
  beforeEach(() => {
    db = new PacketDB();
    if (parser.parser) {
      parser.parser.yy = db;
    }
  });

  it('should handle a packet-beta definition', async () => {
    const str = `packet-beta`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getPacket()).toMatchInlineSnapshot('[]');
  });

  it('should handle a packet definition', async () => {
    const str = `packet`;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getPacket()).toMatchInlineSnapshot('[]');
  });

  it('should handle diagram with data and title', async () => {
    const str = `packet
    title Packet diagram
    accTitle: Packet accTitle
    accDescr: Packet accDescription
    0-10: "test"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getDiagramTitle()).toMatchInlineSnapshot('"Packet diagram"');
    expect(db.getAccTitle()).toMatchInlineSnapshot('"Packet accTitle"');
    expect(db.getAccDescription()).toMatchInlineSnapshot('"Packet accDescription"');
    expect(db.getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "bits": 11,
            "end": 10,
            "label": "test",
            "start": 0,
          },
        ],
      ]
    `);
  });

  it('should handle single bits', async () => {
    const str = `packet
    0-10: "test"
    11: "single"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "bits": 11,
            "end": 10,
            "label": "test",
            "start": 0,
          },
          {
            "bits": 1,
            "end": 11,
            "label": "single",
            "start": 11,
          },
        ],
      ]
    `);
  });

  it('should handle bit counts', async () => {
    const str = `packet
    +8: "byte"
    +16: "word"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "bits": 8,
            "end": 7,
            "label": "byte",
            "start": 0,
          },
          {
            "bits": 16,
            "end": 23,
            "label": "word",
            "start": 8,
          },
        ],
      ]
    `);
  });

  it('should handle bit counts with bit or bits', async () => {
    const str = `packet
    +8: "byte"
    +16: "word"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "bits": 8,
            "end": 7,
            "label": "byte",
            "start": 0,
          },
          {
            "bits": 16,
            "end": 23,
            "label": "word",
            "start": 8,
          },
        ],
      ]
    `);
  });

  it('should split into multiple rows', async () => {
    const str = `packet
    0-10: "test"
    11-90: "multiple"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "bits": 11,
            "end": 10,
            "label": "test",
            "start": 0,
          },
          {
            "bits": 20,
            "end": 31,
            "label": "multiple",
            "start": 11,
          },
        ],
        [
          {
            "bits": 31,
            "end": 63,
            "label": "multiple",
            "start": 32,
          },
        ],
        [
          {
            "bits": 26,
            "end": 90,
            "label": "multiple",
            "start": 64,
          },
        ],
      ]
    `);
  });

  it('should split into multiple rows when cut at exact length', async () => {
    const str = `packet
    0-16: "test"
    17-63: "multiple"
    `;
    await expect(parser.parse(str)).resolves.not.toThrow();
    expect(db.getPacket()).toMatchInlineSnapshot(`
      [
        [
          {
            "bits": 17,
            "end": 16,
            "label": "test",
            "start": 0,
          },
          {
            "bits": 14,
            "end": 31,
            "label": "multiple",
            "start": 17,
          },
        ],
        [
          {
            "bits": 31,
            "end": 63,
            "label": "multiple",
            "start": 32,
          },
        ],
      ]
    `);
  });

  it('should throw error if numbers are not continuous', async () => {
    const str = `packet
    0-16: "test"
    18-20: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 18 - 20 is not contiguous. It should start from 17.]`
    );
  });

  it('should throw error if numbers are not continuous with bit counts', async () => {
    const str = `packet
    +16: "test"
    18-20: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 18 - 20 is not contiguous. It should start from 16.]`
    );
  });

  it('should throw error if numbers are not continuous for single packets', async () => {
    const str = `packet
    0-16: "test"
    18: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 18 - 18 is not contiguous. It should start from 17.]`
    );
  });

  it('should throw error if numbers are not continuous for single packets with bit counts', async () => {
    const str = `packet
    +16: "test"
    18: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 18 - 18 is not contiguous. It should start from 16.]`
    );
  });

  it('should throw error if numbers are not continuous for single packets - 2', async () => {
    const str = `packet
    0-16: "test"
    17: "good"
    19: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 19 - 19 is not contiguous. It should start from 18.]`
    );
  });

  it('should throw error if end is less than start', async () => {
    const str = `packet
    0-16: "test"
    25-20: "error"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 25 - 20 is invalid. End must be greater than start.]`
    );
  });

  it('should throw error if bit count is 0', async () => {
    const str = `packet
    +0: "test"
    `;
    await expect(parser.parse(str)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Packet block 0 is invalid. Cannot have a zero bit field.]`
    );
  });
});

describe('handDrawn rendering', () => {
  it('should render a hand-drawn packet diagram', async () => {
    mermaid.initialize({
      look: 'handDrawn',
      packet: {
        bitsPerRow: 32,
        blockStrokeWidth: '2',
      },
    });

    const diagramDefinition = `
      packet
        0-15: "Source Port"
        16-31: "Destination Port"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);

    expect(svg).toContain('<path');
    expect(svg).not.toContain('<rect');

    mermaid.initialize({});
  });
});

describe('packet renderer', () => {
  beforeEach(() => {
    // Create a DOM element for mermaid to render into
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  afterEach(() => {
    // Clean up the DOM after each test
    document.body.innerHTML = '';
  });

  it('should render a basic packet diagram with blocks and labels', async () => {
    const diagramDefinition = `
      packet
        title My Packet
        0-7: "Header"
        8-15: "Data"
    `;

    // Use the main mermaid render function
    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    // Check that the SVG was created
    const svgElement = document.querySelector('#test-container svg');
    expect(svgElement).not.toBeNull();

    // Check for the rendered blocks (rectangles)
    const blocks = svgElement?.querySelectorAll('.packetBlock');
    expect(blocks).toHaveLength(2);

    // Check for the labels
    const labels = svgElement?.querySelectorAll('.packetLabel');
    expect(labels).toHaveLength(2);
    expect(labels?.[0].textContent).toBe('Header');
    expect(labels?.[1].textContent).toBe('Data');

    // Check for the bit numbers
    const startBits = svgElement?.querySelectorAll('.packetByte.start');
    const endBits = svgElement?.querySelectorAll('.packetByte.end');
    expect(startBits).toHaveLength(2);
    expect(endBits).toHaveLength(2);
    expect(startBits?.[0].textContent).toBe('0');
    expect(endBits?.[0].textContent).toBe('7');

    // Check for the title
    const title = svgElement?.querySelector('.packetTitle');
    expect(title?.textContent).toBe('My Packet');
  });

  it('should render a single block correctly', async () => {
    const diagramDefinition = `
      packet
        0: "Flag"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const testContainer = document.getElementById('test-container');
    if (testContainer) {
      testContainer.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const startBits = svgElement?.querySelectorAll('.packetByte.start');
    const endBits = svgElement?.querySelectorAll('.packetByte.end');

    // For a single block, there should be no "end" bit number
    expect(startBits).toHaveLength(1);
    expect(endBits).toHaveLength(0);
    expect(startBits?.[0].textContent).toBe('0');
  });
});

describe('handDrawn rendering', () => {
  afterEach(() => {
    // Reset mermaid config after each test
    mermaid.initialize({});
  });

  it('should render a hand-drawn packet diagram using paths instead of rects', async () => {
    mermaid.initialize({
      look: 'handDrawn',
      packet: {
        blockStrokeWidth: '2',
      },
    });

    const diagramDefinition = `
      packet
        0-15: "Source Port"
        16-31: "Destination Port"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);

    // Assert that the SVG contains <path> elements (from rough.js)
    expect(svg).toContain('<path');
    // Assert that the SVG does NOT contain <rect> elements
    expect(svg).not.toContain('<rect');
  });
});
