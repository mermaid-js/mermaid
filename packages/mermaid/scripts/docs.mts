/* eslint-disable no-console */

/**
 * @file Transform documentation source files into files suitable for publishing and optionally copy
 *   the transformed files from the source directory to the directory used for the final, published
 *   documentation directory. The list of files transformed and copied to final documentation
 *   directory are logged to the console. If a file in the source directory has the same contents in
 *   the final directory, nothing is done (the final directory is up-to-date).
 * @example
 *   docs
 *   Run with no option flags
 *
 * @example
 *   docs --verify
 *   If the --verify option is used, it only _verifies_ that the final directory has been updated with the transformed files in the source directory.
 *   No files will be copied to the final documentation directory, but the list of files to be changed is shown on the console.
 *   If the final documentation directory does not have the transformed files from source directory
 *   - a message to the console will show that this command should be run without the --verify flag so that the final directory is updated, and
 *   - it will return a fail exit code (1)
 *
 * @example
 *   docs --git
 *   If the --git option is used, the command `git add docs` will be run after all transformations (and/or verifications) have completed successfully
 *   If not files were transformed, the git command is not run.
 *
 * @todo Ensure that the documentation source and final paths are correct by using process.cwd() to
 *   get their absolute paths. Ensures that the location of those 2 directories is not dependent on
 *   where this file resides.
 *
 */
// @ts-ignore: we're importing internal jsonschema2md functions
import { default as schemaLoader } from '@adobe/jsonschema2md/lib/schemaProxy.js';
// @ts-ignore: we're importing internal jsonschema2md functions
import { default as traverseSchemas } from '@adobe/jsonschema2md/lib/traverseSchema.js';
// @ts-ignore: we're importing internal jsonschema2md functions
import { default as buildMarkdownFromSchema } from '@adobe/jsonschema2md/lib/markdownBuilder.js';
// @ts-ignore: we're importing internal jsonschema2md functions
import { default as jsonSchemaReadmeBuilder } from '@adobe/jsonschema2md/lib/readmeBuilder.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, rmdirSync } from 'fs';
import { exec } from 'child_process';
import { globby } from 'globby';
import { JSDOM } from 'jsdom';
import { dump, load, JSON_SCHEMA } from 'js-yaml';
import type { Code, ListItem, Root, Text, YAML } from 'mdast';
import { posix, dirname, relative, join } from 'path';
import prettier from 'prettier';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import chokidar from 'chokidar';
import mm from 'micromatch';
// @ts-ignore No typescript declaration file
import flatmap from 'unist-util-flatmap';
import { visit } from 'unist-util-visit';

export const MERMAID_RELEASE_VERSION = JSON.parse(readFileSync('../mermaid/package.json', 'utf8'))
  .version as string;
const MERMAID_MAJOR_VERSION = MERMAID_RELEASE_VERSION.split('.')[0];
const CDN_URL = 'https://cdn.jsdelivr.net/npm'; // 'https://unpkg.com';

const MERMAID_KEYWORD = 'mermaid';
const MERMAID_CODE_ONLY_KEYWORD = 'mermaid-example';
const MERMAID_DIAGRAM_ONLY = 'mermaid-nocode';

// These keywords will produce both a mermaid diagram and a code block with the diagram source
const MERMAID_EXAMPLE_KEYWORDS = [MERMAID_KEYWORD, 'mmd', MERMAID_CODE_ONLY_KEYWORD]; // 'mmd' is an old keyword that used to be used

// These will be transformed into block quotes
const BLOCK_QUOTE_KEYWORDS = ['note', 'tip', 'warning', 'danger'];

// options for running the main command
const verifyOnly: boolean = process.argv.includes('--verify');
const git: boolean = process.argv.includes('--git');
const watch: boolean = process.argv.includes('--watch');
const vitepress: boolean = process.argv.includes('--vitepress');
const noHeader: boolean = process.argv.includes('--noHeader') || vitepress;

// These paths are from the root of the mono-repo, not from the mermaid subdirectory
export const SOURCE_DOCS_DIR = 'src/docs';
const FINAL_DOCS_DIR = vitepress ? 'src/vitepress' : '../../docs';

