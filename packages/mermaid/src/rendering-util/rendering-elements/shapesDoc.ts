import { writeFile } from 'fs/promises';
import { markdownTable } from 'markdown-table';
import { shapesDefs } from './shapes.js';

export const buildShapeDoc = () => {
  const data = shapesDefs.map((shape) => {
    const { name, semanticName, description, shortName, aliases } = shape;
    aliases?.sort();
    const aliasString = aliases?.join('`, `');
    return [
      semanticName,
      name,
      `\`${shortName}\``,
      description,
      aliasString ? `\`${aliasString}\`` : '',
    ];
  });
  data.sort((a, b) => a[0].localeCompare(b[0]));
  return markdownTable([
    ['Semantic Name', 'Shape Name', 'Short Name', 'Description', 'Alias Supported'].map(
      (s) => `**${s}**`
    ),
    ...data,
  ]);
};

export const writeShapeDoc = async () => {
  await writeFile('packages/mermaid/src/docs/syntax/shapesTable.md', buildShapeDoc());
};
