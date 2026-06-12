import { describe, beforeAll, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';
import c4BetaDetector from './detector.js';
import styles from './styles.js';

describe('c4-beta detector', () => {
  it('should detect the c4-beta keyword with and without a kind', () => {
    expect(c4BetaDetector.detector('c4-beta context')).toBe(true);
    expect(c4BetaDetector.detector('  c4-beta deployment')).toBe(true);
    expect(c4BetaDetector.detector('c4-beta')).toBe(true);
  });

  it('should not detect legacy C4 or other diagrams', () => {
    expect(c4BetaDetector.detector('C4Context')).toBe(false);
    expect(c4BetaDetector.detector('flowchart LR')).toBe(false);
  });

  it('should lazy-load the diagram definition', async () => {
    const { id, diagram } = await c4BetaDetector.loader();
    expect(id).toBe('c4beta');
    expect(diagram.parser).toBeDefined();
    expect(diagram.db).toBeDefined();
    expect(diagram.renderer).toBeDefined();
    expect(diagram.styles).toBeDefined();
  });
});

describe('c4-beta styles', () => {
  it('should emit theme-driven css for nodes, boundaries and relationships', () => {
    const css = styles({
      fontFamily: 'sans-serif',
      textColor: '#111111',
      nodeTextColor: '#222222',
      mainBkg: '#eeeeee',
      nodeBorder: '#333333',
      lineColor: '#444444',
      arrowheadColor: '#555555',
      edgeLabelBackground: '#dddddd',
      titleColor: '#666666',
    });
    expect(css).toContain('.c4-shape');
    expect(css).toContain('path.c4-rel');
    expect(css).toContain('stroke-dasharray');
    expect(css).toContain('#444444');
    expect(css).toContain('#666666');
  });
});

describe('c4-beta renderer', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
    mermaid.initialize({
      deterministicIds: true,
      deterministicIDSeed: 'c4beta-test',
    });
  });

  jsdomIt('should render a context diagram with nodes and labeled edges', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-1',
      `c4-beta context
title Internet Banking System - System Context
person customer "Personal Banking Customer" "A customer of the bank."
system banking "Internet Banking System" "Allows customers to view accounts."
external system mainframe "Mainframe Banking System"
customer --> banking : "Views accounts using"
banking <--> mainframe : "Syncs with" "XML/HTTPS"
`
    );
    expect(svg).toContain('c4-person');
    expect(svg).toContain('c4-system');
    expect(svg).toContain('c4-external');
    expect(svg).toContain('Views accounts using');
    expect(svg).toContain('XML/HTTPS');
    expect(svg).toContain('Internet Banking System - System Context');
  });

  jsdomIt('should render nested boundaries as clusters', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-2',
      `c4-beta container
person customer "Customer"
system banking "Internet Banking System" {
    container spa "Single-Page Application" "Web UI" "JavaScript"
    container db "Database" "Stores data." "Oracle"
}
customer --> spa : "Uses"
spa --> db : "Reads from"
`
    );
    expect(svg).toContain('c4-boundary');
    expect(svg).toContain('Single-Page Application');
    expect(svg).toContain('JavaScript');
  });
});
