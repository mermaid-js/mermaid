/* eslint-disable no-console */
import type { Metafile } from 'esbuild';
import { readFile } from 'fs/promises';
import { globby } from 'globby';
import { markdownTable } from 'markdown-table';
export const getSizes = (metafile: Metafile) => {
  const { outputs } = metafile;
  const sizes = Object.keys(outputs)
    .filter((key) => key.endsWith('js') && !key.includes('chunk'))
    .map((key) => {
      const { bytes } = outputs[key];
      return [key.replace('dist/', ''), bytes];
    });
  return sizes;
};

const readStats = async (path: string): Promise<Record<string, number>> => {
  const files = await globby(path);
  const contents = await Promise.all(files.map((file) => readFile(file, 'utf-8')));
  const sizes = contents.flatMap((content) => getSizes(JSON.parse(content)));
  return Object.fromEntries(sizes);
};

const formatBytes = (bytes: number): string => {
  if (bytes == 0) {
    return '0 Bytes';
  }
  bytes = Math.abs(bytes);
  const base = 1024;
  const decimals = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(base));
  return parseFloat((bytes / Math.pow(base, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const formatSize = (bytes: number): string => {
  const formatted = formatBytes(bytes);
  if (formatted.includes('Bytes')) {
    return formatted;
  }
  return `${formatBytes(bytes)} (${bytes} Bytes)`;
};

const percentageDifference = (oldValue: number, newValue: number): string => {
  const difference = Math.abs(newValue - oldValue);
  const avg = (newValue + oldValue) / 2;
  const percentage = (difference / avg) * 100;
  const roundedPercentage = percentage.toFixed(2); // Round to two decimal places
  if (roundedPercentage === '0.00') {
    return '0.00%';
  }
  const sign = newValue > oldValue ? '+' : '-';
  return `${sign}${roundedPercentage}%`;
};

const main = async () => {
  const oldStats = await readStats('./cypress/snapshots/stats/base/**/*.json');
  const newStats = await readStats('./cypress/snapshots/stats/head/**/*.json');
  const diff = Object.entries(newStats)
    .filter(([, value]) => value > 2048)
    .map(([key, value]) => {
      const oldValue = oldStats[key];
      const delta = value - oldValue;
      const output = [
        key,
        formatSize(oldValue),
        formatSize(value),
        formatSize(delta),
        percentageDifference(oldValue, value),
      ];
      return output;
    })
    .filter(([, , , delta]) => delta !== '0 Bytes');
  if (diff.length === 0) {
    console.log('No changes in bundle sizes');
    return;
  }
  console.log(
    markdownTable([['File', 'Previous Size', 'New Size', 'Difference', '% Change'], ...diff])
  );
};

void main().catch((e) => console.error(e));
