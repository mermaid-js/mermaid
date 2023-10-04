/* eslint-disable no-console */

/**
 * @file Update the MERMAID_RELEASE_VERSION placeholder in the documentation source files with the current version of mermaid.
 * So contributors adding new features will only have to add the placeholder and not worry about updating the version number.
 *
 */
import { posix } from 'path';
import {
  getGlobs,
  getFilesFromGlobs,
  SOURCE_DOCS_DIR,
  readSyncedUTF8file,
  MERMAID_RELEASE_VERSION,
} from './docs.mjs';
import { writeFile } from 'fs/promises';

const verifyOnly: boolean = process.argv.includes('--verify');
const versionPlaceholder = '<MERMAID_RELEASE_VERSION>';

const main = async () => {
  const sourceDirGlob = posix.join('.', SOURCE_DOCS_DIR, '**');
  const mdFileGlobs = getGlobs([posix.join(sourceDirGlob, '*.md')]);
  mdFileGlobs.push('!**/community/development.md', '!**/community/code.md');
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
