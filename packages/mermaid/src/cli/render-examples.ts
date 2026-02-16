#!/usr/bin/env node
/**
 * Renders all example diagrams from packages/examples/src/index.ts
 * and writes them as SVG files to packages/mermaid/cli-output/.
 *
 * Usage:
 *   npx tsx packages/mermaid/src/cli/render-examples.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Virtual DOM must be set up BEFORE importing mermaid
import { createVirtualDOMEnvironment } from './virtualDOM.js';

const virtualDOM = createVirtualDOMEnvironment();

// Import the pre-built mermaid bundle
const selfDir = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(selfDir, '../../dist/mermaid.core.mjs');
const { default: mermaid } = await import(distPath);

// Import example diagram data
const examplesIndexPath = resolve(selfDir, '../../../examples/src/index.ts');
const { diagramData } = await import(examplesIndexPath);

interface Example {
  title: string;
  code: string;
  isDefault?: boolean;
}

interface DiagramMetadata {
  id: string;
  name: string;
  description: string;
  examples: Example[];
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const outputDir = resolve(selfDir, '../../cli-output');
  mkdirSync(outputDir, { recursive: true });

  mermaid.initialize({
    htmlLabels: false,
    securityLevel: 'loose',
    logLevel: 'error',
    startOnLoad: false,
  });

  const results: { id: string; name: string; success: boolean; error?: string }[] = [];

  for (const diagram of diagramData as DiagramMetadata[]) {
    const defaultExample = diagram.examples.find((e: Example) => e.isDefault);
    if (!defaultExample) {
      // eslint-disable-next-line no-console
      console.warn(`⚠ ${diagram.id} (${diagram.name}): no default example, skipping`);
      results.push({ id: diagram.id, name: diagram.name, success: false, error: 'no default example' });
      continue;
    }

    try {
      const id = `${diagram.id}-${Date.now()}`;
      const { svg } = await mermaid.render(id, defaultExample.code);
      const outputPath = resolve(outputDir, `${diagram.id}.svg`);
      writeFileSync(outputPath, svg, 'utf-8');

      const nanCount = (svg.match(/NaN/g) || []).length;
      const marker = nanCount > 0 ? `⚠ (${nanCount} NaN)` : '✓';
      // eslint-disable-next-line no-console
      console.log(`${marker} ${diagram.id} (${diagram.name})`);
      results.push({ id: diagram.id, name: diagram.name, success: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error(`✗ ${diagram.id} (${diagram.name}): ${msg}`);
      results.push({ id: diagram.id, name: diagram.name, success: false, error: msg });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  // eslint-disable-next-line no-console
  console.log(`\n── Summary ──`);
  // eslint-disable-next-line no-console
  console.log(`Total: ${results.length} | Succeeded: ${succeeded} | Failed: ${failed}`);

  if (failed > 0) {
    // eslint-disable-next-line no-console
    console.log(`\nFailed diagrams:`);
    for (const r of results.filter((r) => !r.success)) {
      // eslint-disable-next-line no-console
      console.log(`  - ${r.id}: ${r.error}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\nOutput directory: ${outputDir}`);

  virtualDOM.cleanup();
}

void main();

