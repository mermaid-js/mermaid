import { describe, expect } from 'vitest';

import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';

describe('wardley renderer', () => {
  const diagram = `wardley-beta
title Map
component Tea [0.5, 0.5]`;

  jsdomIt('keeps the diagram stylesheet in the rendered svg (issue #8615)', async () => {
    const { svg } = await mermaidAPI.render('wardley-keeps-style', diagram);
    expect(svg).toContain('<style');
    expect(svg).toContain('.wardley-background');
  });

  jsdomIt('applies the configured fontFamily to wardley text', async () => {
    mermaidAPI.initialize({ fontFamily: 'Courier New' });
    const { svg } = await mermaidAPI.render('wardley-font', diagram);
    expect(svg).toMatch(/\.wardley-map\s*{[^}]*font-family:\s*Courier New/);
  });

  jsdomIt('lets themeCSS rules reach the svg', async () => {
    mermaidAPI.initialize({ themeCSS: '.wardley-map { opacity: 0.5; }' });
    const { svg } = await mermaidAPI.render('wardley-theme-css', diagram);
    expect(svg).toContain('opacity:0.5');
  });
});
