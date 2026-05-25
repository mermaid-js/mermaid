import { vi } from 'vitest';
import { calculateSvgSizeAttrs } from './zenumlRenderer.js';

vi.mock('@zenuml/core', () => ({
  renderToSvg: vi.fn((code: string) => ({
    innerSvg: `<text>${code.trim()}</text>`,
    width: 400,
    height: 300,
    viewBox: '0 0 400 300',
  })),
}));

vi.mock('./mermaidUtils.js', () => ({
  log: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
  getConfig: vi.fn(() => ({
    securityLevel: 'loose',
    sequence: { useMaxWidth: true },
  })),
}));

describe('calculateSvgSizeAttrs', function () {
  it('should return responsive width when useMaxWidth is true', function () {
    const attrs = calculateSvgSizeAttrs(133, 392, true);

    expect(attrs.get('width')).toEqual('100%');
    expect(attrs.get('style')).toEqual('max-width: 133px;');
    expect(attrs.has('height')).toBe(false);
  });

  it('should return absolute dimensions when useMaxWidth is false', function () {
    const attrs = calculateSvgSizeAttrs(133, 392, false);

    expect(attrs.get('width')).toEqual('133');
    expect(attrs.get('height')).toEqual('392');
    expect(attrs.has('style')).toBe(false);
  });
});

describe('draw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should render SVG content into the target element', async () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'test-id';
    document.body.appendChild(svg);

    const { draw } = await import('./zenumlRenderer.js');
    await draw('zenuml\n    Alice->Bob: hello', 'test-id');

    expect(svg.innerHTML).toContain('Alice-');
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 300');
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('style')).toBe('max-width: 400px;');
  });

  it('should set absolute dimensions when useMaxWidth is false', async () => {
    const { getConfig } = await import('./mermaidUtils.js');
    vi.mocked(getConfig).mockReturnValue({
      securityLevel: 'loose',
      sequence: { useMaxWidth: false },
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'test-abs';
    document.body.appendChild(svg);

    const { draw } = await import('./zenumlRenderer.js');
    await draw('zenuml\n    A->B: msg', 'test-abs');

    expect(svg.getAttribute('width')).toBe('400');
    expect(svg.getAttribute('height')).toBe('300');
  });

  it('should handle missing SVG element gracefully', async () => {
    const { draw } = await import('./zenumlRenderer.js');
    const { log } = await import('./mermaidUtils.js');

    await draw('zenuml\n    A->B: msg', 'nonexistent');

    expect(log.error).toHaveBeenCalledWith('Cannot find svg element');
  });

  it('should strip the zenuml prefix before rendering', async () => {
    const { renderToSvg } = await import('@zenuml/core');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'test-strip';
    document.body.appendChild(svg);

    const { draw } = await import('./zenumlRenderer.js');
    await draw('zenuml\n    Alice->Bob: hello', 'test-strip');

    expect(renderToSvg).toHaveBeenCalledWith('\n    Alice->Bob: hello');
  });
});
