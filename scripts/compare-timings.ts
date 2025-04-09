import fs from 'node:fs';
import path from 'node:path';

interface Timing {
  spec: string;
  duration: number;
}

interface TimingsFile {
  durations: Timing[];
}

const TIMINGS_PATH = path.join(process.cwd(), 'cypress', 'timings.json');
const TIMINGS_OLD_PATH = path.join(process.cwd(), 'cypress', 'timings-old.json');

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message);
}

function readTimings(filePath: string): TimingsFile {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

interface CleanupOptions {
  keepNew: boolean;
  reason: string;
}

function cleanupFiles({ keepNew, reason }: CleanupOptions): void {
  if (keepNew) {
    log(`Keeping new timings: ${reason}`);
    fs.unlinkSync(TIMINGS_OLD_PATH);
  } else {
    log(`Reverting to old timings: ${reason}`);
    fs.unlinkSync(TIMINGS_PATH);
    fs.renameSync(TIMINGS_OLD_PATH, TIMINGS_PATH);
  }
}

function compareTimings(): void {
  const oldTimings = readTimings(TIMINGS_OLD_PATH);
  const newTimings = readTimings(TIMINGS_PATH);

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
