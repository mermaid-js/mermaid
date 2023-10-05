/**
 * TODO - finish documenting
 *
 * TODO update_existing_files
 *
 * TODO what about overwriting existing files? Prompt/y/n/all ?
 * TODO: rollback?
 *
 */

import { outputFile } from 'fs-extra';
import { readFileSync } from 'fs';
import { globbySync } from 'globby';

import camelCase from 'lodash-es/camelCase.js';
import deburr from 'lodash-es/deburr.js';
import kebabCase from 'lodash-es/kebabCase.js';
import padEnd from 'lodash-es/padEnd.js';
// import { camelCase, deburr, kebabCase, padEnd } from 'lodash';

import { basename, dirname, extname, join, normalize, relative, resolve } from 'path';

import Handlebars from 'handlebars';

// Makes it clear that we are expecting a full path and file name:
type FullPathAndFilename = string;

// Template variables that can be replaced
export type ReplacementData = {
  diagramHumanName: string;
  diagramFolderName: string;
  diagramFileNamePrefix: string;
};

export type DirNames = {
  rootAbsDir: string;
  templatesAbsDir: string;
  destinationAbsDir: string;
};

// This is what is replaced in the file names
const FN_PLACEHOLDER = 'DIAGRAM';

// Glob used to get a list of all template files.
export const TEMPLATES_GLOB = join('**', '*.*.hbs');

// Amount to right pad the filename when showing the progress messages
const FN_PADDING = 30;

// -----------
// Directories

const TEMPLATES_DIR_NAME = 'templates';

// Directory that contains the template files. Is a _relative_ path.
// TODO is there any way to use `__dir` so we can use the location of _this file_?
export const TEMPLATES_REL_DIR = join(
  'packages',
  'mermaid',
  'scripts',
  'new-diagram-type-generator',
  TEMPLATES_DIR_NAME
);

// Default root path. Should be the top of the mermaid project, based on the location of this file.
const DEFAULT_ROOT_DIR = resolve(join('.', '..', '..', '..', '..'));

/**
 * This is the main (entry) function that generates the initial directories and files for a new diagram.
 *
 *
 * Directories in path names are created if they don't exist.
 *
 * @param humanDiagramName
 * @param destinationDir - Top level directory for files generated.
 *    (Having this makes it much easier to test. It won't pollute the real mermaid directory.)
 *    Defaults to the top level directory of the entire mermaid project, based on the location of this file.
 * @param mermaidProjectRoot - Top level directory of the entire mermaid project. Used to find templates and files to update.
 *    Defaults to the top level directory of the entire mermaid project, based on the location of this file.
 * @param beSilent - Whether or not to show information messages. This does not affect error messages.
 *
 * TODO provide an output stream? or use a logger?
 * TODO catch errors
 */
export function generateDiagramTypeSkeleton(
  humanDiagramName: string,
  destinationDir = DEFAULT_ROOT_DIR,
  mermaidProjectRoot = DEFAULT_ROOT_DIR,
  beSilent = false
): void {
  const diagramFolderName = validDirName(humanDiagramName);
  const diagramFileNamePrefix = validFilenamePart(humanDiagramName);
  const replacementData: ReplacementData = {
    diagramHumanName: humanDiagramName,
    diagramFolderName: diagramFolderName,
    diagramFileNamePrefix: diagramFileNamePrefix,
  };
  const dirs: DirNames = setDirs(mermaidProjectRoot, destinationDir);

  show(
    `\nGenerating files and directories for the new diagram type "${humanDiagramName}":`,
    beSilent
  );
  show(`  Files will be written to ${relative('.', dirs.destinationAbsDir)}:`, beSilent);
  show(`  Directories will be created if needed.\n`, beSilent);

  createFilesFromTemplates(dirs, replacementData);
  // updateExistingFiles(dirs, replacementData);

  show(
    '\n  Done.\n  [Probably need some general instruction or pointers here.] \n  Now go forth and write tests, code, and documentation.\n'
  );
}

/**
 * Create all files and directories needed.
 * Files are created from template files in the templates directory.
 * Files and directories are created under the `dirs.destinationAbsDir`
 *
 * @param dirs
 * @param replacementData
 * @param beSilent - Whether or not to show information messages. This does not affect error messages.
 */
function createFilesFromTemplates(
  dirs: DirNames,
  replacementData: ReplacementData,
  beSilent = false
): void {
  const templateFiles = getAllTemplateFNames(dirs);

  const filenameRegExp = new RegExp(FN_PLACEHOLDER, 'g');
  if (templateFiles !== null) {
    for (const templateFileName of templateFiles) {
      createActualFileFrom(templateFileName, replacementData, dirs, filenameRegExp, beSilent);
    }
  }
}