const LOGMSG_TRANSFORMED = 'transformed';
const LOGMSG_TO_BE_TRANSFORMED = 'to be transformed';
const LOGMSG_COPIED = `, and copied to ${FINAL_DOCS_DIR}`;

const WARN_DOCSDIR_DOESNT_MATCH = `Changed files were transformed in ${SOURCE_DOCS_DIR} but do not match the files in ${FINAL_DOCS_DIR}. Please run 'pnpm --filter mermaid run docs:build' after making changes to ${SOURCE_DOCS_DIR} to update the ${FINAL_DOCS_DIR} directory with the transformed files.`;

const prettierConfig = (await prettier.resolveConfig('.')) ?? {};
// From https://github.com/vuejs/vitepress/blob/428eec3750d6b5648a77ac52d88128df0554d4d1/src/node/markdownToVue.ts#L20-L21
const includesRE = /<!--\s*@include:\s*(.*?)\s*-->/g;
const includedFiles: Set<string> = new Set();

const filesTransformed: Set<string> = new Set();

const generateHeader = (file: string): string => {
  // path from file in docs/* to repo root, e.g ../ or ../../ */
  const relativePath = relative(file, SOURCE_DOCS_DIR).replaceAll('\\', '/');
  const filePathFromRoot = posix.join('/packages/mermaid', file);
  const sourcePathRelativeToGenerated = posix.join(relativePath, filePathFromRoot);
  return `
> **Warning**
> ## THIS IS AN AUTOGENERATED FILE. DO NOT EDIT. 
> ## Please edit the corresponding file in [${filePathFromRoot}](${sourcePathRelativeToGenerated}).`;
};

/**
 * Given a source file name and path, return the documentation destination full path and file name
 * Create the destination path if it does not already exist.
 *
 * @param {string} file - Name of the file (including full path)
 * @returns {string} Name of the file with the path changed from the source directory to final
 *   documentation directory
 * @todo Possible Improvement: combine with lint-staged to only copy files that have changed
 */
const changeToFinalDocDir = (file: string): string => {
  const newDir = file.replace(SOURCE_DOCS_DIR, FINAL_DOCS_DIR);
  mkdirSync(dirname(newDir), { recursive: true });
  return newDir;
};

/**
 * Log messages to the console showing if the transformed file copied to the final documentation
 * directory or still needs to be copied.
 *
 * @param {string} filename Name of the file that was transformed
 * @param {boolean} wasCopied Whether or not the file was copied
 */
const logWasOrShouldBeTransformed = (filename: string, wasCopied: boolean) => {
  const changeMsg = wasCopied ? LOGMSG_TRANSFORMED : LOGMSG_TO_BE_TRANSFORMED;
  let logMsg: string;
  logMsg = `  File ${changeMsg}: ${filename.replace(FINAL_DOCS_DIR, SOURCE_DOCS_DIR)}`;
  if (wasCopied) {
    logMsg += LOGMSG_COPIED;
  }
  console.log(logMsg);
};

/**
 * If the file contents were transformed, set the _filesWereTransformed_ flag to true and copy the
 * transformed contents to the final documentation directory if the doCopy flag is true. Log
 * messages to the console.
 *
 * @param filename Name of the file that will be verified
 * @param doCopy?=false Whether we should copy that transformedContents to the final
 *   documentation directory. Default is `false`
 * @param transformedContent? New contents for the file
 */
const copyTransformedContents = (filename: string, doCopy = false, transformedContent?: string) => {
  const fileInFinalDocDir = changeToFinalDocDir(filename);
  const existingBuffer = existsSync(fileInFinalDocDir)
    ? readFileSync(fileInFinalDocDir)
    : Buffer.from('#NEW FILE#');
  const newBuffer = transformedContent ? Buffer.from(transformedContent) : readFileSync(filename);
  if (existingBuffer.equals(newBuffer)) {
    return; // Files are same, skip.
  }

  filesTransformed.add(fileInFinalDocDir);

  if (doCopy) {
    writeFileSync(fileInFinalDocDir, newBuffer);
  }
  logWasOrShouldBeTransformed(fileInFinalDocDir, doCopy);
};

