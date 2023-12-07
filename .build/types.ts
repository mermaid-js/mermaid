import { packageOptions } from './common.js';
import { execSync } from 'child_process';

const buildType = (packageName: string) => {
  console.log(`Building types for ${packageName}`);
  try {
    const out = execSync(`tsc -p ./packages/${packageName}/tsconfig.json --emitDeclarationOnly`);
    out.length > 0 && console.log(out.toString());
  } catch (e) {
    console.error(e);
  }
};

for (const { packageName } of Object.values(packageOptions)) {
  buildType(packageName);
}
