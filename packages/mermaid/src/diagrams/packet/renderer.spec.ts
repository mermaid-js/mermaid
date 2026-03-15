import mermaid from '../../mermaid.js';

describe('packet renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render a basic packet diagram with blocks and labels', async () => {
    const diagramDefinition = `
      packet
        title My Packet
        0-7: "Header"
        8-15: "Data"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    expect(svgElement).not.toBeNull();

    const blocks = svgElement?.querySelectorAll('.packetBlock');
    expect(blocks).toHaveLength(2);

    const labels = svgElement?.querySelectorAll('.packetLabel');
    expect(labels).toHaveLength(2);
    expect(labels?.[0].textContent).toBe('Header');
    expect(labels?.[1].textContent).toBe('Data');
  });

  it('should render a single block correctly', async () => {
    const diagramDefinition = `
      packet
        0: "Flag"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);

    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = svg;
    }

    const svgElement = document.querySelector('#test-container svg');
    const startBits = svgElement?.querySelectorAll('.packetByte.start');
    const endBits = svgElement?.querySelectorAll('.packetByte.end');

    expect(startBits).toHaveLength(1);
    expect(endBits).toHaveLength(0);
    expect(startBits?.[0].textContent).toBe('0');
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

  it('should handle custom blockStrokeWidth, fill and stroke colors', async () => {
    mermaid.initialize({
      packet: {
        blockStrokeWidth: '3',
        blockFillColor: '#ffcccc',
        blockStrokeColor: '#cc0000',
      },
    });

    const diagramDefinition = `
      packet
        0-7: "Colored"
    `;

    const { svg } = await mermaid.render('test-diagram', diagramDefinition);

    // Assert that the standard SVG rects are applying inline styles!
    // Using Regex because JS tools sometimes convert hex codes to rgb() automatically
    expect(svg).toMatch(/fill:\s*(#ffcccc|rgb\(255,\s*204,\s*204\))/i);
    expect(svg).toMatch(/stroke:\s*(#cc0000|rgb\(204,\s*0,\s*0\))/i);
    expect(svg).toMatch(/stroke-width:\s*3/i);
  });

  it('should render without title', async () => {
    const diagramDefinition = `
      packet
        0-7: "Header"
    `;
    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).toBeTruthy();
  });

  it('should render with showBits disabled', async () => {
    mermaid.initialize({ packet: { showBits: false } });
    const diagramDefinition = `
      packet
        0-7: "Header"
    `;
    const { svg } = await mermaid.render('test-diagram', diagramDefinition);
    expect(svg).not.toContain('class="packetByte');
  });
});
