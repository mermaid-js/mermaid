/* eslint-disable no-console */
import { build, type Metafile } from 'esbuild';
import { basename, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { packageOptions } from '../.build/common.js';
import { defaultOptions, getBuildConfig } from '../.esbuild/util.js';

const REPORT_DIR = '.tmp/swimlanes-size';
const OUTPUT_DIR = `${REPORT_DIR}/full-mermaid`;
const META_PATH = `${REPORT_DIR}/mermaid-esm-min.meta.json`;
const JSON_PATH = `${REPORT_DIR}/swimlanes-js-size.json`;
const MARKDOWN_PATH = `${REPORT_DIR}/swimlanes-js-size.md`;
const BASELINE_PATH = `${REPORT_DIR}/swimlanes-js-size.baseline.json`;
const SWIMLANE_INPUT_ROOT = 'src/rendering-util/layout-algorithms/swimlanes/';
const SWIMLANE_FS_ROOT = 'packages/mermaid/src/rendering-util/layout-algorithms/swimlanes';

interface CliOptions {
  baselinePath: string;
  compare: boolean;
  failOnGrowth: boolean;
  writeBaseline: boolean;
}

interface FileSizeRow {
  file: string;
  fsPath: string;
  sourceBytes: number;
  minifiedBytesInOutput: number;
}

interface ChunkSummary {
  path: string;
  bytes: number;
  gzipBytes: number;
}

interface SwimlaneSizeSummary {
  generatedAt: string;
  entry: string;
  metafile: string;
  report: string;
  chunk: ChunkSummary;
  swimlaneOwnedSourceBytes: number;
  swimlaneOwnedMinifiedBytes: number;
  productionReachableRuntimeFiles: number;
  nonTestRuntimeFiles: number;
  nonTestRuntimeFilesNotReachable: string[];
  files: FileSizeRow[];
}

interface MetricDelta {
  label: string;
  baseline: number;
  current: number;
  delta: number;
}

interface FileDelta {
  file: string;
  baselineMinifiedBytes: number;
  currentMinifiedBytes: number;
  deltaMinifiedBytes: number;
}

interface SizeComparison {
  baselinePath: string;
  baselineGeneratedAt: string;
  metrics: MetricDelta[];
  files: FileDelta[];
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B';
  }
  return `${(bytes / 1024).toFixed(1)} KiB (${bytes} B)`;
};

const formatSignedBytes = (bytes: number): string => {
  const sign = bytes > 0 ? '+' : '';
  return `${sign}${formatBytes(bytes)}`;
};

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    baselinePath: BASELINE_PATH,
    compare: false,
    failOnGrowth: false,
    writeBaseline: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--baseline') {
      const baselinePath = argv[++i];
      if (!baselinePath) {
        throw new Error('--baseline requires a path.');
      }
      options.baselinePath = baselinePath;
      continue;
    }
    if (arg === '--compare') {
      options.compare = true;
      continue;
    }
    if (arg === '--fail-on-growth') {
      options.failOnGrowth = true;
      options.compare = true;
      continue;
    }
    if (arg === '--write-baseline') {
      options.writeBaseline = true;
      continue;
    }
    if (arg === '--help') {
      console.log(`Usage: pnpm exec tsx scripts/swimlanes-size.ts [options]

Options:
  --write-baseline       Save the current summary as ${BASELINE_PATH}
  --compare              Compare current summary to the saved baseline
  --fail-on-growth       Exit non-zero when chunk/gzip/owned minified bytes grow
  --baseline <path>      Read/write a custom baseline path
`);
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const isRuntimeSwimlaneInput = (inputPath: string): boolean =>
  inputPath.startsWith(SWIMLANE_INPUT_ROOT) &&
  !inputPath.includes('/__tests__/') &&
  !inputPath.endsWith('.spec.ts');

const listRuntimeTsFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir);
  const files = await Promise.all(
    entries.map(async (name) => {
      const path = `${dir}/${name}`;
      const fileStat = await stat(path);
      if (fileStat.isDirectory()) {
        return name === '__tests__' ? [] : await listRuntimeTsFiles(path);
      }
      if (path.endsWith('.ts') && !path.endsWith('.spec.ts')) {
        return [path];
      }
      return [];
    })
  );
  return files.flat();
};