export const readSyncedUTF8file = (filename: string): string => {
  return readFileSync(filename, 'utf8');
};

const blockIcons: Record<string, string> = {
  tip: '💡 ',
  danger: '‼️ ',
};

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

export const transformToBlockQuote = (
  content: string,
  type: string,
  customTitle?: string | null
) => {
  if (vitepress) {
    const vitepressType = type === 'note' ? 'info' : type;
    return `::: ${vitepressType} ${customTitle || ''}\n${content}\n:::`;
  } else {
    const icon = blockIcons[type] || '';
    const title = `${icon}${customTitle || capitalize(type)}`;
    return `> **${title}** \n> ${content.replace(/\n/g, '\n> ')}`;
  }
};

const injectPlaceholders = (text: string): string =>
  text.replace(/<MERMAID_VERSION>/g, MERMAID_MAJOR_VERSION).replace(/<CDN_URL>/g, CDN_URL);

const transformIncludeStatements = (file: string, text: string): string => {
  // resolve includes - src https://github.com/vuejs/vitepress/blob/428eec3750d6b5648a77ac52d88128df0554d4d1/src/node/markdownToVue.ts#L65-L76
  return text.replace(includesRE, (m, m1) => {
    try {
      const includePath = join(dirname(file), m1).replaceAll('\\', '/');
      const content = readSyncedUTF8file(includePath);
      includedFiles.add(changeToFinalDocDir(includePath));
      return content;
    } catch (error) {
      throw new Error(`Failed to resolve include "${m1}" in "${file}": ${error}`);
    }
  });
};

/** Options for {@link transformMarkdownAst} */
interface TransformMarkdownAstOptions {
  /**
   * Used to indicate the original/source file.
   */
  originalFilename: string;
  /** If `true`, add a warning that the file is autogenerated */
  addAutogeneratedWarning?: boolean;
  /** If `true`, adds an `editLink: "https://..."` YAML frontmatter field */
  addEditLink?: boolean;
  /**
   * If `true`, remove the YAML metadata from the Markdown input.
   * Generally, YAML metadata is only used for Vitepress.
   */
  removeYAML?: boolean;
}

/**
 * Remark plugin that transforms mermaid repo markdown to Vitepress/GFM markdown.
 *
 * For any AST node that is a code block: transform it as needed:
 * - blocks marked as MERMAID_DIAGRAM_ONLY will be set to a 'mermaid' code block so it will be rendered as (only) a diagram
 * - blocks marked as MERMAID_EXAMPLE_KEYWORDS will be copied and the original node will be a code only block and the copy with be rendered as the diagram
 * - blocks marked as BLOCK_QUOTE_KEYWORDS will be transformed into block quotes
 *
 * If `addAutogeneratedWarning` is `true`, generates a header stating that this file is autogenerated.
 *
 * @returns plugin function for Remark
 */
