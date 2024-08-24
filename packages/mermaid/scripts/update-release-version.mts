/* eslint-disable no-console */

/**
 * @file Update the MERMAID_RELEASE_VERSION placeholder in the documentation source files with the current version of mermaid.
 * So contributors adding new features will only have to add the placeholder and not worry about updating the version number.
 *
 */
import { readFile, writeFile } from 'fs/promises';
import { posix } from 'path';
import {
  getFilesFromGlobs,
  getGlobs,
  MERMAID_RELEASE_VERSION,
  readSyncedUTF8file,
  SOURCE_DOCS_DIR,
} from './docs.mjs';

const verifyOnly: boolean = process.argv.includes('--verify');
const versionPlaceholder = '<MERMAID_RELEASE_VERSION>';

const verifyDocumentation = async () => {
  const fileContent = await readFile('./src/docs/community/contributing.md', 'utf-8');
  if (!fileContent.includes(versionPlaceholder)) {
    console.error(
      `The placeholder ${versionPlaceholder} is not present in the contributing.md file.`
    );
    process.exit(1);
  }
};

const main = async () => {
  await verifyDocumentation();
  const sourceDirGlob = posix.join('.', SOURCE_DOCS_DIR, '**');
  const mdFileGlobs = getGlobs([posix.join(sourceDirGlob, '*.md')]);
  mdFileGlobs.push('!**/community/contributing.md');
  const mdFiles = await getFilesFromGlobs(mdFileGlobs);
  mdFiles.sort();
  const mdFilesWithPlaceholder: string[] = [];
  for (const mdFile of mdFiles) {
    const content = readSyncedUTF8file(mdFile);
    if (content.includes(versionPlaceholder)) {
      mdFilesWithPlaceholder.push(mdFile);
    }
  }

  if (mdFilesWithPlaceholder.length === 0) {
    return;
  }

  if (verifyOnly) {
    console.log(
      `${mdFilesWithPlaceholder.length} file(s) were found with the placeholder ${versionPlaceholder}. Run \`pnpm --filter mermaid docs:release-version\` to update them.`
    );
    process.exit(1);
  }

  for (const mdFile of mdFilesWithPlaceholder) {
    const content = readSyncedUTF8file(mdFile);
    const newContent = content.replace(versionPlaceholder, MERMAID_RELEASE_VERSION);
    await writeFile(mdFile, newContent);
  }
};

void main();
