import { describe, expect, it } from 'vitest';
import {
  normalizeMermaidSvgForWeb,
  prepareMermaidSvgForWeb,
  rewriteMermaidSvgCssVars,
} from './svgCssVars.js';

describe('svgCssVars', () => {
  it('rewrites theme colors to CSS vars with fallbacks', () => {
    const svg = `<svg><style>.n{fill:#ECECFF}</style><rect fill="#ECECFF" stroke="#333333"/></svg>`;
    const out = rewriteMermaidSvgCssVars(svg, {
      primaryColor: '#ECECFF',
      lineColor: '#333333',
    });
    expect(out).toContain('var(--mermaid-primaryColor, #ECECFF)');
    expect(out).toContain('var(--mermaid-lineColor, #333333)');
  });

  it('does not double-wrap existing var fallbacks', () => {
    const svg = `<svg><rect fill="var(--mermaid-primaryColor, #ECECFF)"/></svg>`;
    const out = rewriteMermaidSvgCssVars(svg, { primaryColor: '#ECECFF' });
    expect(out.split('var(--mermaid-primaryColor').length - 1).toBe(1);
  });

  it('normalizes SVG for web embedding without stripping backgrounds by default', () => {
    const svg = `<svg width="800" height="600" style="background:#fff"><g/></svg>`;
    const out = normalizeMermaidSvgForWeb(svg);
    expect(out).toMatch(/viewBox="0 0 800 600"/);
    expect(out).toMatch(/width="100%"/);
    expect(out).toMatch(/height="auto"/);
    expect(out).toMatch(/style="[^"]*background/i);
  });

  it('strips backgrounds only when stripBackground is true', () => {
    const svg = `<svg width="800" height="600" style="background:#fff"><g/></svg>`;
    const out = normalizeMermaidSvgForWeb(svg, { stripBackground: true });
    expect(out).not.toMatch(/style="[^"]*background/i);
  });

  it('does not treat unpaired hex as a shorthand match', () => {
    const svg = `<svg><rect fill="#eef"/><rect fill="#ECECFF"/></svg>`;
    const out = rewriteMermaidSvgCssVars(svg, { primaryColor: '#ECECFF' });
    expect(out).toContain('fill="#eef"');
    expect(out).toContain('var(--mermaid-primaryColor, #ECECFF)');
  });

  it('does not rewrite color words inside diagram labels', () => {
    const svg = `<svg><text>Red Team</text><rect fill="red"/></svg>`;
    const out = rewriteMermaidSvgCssVars(svg, { primaryColor: 'red' });
    expect(out).toContain('>Red Team<');
    expect(out).toContain('fill="var(--mermaid-primaryColor, red)"');
  });

  it('does not rewrite selectors that share a name with a theme color', () => {
    const svg = `<svg><style>.red { fill: red; }</style></svg>`;
    const out = rewriteMermaidSvgCssVars(svg, { primaryColor: 'red' });
    expect(out).toContain('.red { fill: var(--mermaid-primaryColor, red); }');
  });

  it('normalizes prefix without leading -- for API options', () => {
    const svg = `<svg><rect fill="#abcdef"/></svg>`;
    const out = prepareMermaidSvgForWeb(svg, {
      themeVariables: { primaryColor: '#abcdef' },
      cssVariableTheme: { prefix: 'host-' },
      webCompatibility: false,
    });
    expect(out).toContain('var(--host-primaryColor, #abcdef)');
  });

  it('prepareMermaidSvgForWeb combines both options', () => {
    const svg = `<svg width="100" height="50"><rect fill="#111111"/></svg>`;
    const out = prepareMermaidSvgForWeb(svg, {
      themeVariables: { primaryColor: '#111111' },
      cssVariableTheme: true,
      webCompatibility: true,
    });
    expect(out).toContain('var(--mermaid-primaryColor, #111111)');
    expect(out).toMatch(/viewBox="0 0 100 50"/);
    expect(out).toMatch(/width="100%"/);
  });

  it('respects custom CSS var prefix', () => {
    const svg = `<svg><rect fill="#abcdef"/></svg>`;
    const out = prepareMermaidSvgForWeb(svg, {
      themeVariables: { primaryColor: '#abcdef' },
      cssVariableTheme: { prefix: '--host-' },
      webCompatibility: false,
    });
    expect(out).toContain('var(--host-primaryColor, #abcdef)');
  });
});