export function transformMarkdownAst({
  originalFilename,
  addAutogeneratedWarning,
  addEditLink,
  removeYAML,
}: TransformMarkdownAstOptions) {
  return (tree: Root, _file?: any): Root => {
    const astWithTransformedBlocks = flatmap(tree, (node: Code) => {
      if (node.type !== 'code' || !node.lang) {
        return [node]; // no transformation if this is not a code block
      }

      if (node.lang === MERMAID_DIAGRAM_ONLY) {
        // Set the lang to 'mermaid' so it will be rendered as a diagram.
        node.lang = MERMAID_KEYWORD;
        return [node];
      } else if (MERMAID_EXAMPLE_KEYWORDS.includes(node.lang)) {
        // If Vitepress, return only the original node with the language now set to 'mermaid-example' (will be rendered using custom renderer)
        // Else Return 2 nodes:
        //   1. the original node with the language now set to 'mermaid-example' (will be rendered as code), and
        //   2. a copy of the original node with the language set to 'mermaid' (will be rendered as a diagram)
        node.lang = MERMAID_CODE_ONLY_KEYWORD;
        return vitepress ? [node] : [node, Object.assign({}, node, { lang: MERMAID_KEYWORD })];
      }

      // Transform these blocks into block quotes.
      if (BLOCK_QUOTE_KEYWORDS.includes(node.lang)) {
        return [remark.parse(transformToBlockQuote(node.value, node.lang, node.meta))];
      }

      return [node]; // default is to do nothing to the node
    }) as Root;

    if (addAutogeneratedWarning) {
      // Add the header to the start of the file
      const headerNode = remark.parse(generateHeader(originalFilename)).children[0];
      if (astWithTransformedBlocks.children[0].type === 'yaml') {
        // insert header after the YAML frontmatter if it exists
        astWithTransformedBlocks.children.splice(1, 0, headerNode);
      } else {
        astWithTransformedBlocks.children.unshift(headerNode);
      }
    }

    if (addEditLink) {
      // add originalFilename as custom editLink in YAML frontmatter
      let yamlFrontMatter: YAML;
      if (astWithTransformedBlocks.children[0].type === 'yaml') {
        yamlFrontMatter = astWithTransformedBlocks.children[0];
      } else {
        yamlFrontMatter = {
          type: 'yaml',
          value: '',
        };
        astWithTransformedBlocks.children.unshift(yamlFrontMatter);
      }
      const filePathFromRoot = posix.join('packages/mermaid', originalFilename);
      yamlFrontMatter.value = dump({
        ...(load(yamlFrontMatter.value, { schema: JSON_SCHEMA }) as
          | Record<string, unknown>
          | undefined),
        editLink: `https://github.com/mermaid-js/mermaid/edit/develop/${filePathFromRoot}`,
      });
    }

    if (removeYAML) {
      const firstNode = astWithTransformedBlocks.children[0];
      if (firstNode.type == 'yaml') {
        // YAML is currently only used for Vitepress metadata, so we should remove it for GFM output
        astWithTransformedBlocks.children.shift();
      }
    }

    return astWithTransformedBlocks;
  };
}

/**
 * Transform a markdown file and write the transformed file to the directory for published
 * documentation
 *
 * 1. include any included files (copy and insert the source)
 * 2. Add a `mermaid-example` block before every `mermaid` or `mmd` block On the main documentation site (one
 *    place where the documentation is published), this will show the code for the mermaid diagram
 * 3. Transform blocks to block quotes as needed
 * 4. Add the text that says the file is automatically generated
 * 5. Use prettier to format the file.
 * 6. Verify that the file has been changed and write out the changes
 *
 * @param file {string} name of the file that will be verified
 */
const transformMarkdown = async (file: string) => {
  const doc = injectPlaceholders(transformIncludeStatements(file, readSyncedUTF8file(file)));

  let transformed = remark()
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml']) // support YAML front-matter in Markdown
    .use(transformMarkdownAst, {
      // mermaid project specific plugin
      originalFilename: file,
      addAutogeneratedWarning: !noHeader,
      addEditLink: noHeader,
      removeYAML: !noHeader,
    })
    .processSync(doc)
    .toString();

  if (vitepress && file === 'src/docs/index.md') {
    // Skip transforming index if vitepress is enabled
    transformed = doc;
  }

  const formatted = await prettier.format(transformed, {
    parser: 'markdown',
    ...prettierConfig,
  });
  copyTransformedContents(file, !verifyOnly, formatted);
};

/**
 * Transforms the given JSON Schema into Markdown documentation
 */
