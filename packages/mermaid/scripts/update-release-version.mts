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
} from '../src/docs.mjs';
import { writeFile } from 'fs/promises';

const main = async () => {
  const sourceDirGlob = posix.join('.', SOURCE_DOCS_DIR, '**');
  const mdFileGlobs = getGlobs([posix.join(sourceDirGlob, '*.md')]);
  mdFileGlobs.push('!**/community/development.md');
  const mdFiles = await getFilesFromGlobs(mdFileGlobs);
  mdFiles.sort();
  for (const mdFile of mdFiles) {
    const content = readSyncedUTF8file(mdFile);
    const updatedContent = content.replace(/<MERMAID_RELEASE_VERSION>/g, MERMAID_RELEASE_VERSION);
    if (content !== updatedContent) {
      await writeFile(mdFile, updatedContent);
      console.log(`Updated MERMAID_RELEASE_VERSION in ${mdFile}`);
    }
  }
};

void main();
