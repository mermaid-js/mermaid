import { generate } from 'langium-cli';

export async function generateLangium() {
  await generate({ file: `./packages/parser/langium-config.json` });
}
