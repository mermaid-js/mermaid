/**
 * Command Line interface (CLI) for generating files and directories for a new diagram type.
 *
 * TODO Use some TBD cli node pkg to create the CLI options, etc., and then call generateDiagramTypeSkeleton().
 *
 * This is currently hardcoded to create files for a new type of diagram called "Secret Sauce".
 * This will ultimately use command line arguments to set these and any other values needed.
 *
 * You can run this with `ts-node-esm new-diagram-type-generator.mts`
 */

import { generateDiagramTypeSkeleton } from './generate-diagram-type-skeleton.mjs';

void generateDiagramTypeSkeleton('Secret Sauce', './tests/filesGenerated');
