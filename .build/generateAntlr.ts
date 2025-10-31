import { generateFromConfig } from './antlr-cli.js';

export async function generateAntlr() {
  await generateFromConfig('./packages/parser/antlr-config.json');
}
