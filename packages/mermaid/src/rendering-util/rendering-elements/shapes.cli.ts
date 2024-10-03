import { writeFile } from 'fs/promises';
import { buildShapeDoc } from './shapesDoc.js';

export const writeShapeDoc = async () => {
  await writeFile('packages/mermaid/src/docs/syntax/shapesTable.md', buildShapeDoc());
};

void writeShapeDoc();
