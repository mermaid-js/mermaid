import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { $fetch } from 'ohmyfetch';

const pathContributors = new URL('../contributor-names.json', import.meta.url);
const getAvatarPath = (name: string) =>
  new URL(`../../public/user-avatars/${name}.png`, import.meta.url);
// const dirSponsors = resolve(docsDir, 'public/sponsors/')

let contributors: string[] = [];

async function download(url: string, fileName: URL) {
  if (fs.existsSync(fileName)) return;
  // eslint-disable-next-line no-console
  console.log('downloading', fileName);
  try {
    const image = await $fetch(url, { responseType: 'arrayBuffer' });
    await fs.writeFile(fileName, Buffer.from(image));
  } catch {}
}

async function fetchAvatars() {
  await fs.ensureDir(fileURLToPath(new URL('..', getAvatarPath('none'))));
  contributors = JSON.parse(await fs.readFile(pathContributors, { encoding: 'utf-8' }));

  await Promise.allSettled(
    contributors.map((name) =>
      download(`https://github.com/${name}.png?size=100`, getAvatarPath(name))
    )
  );
}

// async function fetchSponsors() {
// 	await fs.ensureDir(dirSponsors)
// 	await download('https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg', join(dirSponsors, 'antfu.svg'))
// 	await download('https://cdn.jsdelivr.net/gh/patak-dev/static/sponsors.svg', join(dirSponsors, 'patak-dev.svg'))
// 	await download('https://cdn.jsdelivr.net/gh/sheremet-va/static/sponsors.svg', join(dirSponsors, 'sheremet-va.svg'))
// }

fetchAvatars();
// fetchSponsors()