/**
 * Create the directory paths needed.  All are absolute paths.
 *
 * (This is exported so it can be tested.)
 * @internal
 *
 * @param rootDir - should be the top directory of the entire mermaid project. Default is '.'.
 * @param destinationDir - top directory of where generated files will be written out. Default is '.'.
 * @returns {DirNames} - the directory names created
 */
export function setDirs(rootDir = '.', destinationDir = '.'): DirNames {
  const realRoot = resolve(rootDir);
  return {
    rootAbsDir: realRoot,
    templatesAbsDir: resolve(realRoot, TEMPLATES_REL_DIR),
    destinationAbsDir: resolve(destinationDir),
  };
}

/**
 * Get all template file names using TEMPLATES_GLOB.
 *
 * @throws Error if cannot get the list of template files with globby
 * @returns {string[]} list of template file names wth the pat
 */
function getAllTemplateFNames(dirs: DirNames): string[] {
  const resolvedTemplatesDir = resolve(dirs.templatesAbsDir, TEMPLATES_GLOB);
  return globbySync(resolvedTemplatesDir);
}

/**
 *
 * @param templateFN
 * @param replacementData
 * @param dirs
 * @param filenameRegExp
 * @param beSilent - Whether or not to show information messages. This does not affect error messages.
 *
 * @throws Error if there is some failure encountered.
 */
function createActualFileFrom(
  templateFN: FullPathAndFilename,
  replacementData: ReplacementData,
  dirs: DirNames,
  filenameRegExp: RegExp,
  beSilent = false
): void {
  try {
    const replacedContents = fillTemplateFileWith(templateFN, replacementData);
    const destinationFN = normalize(
      templateFN
        .replace(extname(templateFN), '')
        .replace(filenameRegExp, replacementData.diagramFileNamePrefix)
        .replace(dirs.templatesAbsDir, dirs.destinationAbsDir)
    );
    // pad the filename so that the directories will be aligned
    // show the destination directory relative to . to make the output easier to read
    show(
      `   writing ${padEnd(basename(destinationFN), FN_PADDING)} to ${relative(
        '.',
        dirname(destinationFN)
      )}`,
      beSilent
    );
    outputFile(destinationFN, replacedContents).catch((error) => {
      throw error;
    });
  } catch (error) {
    show(`${error}`, beSilent);
    throw error;
  }
}

/**
 *
 * @param templateFN - full path and filename of the template file to use
 * @param replacementData - data to be inserted into template file
 * @returns {string} - the string with placeholders replaced
 */
function fillTemplateFileWith(
  templateFN: FullPathAndFilename,
  replacementData: ReplacementData
): string {
  const templateContents = readFileSync(templateFN, 'utf8');
  return replaceTemplateValues(templateContents, replacementData);
}

/**
 * Given a Handlebars template string, compile it and replace placeholders with real data.
 * Return the resulting string
 *
 * @param templateSource
 * @param replacementData
 * @returns The string with the placeholders replaced with data
 */
function replaceTemplateValues(templateSource: string, replacementData = {}): string {
  const template = Handlebars.compile(templateSource);
  return template(replacementData);
}

// function updateExistingFiles(_dirs: DirNames, _replacementData: ReplacementData): void {
//   // FIXME TBD
//   // demos/index.html
//   // packages/mermaid/src/
//   //   diagram-api/diagram-orchestration.ts
//   //   docs/.vitepress/config.ts
// }

/**
 * Create a string that can be used in a file name.
 *
 * @param newDiagramName
 * @returns camelCase string with non A-Za-z0-9 chars removed
 */
function validFilenamePart(newDiagramName: string): string {
  return camelCase(deburr(newDiagramName).replace(/\W/, ''));
}

/**
 * Create a string that can be used as a directory name.
 *
 * @param newDiagramName
 * @returns a kebabCase string with non A-Za-z0-9 chars removed
 */
function validDirName(newDiagramName: string): string {
  return kebabCase(deburr(newDiagramName).replace(/\W/, ''));
}

/**
 * Display a message to the console
 * TODO - could replace this with a provided stream or log
 *
 * @param msg - the message to display
 * @param beSilent - Whether or not to show the message.
 */
function show(msg: string, beSilent = false): void {
  if (!beSilent) {
    // eslint-disable-next-line no-console
    console.log(msg);
  }
}
