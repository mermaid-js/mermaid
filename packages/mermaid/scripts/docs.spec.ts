import { transformMarkdownAst, transformToBlockQuote } from './docs.mjs';

import { remark } from 'remark'; // import it this way so we can mock it
import remarkFrontmatter from 'remark-frontmatter';
import { vi, afterEach, describe, it, expect } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

const originalFilename = 'example-input-filename.md';
const remarkBuilder = remark().use(remarkFrontmatter, ['yaml']); // support YAML front-matter in Markdown

describe('docs.mts', () => {
  describe('transformMarkdownAst', () => {
    describe('checks each AST node', () => {
      it('does no transformation if there are no code blocks', async () => {
        const contents = 'Markdown file contents\n';
        const result = (
          await remarkBuilder().use(transformMarkdownAst, { originalFilename }).process(contents)
        ).toString();
        expect(result).toEqual(contents);
      });

      describe('is a code block', () => {
        const beforeCodeLine = 'test\n';
        const diagramText = 'graph\n A --> B\n';

        describe('language = "mermaid-nocode"', () => {
          const langKeyword = 'mermaid-nocode';
          const contents = beforeCodeLine + '```' + langKeyword + '\n' + diagramText + '\n```\n';

          it('changes the language to "mermaid"', async () => {
            const result = (
              await remarkBuilder()
                .use(transformMarkdownAst, { originalFilename })
                .process(contents)
            ).toString();
            expect(result).toEqual(
              beforeCodeLine + '\n' + '```' + 'mermaid' + '\n' + diagramText + '\n```\n'
            );
          });
        });

        describe('language = "mermaid" | "mmd" | "mermaid-example"', () => {
          const mermaidKeywords = ['mermaid', 'mmd', 'mermaid-example'];

          mermaidKeywords.forEach((langKeyword) => {
            const contents = beforeCodeLine + '```' + langKeyword + '\n' + diagramText + '\n```\n';

            it('changes the language to "mermaid-example" and adds a copy of the code block with language = "mermaid"', async () => {
              const result = (
                await remarkBuilder()
                  .use(transformMarkdownAst, { originalFilename })
                  .process(contents)
              ).toString();
              expect(result).toEqual(
                beforeCodeLine +
                  '\n' +
                  '```mermaid-example\n' +
                  diagramText +
                  '\n```\n' +
                  '\n```mermaid\n' +
                  diagramText +
                  '\n```\n'
              );
            });
          });
        });

        it('calls transformToBlockQuote with the node information', async () => {
          const langKeyword = 'note';
          const contents =
            beforeCodeLine + '```' + langKeyword + '\n' + 'This is the text\n' + '```\n';

          const result = (
            await remarkBuilder().use(transformMarkdownAst, { originalFilename }).process(contents)
          ).toString();
          expect(result).toEqual(beforeCodeLine + '\n> **Note**\n' + '> This is the text\n');
        });
      });
    });

    it('should remove YAML if `removeYAML` is true', async () => {
      const contents = `---
title: Flowcharts Syntax
---

This Markdown should be kept.
`;
      const withYaml = (
        await remarkBuilder().use(transformMarkdownAst, { originalFilename }).process(contents)
      ).toString();
      // no change
      expect(withYaml).toEqual(contents);

      const withoutYaml = (
        await remarkBuilder()
          .use(transformMarkdownAst, { originalFilename, removeYAML: true })
          .process(contents)
      ).toString();
      // no change
      expect(withoutYaml).toEqual('This Markdown should be kept.\n');
    });
  });

  it('should add an editLink in the YAML frontmatter if `addEditLink: true`', async () => {
    const contents = `---
title: Flowcharts Syntax
---

This Markdown should be kept.
`;
    const withYaml = (
      await remarkBuilder()
        .use(transformMarkdownAst, { originalFilename, addEditLink: true })
        .process(contents)
    ).toString();
    expect(withYaml).toEqual(`---
title: Flowcharts Syntax
editLink: >-
  https://github.com/mermaid-js/mermaid/edit/develop/packages/mermaid/example-input-filename.md

---

This Markdown should be kept.
`);
  });

  describe('transformToBlockQuote', () => {
    // TODO Is there a way to test this with --vitepress given as a process argument?

    describe('vitepress is not given as an argument', () => {
      it('everything starts with "> " (= block quote)', () => {
        const result = transformToBlockQuote('first line\n\n\nfourth line', 'blorfType');
        expect(result).toMatch(/> (.)*\n> first line(?:\n> ){3}fourth line/);
      });

      it('includes an icon if there is one for the type', () => {
        const result = transformToBlockQuote(
          'first line\n\n\nfourth line',
          'danger',
          'Custom Title'
        );
        expect(result).toMatch(/> \*\*‼️ Custom Title\*\* /);
      });

      describe('a custom title is given', () => {
        it('custom title is surrounded in spaces, in bold', () => {
          const result = transformToBlockQuote(
            'first line\n\n\nfourth line',
            'blorfType',
            'Custom Title'
          );
          expect(result).toMatch(/> \*\*Custom Title\*\* /);
        });
      });

      describe.skip('no custom title is given', () => {
        it('title is the icon and the capitalized type, in bold', () => {
          const result = transformToBlockQuote('first line\n\n\nfourth line', 'blorf type');
          expect(result).toMatch(/> \*\*Blorf Type\*\* /);
        });
      });
    });
  });
});
