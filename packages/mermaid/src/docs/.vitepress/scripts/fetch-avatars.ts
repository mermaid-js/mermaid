/* eslint-disable no-console */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'url';

const pathContributors = new URL('../contributor-names.json', import.meta.url);
const getAvatarPath = (name: string) =>
  new URL(`../../public/user-avatars/${name}.png`, import.meta.url);

let contributors: string[] = [];

async function download(url: string, fileName: URL) {
  if (existsSync(fileName)) {
    return;
  }
  console.log('downloading', url);
  try {
    const image = await fetch(url);
    await writeFile(fileName, Buffer.from(await image.arrayBuffer()));
  } catch (error) {
    console.error(error);
  }
}

async function fetchAvatars() {
  await mkdir(fileURLToPath(new URL(getAvatarPath('none'))).replace('none.png', ''), {
    recursive: true,
  });
  contributors = JSON.parse(await readFile(pathContributors, { encoding: 'utf-8' }));
  for (const name of contributors) {
    await download(`https://github.com/${name}.png?size=100`, getAvatarPath(name));
  }
}

fetchAvatars();
