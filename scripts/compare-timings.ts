/**
 * Compares new E2E test timings with previous timings and determines whether to keep the new timings.
 *
 * The script will:
 * 1. Read old timings from git HEAD
 * 2. Read new timings from the current file
 * 3. Compare the timings and specs
 * 4. Keep new timings if:
 *    - Specs were added/removed
 *    - Any timing changed by 20% or more
 * 5. Revert to old timings if:
 *    - No significant timing changes
 *
 * This helps prevent unnecessary timing updates when test performance hasn't changed significantly.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

interface Timing {
  spec: string;
  duration: number;
}

interface TimingsFile {
  durations: Timing[];
}

interface CleanupOptions {
  keepNew: boolean;
  reason: string;
}

const TIMINGS_FILE = 'cypress/timings.json';
const TIMINGS_PATH = path.join(process.cwd(), TIMINGS_FILE);

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message);
}

function readOldTimings(): TimingsFile {
  try {
    const oldContent = execSync(`git show HEAD:${TIMINGS_FILE}`, { encoding: 'utf8' });
    return JSON.parse(oldContent);
  } catch {
    log('Error getting old timings, using empty file');
    return { durations: [] };
  }
}

function readNewTimings(): TimingsFile {
  return JSON.parse(fs.readFileSync(TIMINGS_PATH, 'utf8'));
}

function cleanupFiles({ keepNew, reason }: CleanupOptions): void {
  if (keepNew) {
    log(`Keeping new timings: ${reason}`);
  } else {
    log(`Reverting to old timings: ${reason}`);
    execSync(`git checkout HEAD -- ${TIMINGS_FILE}`);
  }
}

function compareTimings(): void {
  const oldTimings = readOldTimings();
  const newTimings = readNewTimings();

  const oldSpecs = new Set(oldTimings.durations.map((d) => d.spec));
  const newSpecs = new Set(newTimings.durations.map((d) => d.spec));

  // Check if specs were added or removed
  const addedSpecs = [...newSpecs].filter((spec) => !oldSpecs.has(spec));
  const removedSpecs = [...oldSpecs].filter((spec) => !newSpecs.has(spec));

  if (addedSpecs.length > 0 || removedSpecs.length > 0) {
    log('Specs changed:');
    if (addedSpecs.length > 0) {
      log(`Added: ${addedSpecs.join(', ')}`);
    }
    if (removedSpecs.length > 0) {
      log(`Removed: ${removedSpecs.join(', ')}`);
    }
    return cleanupFiles({ keepNew: true, reason: 'Specs were added or removed' });
  }

  // Check timing variations
  const timingChanges = newTimings.durations.map((newTiming) => {
    const oldTiming = oldTimings.durations.find((d) => d.spec === newTiming.spec);
    if (!oldTiming) {
      throw new Error(`Could not find old timing for spec: ${newTiming.spec}`);
    }
    const change = Math.abs(newTiming.duration - oldTiming.duration) / oldTiming.duration;
    return { spec: newTiming.spec, change };
  });

  const significantChanges = timingChanges.filter((t) => t.change >= 0.2);

  if (significantChanges.length === 0) {
    log('No significant timing changes detected (threshold: 20%)');
    return cleanupFiles({ keepNew: false, reason: 'No significant timing changes' });
  }

  log('Significant timing changes:');
  significantChanges.forEach((t) => {
    log(`${t.spec}: ${(t.change * 100).toFixed(1)}%`);
  });

  cleanupFiles({ keepNew: true, reason: 'Significant timing changes detected' });
}

compareTimings();
