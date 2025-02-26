import { buildShapeDoc, transformMarkdownAst, transformToBlockQuote } from './docs.mjs';

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
        const diagram_text = 'graph\n A --> B\n';

        describe('language = "mermaid-nocode"', () => {
          const lang_keyword = 'mermaid-nocode';
          const contents = beforeCodeLine + '```' + lang_keyword + '\n' + diagram_text + '\n```\n';

          it('changes the language to "mermaid"', async () => {
            const result = (
              await remarkBuilder()
                .use(transformMarkdownAst, { originalFilename })
                .process(contents)
            ).toString();
            expect(result).toEqual(
              beforeCodeLine + '\n' + '```' + 'mermaid' + '\n' + diagram_text + '\n```\n'
            );
          });
        });

        describe('language = "mermaid" | "mmd" | "mermaid-example"', () => {
          const mermaid_keywords = ['mermaid', 'mmd', 'mermaid-example'];

          mermaid_keywords.forEach((lang_keyword) => {
            const contents =
              beforeCodeLine + '```' + lang_keyword + '\n' + diagram_text + '\n```\n';

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
                  diagram_text +
                  '\n```\n' +
                  '\n```mermaid\n' +
                  diagram_text +
                  '\n```\n'
              );
            });
          });
        });

        it('calls transformToBlockQuote with the node information', async () => {
          const lang_keyword = 'note';
          const contents =
            beforeCodeLine + '```' + lang_keyword + '\n' + 'This is the text\n' + '```\n';

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

  describe('buildShapeDoc', () => {
    it('should build shapesTable based on the shapeDefs', () => {
      expect(buildShapeDoc()).toMatchInlineSnapshot(`
        "| **Semantic Name**                 | **Shape Name**         | **Short Name** | **Description**                | **Alias Supported**                                              |
        | --------------------------------- | ---------------------- | -------------- | ------------------------------ | ---------------------------------------------------------------- |
        | Card                              | Notched Rectangle      | \`notch-rect\`   | Represents a card              | \`card\`, \`notched-rectangle\`                                      |
        | Collate                           | Hourglass              | \`hourglass\`    | Represents a collate operation | \`collate\`, \`hourglass\`                                           |
        | Com Link                          | Lightning Bolt         | \`bolt\`         | Communication link             | \`com-link\`, \`lightning-bolt\`                                     |
        | Comment                           | Curly Brace            | \`brace\`        | Adds a comment                 | \`brace-l\`, \`comment\`                                             |
        | Comment Right                     | Curly Brace            | \`brace-r\`      | Adds a comment                 |                                                                  |
        | Comment with braces on both sides | Curly Braces           | \`braces\`       | Adds a comment                 |                                                                  |
        | Data Input/Output                 | Lean Right             | \`lean-r\`       | Represents input or output     | \`in-out\`, \`lean-right\`                                           |
        | Data Input/Output                 | Lean Left              | \`lean-l\`       | Represents output or input     | \`lean-left\`, \`out-in\`                                            |
        | Database                          | Cylinder               | \`cyl\`          | Database storage               | \`cylinder\`, \`database\`, \`db\`                                     |
        | Decision                          | Diamond                | \`diam\`         | Decision-making step           | \`decision\`, \`diamond\`, \`question\`                                |
        | Delay                             | Half-Rounded Rectangle | \`delay\`        | Represents a delay             | \`half-rounded-rectangle\`                                         |
        | Direct Access Storage             | Horizontal Cylinder    | \`h-cyl\`        | Direct access storage          | \`das\`, \`horizontal-cylinder\`                                     |
        | Disk Storage                      | Lined Cylinder         | \`lin-cyl\`      | Disk storage                   | \`disk\`, \`lined-cylinder\`                                         |
        | Display                           | Curved Trapezoid       | \`curv-trap\`    | Represents a display           | \`curved-trapezoid\`, \`display\`                                    |
        | Divided Process                   | Divided Rectangle      | \`div-rect\`     | Divided process shape          | \`div-proc\`, \`divided-process\`, \`divided-rectangle\`               |
        | Document                          | Document               | \`doc\`          | Represents a document          | \`doc\`, \`document\`                                                |
        | Event                             | Rounded Rectangle      | \`rounded\`      | Represents an event            | \`event\`                                                          |
        | Extract                           | Triangle               | \`tri\`          | Extraction process             | \`extract\`, \`triangle\`                                            |
        | Fork/Join                         | Filled Rectangle       | \`fork\`         | Fork or join in process flow   | \`join\`                                                           |
        | Internal Storage                  | Window Pane            | \`win-pane\`     | Internal storage               | \`internal-storage\`, \`window-pane\`                                |
        | Junction                          | Filled Circle          | \`f-circ\`       | Junction point                 | \`filled-circle\`, \`junction\`                                      |
        | Lined Document                    | Lined Document         | \`lin-doc\`      | Lined document                 | \`lined-document\`                                                 |
        | Lined/Shaded Process              | Lined Rectangle        | \`lin-rect\`     | Lined process shape            | \`lin-proc\`, \`lined-process\`, \`lined-rectangle\`, \`shaded-process\` |
        | Loop Limit                        | Trapezoidal Pentagon   | \`notch-pent\`   | Loop limit step                | \`loop-limit\`, \`notched-pentagon\`                                 |
        | Manual File                       | Flipped Triangle       | \`flip-tri\`     | Manual file operation          | \`flipped-triangle\`, \`manual-file\`                                |
        | Manual Input                      | Sloped Rectangle       | \`sl-rect\`      | Manual input step              | \`manual-input\`, \`sloped-rectangle\`                               |
        | Manual Operation                  | Trapezoid Base Top     | \`trap-t\`       | Represents a manual task       | \`inv-trapezoid\`, \`manual\`, \`trapezoid-top\`                       |
        | Multi-Document                    | Stacked Document       | \`docs\`         | Multiple documents             | \`documents\`, \`st-doc\`, \`stacked-document\`                        |
        | Multi-Process                     | Stacked Rectangle      | \`st-rect\`      | Multiple processes             | \`processes\`, \`procs\`, \`stacked-rectangle\`                        |
        | Odd                               | Odd                    | \`odd\`          | Odd shape                      |                                                                  |
        | Paper Tape                        | Flag                   | \`flag\`         | Paper tape                     | \`paper-tape\`                                                     |
        | Prepare Conditional               | Hexagon                | \`hex\`          | Preparation or condition step  | \`hexagon\`, \`prepare\`                                             |
        | Priority Action                   | Trapezoid Base Bottom  | \`trap-b\`       | Priority action                | \`priority\`, \`trapezoid\`, \`trapezoid-bottom\`                      |
        | Process                           | Rectangle              | \`rect\`         | Standard process shape         | \`proc\`, \`process\`, \`rectangle\`                                   |
        | Start                             | Circle                 | \`circle\`       | Starting point                 | \`circ\`                                                           |
        | Start                             | Small Circle           | \`sm-circ\`      | Small starting point           | \`small-circle\`, \`start\`                                          |
        | Stop                              | Double Circle          | \`dbl-circ\`     | Represents a stop point        | \`double-circle\`                                                  |
        | Stop                              | Framed Circle          | \`fr-circ\`      | Stop point                     | \`framed-circle\`, \`stop\`                                          |
        | Stored Data                       | Bow Tie Rectangle      | \`bow-rect\`     | Stored data                    | \`bow-tie-rectangle\`, \`stored-data\`                               |
        | Subprocess                        | Framed Rectangle       | \`fr-rect\`      | Subprocess                     | \`framed-rectangle\`, \`subproc\`, \`subprocess\`, \`subroutine\`        |
        | Summary                           | Crossed Circle         | \`cross-circ\`   | Summary                        | \`crossed-circle\`, \`summary\`                                      |
        | Tagged Document                   | Tagged Document        | \`tag-doc\`      | Tagged document                | \`tag-doc\`, \`tagged-document\`                                     |
        | Tagged Process                    | Tagged Rectangle       | \`tag-rect\`     | Tagged process                 | \`tag-proc\`, \`tagged-process\`, \`tagged-rectangle\`                 |
        | Terminal Point                    | Stadium                | \`stadium\`      | Terminal point                 | \`pill\`, \`terminal\`                                               |
        | Text Block                        | Text Block             | \`text\`         | Text block                     |                                                                  |
        "
      `);
    });
  });
});
