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
softwareSystem banking "Internet Banking System" "Allows customers to view accounts."
softwareSystem mainframe "Mainframe Banking System" :::external
customer --> banking : "Views accounts using"
banking <--> mainframe : "Syncs with" "XML/HTTPS"
`
    );
    expect(svg).toContain('c4-person');
    expect(svg).toContain('c4-softwareSystem');
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
softwareSystem banking "Internet Banking System" {
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

  jsdomIt('should number relationships in dynamic diagrams', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-3',
      `c4-beta dynamic
container spa "SPA"
container api "API"
spa --> api : "Submits credentials to"
api --> spa : "Returns a token to"
`
    );
    expect(svg).toContain('1. Submits credentials to');
    expect(svg).toContain('2. Returns a token to');
  });

  jsdomIt('should give repeated step numbers the same label for parallel steps', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-parallel',
      `c4-beta dynamic
container spa "SPA"
container api "API"
container db "DB"
spa --> api : "Calls"
2: api --> db : "Reads"
2: api --> spa : "Notifies"
`
    );
    const matches = svg.match(/2\. (Reads|Notifies)/g) ?? [];
    expect(matches).toHaveLength(2);
  });

  jsdomIt('should use the c4beta config defaults for padding and max width', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-config-1',
      `c4-beta context
person customer "Customer"
`
    );
    // MOCKED_BBOX is 666x666; default diagramPadding is 10
    expect(svg).toContain('viewBox="-10 -10 686 686"');
    expect(svg).toContain('width="100%"');
    expect(svg).toContain('style="max-width: 686px;"');
  });

  jsdomIt('should apply c4beta config overrides for padding and max width', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-config-2',
      `---
config:
  c4beta:
    diagramPadding: 25
    useMaxWidth: false
---
c4-beta context
person customer "Customer"
`
    );
    // MOCKED_BBOX is 666x666; overridden diagramPadding is 25
    expect(svg).toContain('viewBox="-25 -25 716 716"');
    expect(svg).toContain('width="716"');
    expect(svg).not.toContain('style="max-width');
  });

  jsdomIt('should render deployment nodes as clusters', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-4',
      `c4-beta deployment
deploymentNode aws "Amazon Web Services" "" "Cloud" {
    deploymentNode ec2 "EC2" {
        container api "API Application" "Java"
    }
}
`
    );
    expect(svg).toContain('c4-deploymentNode');
    expect(svg).toContain('Amazon Web Services');
    expect(svg).toContain('API Application');
  });

  jsdomIt('should render an infrastructureNode in deployment diagrams', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-5',
      `c4-beta deployment
infrastructureNode lb "Load Balancer" "Routes traffic." "nginx"
deploymentNode web "Web Server" {
    container app "Web Application" "" "Java"
}
lb --> app : "Forwards requests to"
`
    );
    expect(svg).toContain('c4-infrastructureNode');
    expect(svg).toContain('Load Balancer');
    expect(svg).toContain('Forwards requests to');
  });

  jsdomIt('should render an instance count badge on a deployment node', async () => {
    const { svg } = await mermaidAPI.render(
      'c4beta-render-6',
      `c4-beta deployment
deploymentNode ec2 "EC2" "" "Ubuntu" instances "4" {
    container api "API Application" "" "Java"
}
`
    );
    expect(svg).toContain('c4-instances');
    expect(svg).toContain('x4');
  });
});