const buildMermaidMetafile = async (): Promise<Metafile> => {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(REPORT_DIR, { recursive: true });

  const buildConfig = getBuildConfig({
    ...defaultOptions,
    options: packageOptions.mermaid,
    minify: true,
    metafile: true,
    outdir: `../../${OUTPUT_DIR}`,
    sourcemap: false,
  });

  buildConfig.logLevel = 'warning';
  const result = await build(buildConfig);
  if (!result.metafile) {
    throw new Error('Expected esbuild to return a metafile.');
  }
  await writeFile(META_PATH, JSON.stringify(result.metafile));
  return result.metafile;
};

const readOutputBytes = async (outputPath: string): Promise<Buffer> => {
  // esbuild output paths are relative to packages/mermaid because getBuildConfig
  // sets absWorkingDir there.
  return await readFile(resolve('packages/mermaid', outputPath));
};

const summarizeMetafile = async (metafile: Metafile): Promise<SwimlaneSizeSummary> => {
  const rowsByFile = new Map<string, FileSizeRow>();
  for (const output of Object.values(metafile.outputs)) {
    for (const [inputPath, contribution] of Object.entries(output.inputs ?? {})) {
      if (!isRuntimeSwimlaneInput(inputPath)) {
        continue;
      }
      const row = rowsByFile.get(inputPath) ?? {
        file: inputPath.slice(SWIMLANE_INPUT_ROOT.length),
        fsPath: `packages/mermaid/${inputPath}`,
        sourceBytes: metafile.inputs[inputPath]?.bytes ?? 0,
        minifiedBytesInOutput: 0,
      };
      row.minifiedBytesInOutput += contribution.bytesInOutput ?? 0;
      rowsByFile.set(inputPath, row);
    }
  }

  const files = [...rowsByFile.values()].sort(
    (a, b) => b.minifiedBytesInOutput - a.minifiedBytesInOutput
  );
  const reachablePaths = new Set(files.map((row) => row.fsPath));
  const runtimeFiles = (await listRuntimeTsFiles(SWIMLANE_FS_ROOT)).sort();
  const nonTestRuntimeFilesNotReachable = runtimeFiles.filter((path) => !reachablePaths.has(path));
  const swimlaneChunkEntry = Object.entries(metafile.outputs).find(
    ([path]) => basename(path).startsWith('swimlanes-') && path.endsWith('.mjs')
  );

  if (!swimlaneChunkEntry) {
    throw new Error('Could not find the emitted swimlanes chunk in the esbuild metafile.');
  }

  const [chunkPath, chunkOutput] = swimlaneChunkEntry;
  const chunkBytes = await readOutputBytes(chunkPath);

  return {
    generatedAt: new Date().toISOString(),
    entry: 'packages/mermaid/src/mermaid.ts',
    metafile: META_PATH,
    report: MARKDOWN_PATH,
    chunk: {
      path: chunkPath,
      bytes: chunkOutput.bytes,
      gzipBytes: gzipSync(chunkBytes, { level: 9 }).length,
    },
    swimlaneOwnedSourceBytes: files.reduce((total, row) => total + row.sourceBytes, 0),
    swimlaneOwnedMinifiedBytes: files.reduce((total, row) => total + row.minifiedBytesInOutput, 0),
    productionReachableRuntimeFiles: files.length,
    nonTestRuntimeFiles: runtimeFiles.length,
    nonTestRuntimeFilesNotReachable,
    files,
  };
};