async function transformJsonSchema(file: string) {
  const yamlContents = readSyncedUTF8file(file);
  const jsonSchema = load(yamlContents, {
    filename: file,
    // only allow JSON types in our YAML doc (will probably be default in YAML 1.3)
    // e.g. `true` will be parsed a boolean `true`, `True` will be parsed as string `"True"`.
    schema: JSON_SCHEMA,
  });

  /** Location of the `schema.yaml` files */
  const SCHEMA_INPUT_DIR = 'src/schemas/';
  /**
   * Location to store the generated `schema.json` file for the website
   *
   * Because Vitepress doesn't handle bundling `.json` files properly, we need
   * to instead place it into a `public/` subdirectory.
   */
  const SCHEMA_OUTPUT_DIR = 'src/docs/public/schemas/';
  const VITEPRESS_PUBLIC_DIR = 'src/docs/public';
  /**
   * Location to store the generated Schema Markdown docs.
   * Links to JSON Schemas should automatically be rewritten to point to
   * `SCHEMA_OUTPUT_DIR`.
   */
  const SCHEMA_MARKDOWN_OUTPUT_DIR = join('src', 'docs', 'config', 'schema-docs');

  // write .schema.json files
  const jsonFileName = file
    .replace('.schema.yaml', '.schema.json')
    .replace(SCHEMA_INPUT_DIR, SCHEMA_OUTPUT_DIR);
  copyTransformedContents(jsonFileName, !verifyOnly, JSON.stringify(jsonSchema, undefined, 2));

  const schemas = traverseSchemas([schemaLoader()(jsonFileName, jsonSchema)]);

  // ignore output of this function
  // for some reason, without calling this function, we get some broken links
  // this is probably a bug in @adobe/jsonschema2md
  jsonSchemaReadmeBuilder({ readme: true })(schemas);

  // write Markdown files
  const markdownFiles = buildMarkdownFromSchema({
    header: true,
    // links,
    includeProperties: ['tsType'], // Custom TypeScript type
    exampleFormat: 'json',
    // skipProperties,
    /**
     * Automatically rewrite schema paths passed to `schemaLoader`
     * (e.g. src/docs/schemas/config.schema.json)
     * to relative links (e.g. /schemas/config.schema.json)
     *
     * See https://vitepress.vuejs.org/guide/asset-handling
     *
     * @param origin - Original schema path (relative to this script).
     * @returns New absolute Vitepress path to schema
     */
    rewritelinks: (origin: string) => {
      return `/${relative(VITEPRESS_PUBLIC_DIR, origin)}`;
    },
  })(schemas);

  for (const [name, markdownAst] of Object.entries(markdownFiles)) {
    /*
     * Converts list entries of shape '- tsType: () => Partial<FontConfig>'
     * into '- tsType: `() => Partial<FontConfig>`' (e.g. escaping with back-ticks),
     * as otherwise VitePress doesn't like the <FontConfig> bit.
     */
    visit(markdownAst as Root, 'listItem', (listEntry: ListItem) => {
      let listText: Text;
      const blockItem = listEntry.children[0];
      if (blockItem.type === 'paragraph' && blockItem.children[0].type === 'text') {
        listText = blockItem.children[0];
      } // @ts-expect-error: MD AST output from @adobe/jsonschema2md is technically wrong
      else if (blockItem.type === 'text') {
        listText = blockItem;
      } else {
        return; // skip
      }

      if (listText.value.startsWith('tsType: ')) {
        listText.value = listText.value.replace(/tsType: (.*)/g, 'tsType: `$1`');
      }
    });

    const transformer = remark()
      .use(remarkGfm)
      .use(remarkFrontmatter, ['yaml']) // support YAML front-matter in Markdown
      .use(transformMarkdownAst, {
        // mermaid project specific plugin
        originalFilename: file,
        addAutogeneratedWarning: !noHeader,
        addEditLink: noHeader,
        removeYAML: !noHeader,
      });

    const transformed = transformer.stringify(await transformer.run(markdownAst as Root));

    const formatted = await prettier.format(transformed, {
      parser: 'markdown',
      ...prettierConfig,
    });
    const newFileName = join(SCHEMA_MARKDOWN_OUTPUT_DIR, `${name}.md`);
    copyTransformedContents(newFileName, !verifyOnly, formatted);
  }
}

/**
 * Transform an HTML file and write the transformed file to the directory for published
 * documentation
 *
 * - Add the text that says the file is automatically generated Verify that the file has been changed
 *   and write out the changes
 *
 * @param filename {string} name of the HTML file to transform
 */
const transformHtml = async (filename: string) => {
  /**
   * Insert the '...auto generated...' comment into an HTML file after the<html> element
   *
   * @param fileName {string} file name that should have the comment inserted
   * @returns {string} The contents of the file with the comment inserted
   */
  const insertAutoGeneratedComment = (fileName: string): string => {
    const fileContents = injectPlaceholders(readSyncedUTF8file(fileName));

    if (noHeader) {
      return fileContents;
    }

    const jsdom = new JSDOM(fileContents);
    const htmlDoc = jsdom.window.document;
    const autoGeneratedComment = jsdom.window.document.createComment(generateHeader(fileName));

    const rootElement = htmlDoc.documentElement;
    rootElement.prepend(autoGeneratedComment);
    return jsdom.serialize();
  };

  const transformedHTML = insertAutoGeneratedComment(filename);
  const formattedHTML = await prettier.format(transformedHTML, {
    parser: 'html',
    ...prettierConfig,
  });
  copyTransformedContents(filename, !verifyOnly, formattedHTML);
};

