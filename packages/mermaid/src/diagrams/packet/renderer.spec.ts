import mermaid from '../../mermaid.js';

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

describe('packet renderer - comprehensive coverage', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    mermaid.initialize({});
  });

  it('should render without title', async () => {
    const diagramDefinition = `
      packet
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toBeTruthy();

    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const title = svgElement?.querySelector('.packetTitle');

    // Title element exists but should be empty
    expect(title?.textContent).toBe('');
  });

  it('should render with showBits disabled', async () => {
    mermaid.initialize({
      packet: {
        showBits: false,
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Header"
        8-15: "Data"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const bitNumbers = svgElement?.querySelectorAll('.packetByte');

    // No bit numbers should be rendered when showBits is false
    expect(bitNumbers?.length).toBe(0);
  });

  it('should render multiple rows correctly', async () => {
    const diagramDefinition = `
      packet
        0-15: "Row 1 Block 1"
        16-31: "Row 1 Block 2"
        32-47: "Row 2 Block 1"
        48-63: "Row 2 Block 2"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const blocks = svgElement?.querySelectorAll('.packetBlock');
    const labels = svgElement?.querySelectorAll('.packetLabel');

    expect(blocks?.length).toBe(4);
    expect(labels?.length).toBe(4);
  });

  it('should handle custom rowHeight', async () => {
    mermaid.initialize({
      packet: {
        rowHeight: 50,
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toContain('viewBox');
  });

  it('should handle custom bitWidth', async () => {
    mermaid.initialize({
      packet: {
        bitWidth: 20,
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toBeTruthy();
  });

  it('should handle custom paddingX and paddingY', async () => {
    mermaid.initialize({
      packet: {
        paddingX: 10,
        paddingY: 10,
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toBeTruthy();
  });

  it('should render with useMaxWidth enabled', async () => {
    mermaid.initialize({
      packet: {
        useMaxWidth: true,
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toBeTruthy();
  });

  it('should render with custom bitsPerRow', async () => {
    mermaid.initialize({
      packet: {
        bitsPerRow: 16,
      },
    });

    const diagramDefinition = `
      packet
        0-15: "Full Row"
        16-31: "Second Row"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const blocks = svgElement?.querySelectorAll('.packetBlock');
    expect(blocks?.length).toBe(2);
  });

  it('should handle handDrawn mode with custom blockStrokeWidth', async () => {
    mermaid.initialize({
      look: 'handDrawn',
      packet: {
        blockStrokeWidth: '3',
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toContain('<path');
  });

  it('should handle handDrawn mode with custom fill and stroke colors', async () => {
    mermaid.initialize({
      look: 'handDrawn',
      packet: {
        blockFillColor: '#ffcccc',
        blockStrokeColor: '#cc0000',
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Colored"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toContain('<path');
  });

  it('should render blocks spanning multiple bits correctly', async () => {
    const diagramDefinition = `
      packet
        0-3: "Small"
        4-15: "Large"
        16-31: "Full"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const startBits = svgElement?.querySelectorAll('.packetByte.start');
    const endBits = svgElement?.querySelectorAll('.packetByte.end');

    expect(startBits?.length).toBe(3);
    expect(endBits?.length).toBe(3);
  });

  it('should render viewbox attribute correctly', async () => {
    const diagramDefinition = `
      packet
        title Test Diagram
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/);
  });

  it('should position title at bottom center', async () => {
    const diagramDefinition = `
      packet
        title My Title
        0-7: "Header"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const title = svgElement?.querySelector('.packetTitle');

    expect(title?.getAttribute('text-anchor')).toBe('middle');
    expect(title?.getAttribute('dominant-baseline')).toBe('middle');
  });

  it('should render empty packet diagram', async () => {
    const diagramDefinition = `packet`;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toBeTruthy();
  });

  it('should handle complex multi-row diagram', async () => {
    const diagramDefinition = `
      packet
        title Complex Packet
        0-7: "Header"
        8-15: "Type"
        16-31: "Length"
        32-63: "Data Part 1"
        64-95: "Data Part 2"
        96-127: "Checksum"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const blocks = svgElement?.querySelectorAll('.packetBlock');
    const labels = svgElement?.querySelectorAll('.packetLabel');

    expect(blocks?.length).toBe(6);
    expect(labels?.length).toBe(6);
  });
});