const renderMarkdown = (summary: SwimlaneSizeSummary): string => {
  const unreachable =
    summary.nonTestRuntimeFilesNotReachable.length === 0
      ? 'none'
      : summary.nonTestRuntimeFilesNotReachable
          .map((path) => `\`${relative(SWIMLANE_FS_ROOT, path)}\``)
          .join(', ');

  const rows = summary.files
    .map(
      (row) =>
        `| \`${row.file}\` | ${formatBytes(row.sourceBytes)} | ${formatBytes(
          row.minifiedBytesInOutput
        )} |`
    )
    .join('\n');

  return `# Swimlanes JS Size

Generated: ${summary.generatedAt}

## Method

Builds the real Mermaid ESM minified entry with the repo esbuild config into \`${OUTPUT_DIR}\`, with metafile output at \`${META_PATH}\`. The table counts only production-reachable non-test inputs under \`${SWIMLANE_FS_ROOT}/\`.

\`bytesInOutput\` is esbuild's minified byte attribution per source file. Gzip is only reported for the emitted chunk as a whole.

## Summary

- Swimlane emitted chunk: \`${summary.chunk.path}\`
- Swimlane chunk size: ${formatBytes(summary.chunk.bytes)}
- Swimlane chunk gzip size: ${formatBytes(summary.chunk.gzipBytes)}
- Swimlane-owned minified bytes in chunk: ${formatBytes(summary.swimlaneOwnedMinifiedBytes)}
- Swimlane-owned source bytes: ${formatBytes(summary.swimlaneOwnedSourceBytes)}
- Production-reachable non-test swimlane files: ${summary.productionReachableRuntimeFiles} / ${
    summary.nonTestRuntimeFiles
  }
- Non-test swimlane files not reachable from production entry: ${unreachable}

## Files

| File | Source bytes | Minified bytes in output |
| --- | ---: | ---: |
${rows}
`;
};

const compareSummaries = (
  current: SwimlaneSizeSummary,
  baseline: SwimlaneSizeSummary,
  baselinePath: string
): SizeComparison => {
  const baselineFiles = new Map(baseline.files.map((row) => [row.file, row]));
  const currentFiles = new Map(current.files.map((row) => [row.file, row]));
  const fileNames = [...new Set([...baselineFiles.keys(), ...currentFiles.keys()])].sort();

  return {
    baselinePath,
    baselineGeneratedAt: baseline.generatedAt,
    metrics: [
      {
        label: 'Swimlane chunk',
        baseline: baseline.chunk.bytes,
        current: current.chunk.bytes,
        delta: current.chunk.bytes - baseline.chunk.bytes,
      },
      {
        label: 'Swimlane chunk gzip',
        baseline: baseline.chunk.gzipBytes,
        current: current.chunk.gzipBytes,
        delta: current.chunk.gzipBytes - baseline.chunk.gzipBytes,
      },
      {
        label: 'Swimlane-owned minified bytes',
        baseline: baseline.swimlaneOwnedMinifiedBytes,
        current: current.swimlaneOwnedMinifiedBytes,
        delta: current.swimlaneOwnedMinifiedBytes - baseline.swimlaneOwnedMinifiedBytes,
      },
      {
        label: 'Swimlane-owned source bytes',
        baseline: baseline.swimlaneOwnedSourceBytes,
        current: current.swimlaneOwnedSourceBytes,
        delta: current.swimlaneOwnedSourceBytes - baseline.swimlaneOwnedSourceBytes,
      },
    ],
    files: fileNames.map((file) => {
      const baselineMinifiedBytes = baselineFiles.get(file)?.minifiedBytesInOutput ?? 0;
      const currentMinifiedBytes = currentFiles.get(file)?.minifiedBytesInOutput ?? 0;
      return {
        file,
        baselineMinifiedBytes,
        currentMinifiedBytes,
        deltaMinifiedBytes: currentMinifiedBytes - baselineMinifiedBytes,
      };
    }),
  };
};

