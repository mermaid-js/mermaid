/* eslint-disable no-console */
import { readFile } from 'fs/promises';
import { globby } from 'globby';
import { markdownTable } from 'markdown-table';

interface RunTimes {
  [key: string]: number;
}
interface TestResult {
  [key: string]: RunTimes;
}

const getRuntimes = (csv: string): RunTimes => {
  const lines = csv.split('\n');
  const runtimes: RunTimes = {};
  for (const line of lines) {
    const [testName, timeTaken] = line.split(',');
    if (testName && timeTaken) {
      runtimes[testName] = Number(timeTaken);
    }
  }
  return runtimes;
};

const readStats = async (path: string): Promise<TestResult> => {
  const files = await globby(path);
  const contents = await Promise.all(
    files.map(async (file) => [file, await readFile(file, 'utf-8')])
  );
  const sizes = contents.map(([file, content]) => [file.split('/').pop(), getRuntimes(content)]);
  return Object.fromEntries(sizes);
};

const percentChangeThreshold = 5;
const percentageDifference = (
  oldValue: number,
  newValue: number
): { change: string; crossedThreshold: boolean } => {
  const difference = Math.abs(newValue - oldValue);
  const avg = (newValue + oldValue) / 2;
  const percentage = (difference / avg) * 100;
  const roundedPercentage = percentage.toFixed(2); // Round to two decimal places
  if (roundedPercentage === '0.00') {
    return { change: '0.00%', crossedThreshold: false };
  }
  const sign = newValue > oldValue ? '+' : '-';
  return {
    change: `${sign}${roundedPercentage}%`,
    crossedThreshold: percentage > percentChangeThreshold,
  };
};

const main = async () => {
  const oldStats = await readStats('./cypress/snapshots/runtimes/base/**/*.csv');
  const newStats = await readStats('./cypress/snapshots/runtimes/head/**/*.csv');
  const fullData: string[][] = [];
  const changed: string[][] = [];
  for (const [fileName, runtimes] of Object.entries(newStats)) {
    const oldStat = oldStats[fileName];
    if (!oldStat) {
      continue;
    }
    for (const [testName, timeTaken] of Object.entries(runtimes)) {
      const oldTimeTaken = oldStat[testName];
      if (!oldTimeTaken) {
        continue;
      }
      const delta = timeTaken - oldTimeTaken;
      const { change, crossedThreshold } = percentageDifference(oldTimeTaken, timeTaken);
      const out = [
        fileName,
        testName,
        oldTimeTaken.toString(),
        timeTaken.toString(),
        change,
        `${delta.toString()}ms`,
      ];
      if (crossedThreshold) {
        changed.push(out);
        console.warn(`${testName} (${fileName}): ${timeTaken}ms (${delta}ms, ${change})`);
      }
      fullData.push(out);
    }
  }
  const headers = ['File', 'Test', 'Old Time', 'New Time', '% Change', 'Difference'];
  console.log(markdownTable([headers, ...changed]));
  console.log(`
  <details>
  <summary>Full Data</summary>
  ${markdownTable([headers, ...fullData])}
</details>
`);
};

void main().catch((e) => console.error(e));
