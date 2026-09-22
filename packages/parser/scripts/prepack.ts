#!/usr/bin/env -S node --experimental-strip-types

/**
 * Runs `api-extractor` to create a single `dist/src/index.d.ts` bundle,
 * then removes all unused `dist/*.d.ts` files.
 */
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import { glob, rm, rmdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run API extractor to create new `dist/src/index.d.ts` file
let typesBundle;
{
  const apiExtractorJsonPath = fileURLToPath(import.meta.resolve('../api-extractor.json'));

  // Load and parse the api-extractor.json file
  const extractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);

  // Invoke API Extractor
  const extractorResult = Extractor.invoke(extractorConfig, {
    localBuild: !process.env.CI,
    // Equivalent to the "--verbose" command-line parameter
    showVerboseMessages: true,
  });

  if (!extractorResult.succeeded) {
    throw new Error(
      `API Extractor completed with ${extractorResult.errorCount} errors` +
        ` and ${extractorResult.warningCount} warnings`
    );
  }
  typesBundle = extractorResult.extractorConfig.untrimmedFilePath;
}

// Remove all other `dist/*.d.ts` files
const rootDir = fileURLToPath(import.meta.resolve('../'));
for await (const file of glob('./dist/**/*.d.ts', {
  cwd: rootDir,
  exclude: [typesBundle],
})) {
  await rm(join(rootDir, file));
}

// @ts-expect-error -- Our tsconfig.json doesn't support `Array.fromAsync`
const directories: string[] = await Array.fromAsync(
  glob('./dist/**/', {
    cwd: rootDir,
  })
);
// delete subdirectories before their parents
for (const dir of directories.sort().reverse()) {
  try {
    await rmdir(join(rootDir, dir));
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code !== 'ENOTEMPTY') {
      throw err;
    }
  }
}