const renderComparisonMarkdown = (comparison: SizeComparison): string => {
  const metricRows = comparison.metrics
    .map(
      (metric) =>
        `| ${metric.label} | ${formatBytes(metric.baseline)} | ${formatBytes(
          metric.current
        )} | ${formatSignedBytes(metric.delta)} |`
    )
    .join('\n');

  const renderFileRows = (rows: FileDelta[]): string =>
    rows.length === 0
      ? '_No file-level changes._'
      : [
          '| File | Baseline minified | Current minified | Delta |',
          '| --- | ---: | ---: | ---: |',
          ...rows.map(
            (row) =>
              `| \`${row.file}\` | ${formatBytes(row.baselineMinifiedBytes)} | ${formatBytes(
                row.currentMinifiedBytes
              )} | ${formatSignedBytes(row.deltaMinifiedBytes)} |`
          ),
        ].join('\n');

  const reductions = comparison.files
    .filter((row) => row.deltaMinifiedBytes < 0)
    .sort((a, b) => a.deltaMinifiedBytes - b.deltaMinifiedBytes)
    .slice(0, 10);
  const growth = comparison.files
    .filter((row) => row.deltaMinifiedBytes > 0)
    .sort((a, b) => b.deltaMinifiedBytes - a.deltaMinifiedBytes)
    .slice(0, 10);

  return `## Comparison

Baseline: \`${comparison.baselinePath}\`
Baseline generated: ${comparison.baselineGeneratedAt}

| Metric | Baseline | Current | Delta |
| --- | ---: | ---: | ---: |
${metricRows}

### Largest File Reductions

${renderFileRows(reductions)}

### Largest File Growth

${renderFileRows(growth)}
`;
};

const printConsoleSummary = (summary: SwimlaneSizeSummary, comparison?: SizeComparison): void => {
  console.log('Swimlanes JS size');
  console.log(`  Chunk: ${formatBytes(summary.chunk.bytes)}`);
  console.log(`  Chunk gzip: ${formatBytes(summary.chunk.gzipBytes)}`);
  console.log(
    `  Swimlane-owned minified bytes: ${formatBytes(summary.swimlaneOwnedMinifiedBytes)}`
  );
  console.log(
    `  Reachable runtime files: ${summary.productionReachableRuntimeFiles}/${summary.nonTestRuntimeFiles}`
  );
  if (summary.nonTestRuntimeFilesNotReachable.length > 0) {
    console.log(
      `  Not reachable: ${summary.nonTestRuntimeFilesNotReachable
        .map((path) => relative(SWIMLANE_FS_ROOT, path))
        .join(', ')}`
    );
  }
  console.log('\nTop contributors:');
  for (const row of summary.files.slice(0, 10)) {
    console.log(`  ${formatBytes(row.minifiedBytesInOutput).padStart(20)}  ${row.file}`);
  }
  console.log(`\nWrote ${MARKDOWN_PATH}`);
  console.log(`Wrote ${JSON_PATH}`);
  if (comparison) {
    console.log(`\nCompared with ${comparison.baselinePath}`);
    for (const metric of comparison.metrics) {
      console.log(
        `  ${metric.label}: ${formatBytes(metric.current)} (${formatSignedBytes(metric.delta)})`
      );
    }
  }
};

const readBaseline = async (path: string): Promise<SwimlaneSizeSummary> => {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as SwimlaneSizeSummary;
  } catch (error) {
    throw new Error(
      `Could not read swimlane size baseline at ${path}. Run with --write-baseline first.`,
      {
        cause: error,
      }
    );
  }
};

const assertNoGrowth = (comparison: SizeComparison): void => {
  const growthMetrics = comparison.metrics
    .filter((metric) => metric.label !== 'Swimlane-owned source bytes')
    .filter((metric) => metric.delta > 0);
  if (growthMetrics.length === 0) {
    return;
  }

  const details = growthMetrics
    .map((metric) => `${metric.label} grew by ${formatSignedBytes(metric.delta)}`)
    .join('; ');
  throw new Error(`Swimlane size regression: ${details}`);
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const metafile = await buildMermaidMetafile();
  const summary = await summarizeMetafile(metafile);
  const comparison = options.compare
    ? compareSummaries(summary, await readBaseline(options.baselinePath), options.baselinePath)
    : undefined;

  await writeFile(JSON_PATH, JSON.stringify(summary, null, 2) + '\n');
  await writeFile(
    MARKDOWN_PATH,
    comparison
      ? `${renderMarkdown(summary)}\n${renderComparisonMarkdown(comparison)}`
      : renderMarkdown(summary)
  );
  if (options.writeBaseline) {
    await writeFile(options.baselinePath, JSON.stringify(summary, null, 2) + '\n');
  }
  printConsoleSummary(summary, comparison);
  if (options.writeBaseline) {
    console.log(`Wrote baseline ${options.baselinePath}`);
  }
  if (options.failOnGrowth && comparison) {
    assertNoGrowth(comparison);
  }
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
