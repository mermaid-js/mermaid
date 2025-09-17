/* eslint-disable no-console */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { readFile, mkdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const execAsync = promisify(exec);

interface AntlrGrammarConfig {
  id: string;
  grammar: string;
  outputDir: string;
  language: string;
  generateVisitor?: boolean;
  generateListener?: boolean;
}

interface AntlrConfig {
  projectName: string;
  grammars: AntlrGrammarConfig[];
  mode: string;
}

export async function generateFromConfig(configFile: string): Promise<void> {
  const configPath = resolve(configFile);

  if (!existsSync(configPath)) {
    throw new Error(`ANTLR config file not found: ${configPath}`);
  }

  const configContent = await readFile(configPath, 'utf-8');
  const config: AntlrConfig = JSON.parse(configContent);

  const configDir = dirname(configPath);

  for (const grammarConfig of config.grammars) {
    await generateGrammar(grammarConfig, configDir);
  }
}

async function generateGrammar(grammarConfig: AntlrGrammarConfig, baseDir: string): Promise<void> {
  const grammarFile = resolve(baseDir, grammarConfig.grammar);
  const outputDir = resolve(baseDir, grammarConfig.outputDir);

  // Check if grammar file exists
  try {
    await access(grammarFile);
  } catch {
    throw new Error(`Grammar file not found: ${grammarFile}`);
  }

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Build ANTLR command arguments

  // eslint-disable-next-line @cspell/spellchecker
  const args = ['antlr-ng', `-Dlanguage=${grammarConfig.language}`];

  if (grammarConfig.generateVisitor) {
    args.push('--generate-visitor');
  }

  if (grammarConfig.generateListener) {
    args.push('--generate-listener');
  }

  args.push('-o', `"${outputDir}"`, `"${grammarFile}"`);

  const command = `npx ${args.join(' ')}`;

  try {
    await execAsync(command);
    console.log(`Generated ANTLR files for ${grammarConfig.id}`);
  } catch (error) {
    console.error(`Failed to generate ANTLR files for ${grammarConfig.id}:`);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const configFile = process.argv[2] || './packages/parser/antlr-config.json';
  try {
    await generateFromConfig(configFile);
    console.log('ANTLR generation completed successfully!');
  } catch (error) {
    console.error('ANTLR generation failed:', error.message);
  }
}