export const getGlobs = (globs: string[]): string[] => {
  globs.push('!**/dist/**', '!**/redirect.spec.ts', '!**/landing/**', '!**/node_modules/**');
  if (!vitepress) {
    globs.push(
      '!**/.vitepress/**',
      '!**/vite.config.ts',
      '!src/docs/index.md',
      '!**/package.json',
      '!**/user-avatars/**'
    );
  }
  return globs;
};

export const getFilesFromGlobs = async (globs: string[]): Promise<string[]> => {
  return await globby(globs, { dot: true });
};

/** Main method (entry point) */
export const processDocs = async () => {
  if (verifyOnly) {
    console.log('Verifying that all files are in sync with the source files');
  }

  const sourceDirGlob = posix.join('.', SOURCE_DOCS_DIR, '**');
  const action = verifyOnly ? 'Verifying' : 'Transforming';

  if (vitepress) {
    console.log(`${action} 1 .schema.yaml file`);
    await transformJsonSchema('src/schemas/config.schema.yaml');
  } else {
    // skip because this creates so many Markdown files that it lags git
    console.log('Skipping 1 .schema.yaml file');
  }

  const mdFileGlobs = getGlobs([posix.join(sourceDirGlob, '*.md')]);
  const mdFiles = await getFilesFromGlobs(mdFileGlobs);
  console.log(`${action} ${mdFiles.length} markdown files...`);
  await Promise.all(mdFiles.map(transformMarkdown));

  for (const includedFile of includedFiles) {
    rmSync(includedFile, { force: true });
    filesTransformed.delete(includedFile);
    console.log(`Removed ${includedFile} as it was used inside an @include block.`);
  }

  const htmlFileGlobs = getGlobs([posix.join(sourceDirGlob, '*.html')]);
  const htmlFiles = await getFilesFromGlobs(htmlFileGlobs);
  console.log(`${action} ${htmlFiles.length} html files...`);
  await Promise.all(htmlFiles.map(transformHtml));

  const otherFileGlobs = getGlobs([sourceDirGlob, '!**/*.md', '!**/*.html']);
  const otherFiles = await getFilesFromGlobs(otherFileGlobs);
  console.log(`${action} ${otherFiles.length} other files...`);
  otherFiles.forEach((file: string) => {
    copyTransformedContents(file, !verifyOnly); // no transformation
  });

  if (filesTransformed.size > 0) {
    if (verifyOnly) {
      console.log(WARN_DOCSDIR_DOESNT_MATCH);
      process.exit(1);
    }
    if (git) {
      console.log(`Adding changes in ${FINAL_DOCS_DIR} folder to git`);
      exec(`git add ${FINAL_DOCS_DIR}`);
    }
  }

  if (watch) {
    console.log(`Watching for changes in ${SOURCE_DOCS_DIR}`);

    const matcher = (globs: string[]) => (file: string) => mm.every(file, globs);
    const isMd = matcher(mdFileGlobs);
    const isHtml = matcher(htmlFileGlobs);
    const isOther = matcher(otherFileGlobs);

    chokidar
      .watch(SOURCE_DOCS_DIR)
      // Delete files from the final docs dir if they are deleted from the source dir
      .on('unlink', (file: string) => rmSync(changeToFinalDocDir(file)))
      .on('unlinkDir', (file: string) => rmdirSync(changeToFinalDocDir(file)))
      .on('all', (event, path) => {
        // Ignore other events.
        if (!['add', 'change'].includes(event)) {
          return;
        }
        if (isMd(path)) {
          void transformMarkdown(path);
        } else if (isHtml(path)) {
          void transformHtml(path);
        } else if (isOther(path)) {
          copyTransformedContents(path, true);
        }
      });
  }
};
