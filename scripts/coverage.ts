import { execFileSync } from 'child_process';
import { cp } from 'fs/promises';

const main = async () => {
  const coverageDir = 'coverage';
  const coverageFiles = ['vitest', 'playwright'].map(
    (dir) => `${coverageDir}/${dir}/coverage-final.json`
  );

  //copy coverage files from vitest and cypress to coverage folder
  await Promise.all(
    coverageFiles.map((file) => cp(file, `${coverageDir}/combined/${file.split('/')[1]}.json`))
  );

  execFileSync('npx', ['nyc', 'merge', 'coverage/combined', 'coverage/combined-final.json']);
  execFileSync('npx', [
    'nyc',
    'report',
    '-t',
    'coverage',
    '--report-dir',
    'coverage/html',
    '--reporter=html-spa',
  ]);
};

void main();
