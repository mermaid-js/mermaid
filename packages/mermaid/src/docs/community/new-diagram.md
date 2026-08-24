# Adding a New Diagram/Chart 📊

A diagram type in Mermaid is a plugin. You write a parser, a database, a renderer, and a styles
function, register them under an id, and Mermaid handles detection, lazy loading, theming, and
sanitization for you.

The use case diagram is the reference implementation for new work. When this guide says "look at
usecase", the files are in `packages/mermaid/src/diagrams/usecase/`. Read them alongside these
steps: they are short, and they show the current conventions rather than the historical ones that
older diagrams still carry.

## What a diagram is made of

Each diagram exports a `DiagramDefinition` (`diagram-api/types.ts`) from a single entry file. The
whole of `usecaseDiagram.ts` is this:

```ts
import type { DiagramDefinition } from '../../diagram-api/types.js';
import { parser } from './parser/usecase.chevrotain.js';
import { db } from './usecaseDb.js';
import { renderer } from './usecaseRenderer.js';
import styles from './styles.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
  styles,
};
```

| Part     | What it does                                                                   |
| -------- | ------------------------------------------------------------------------------ |
| parser   | Turns diagram text into calls on the db. Fails with a useful message otherwise |
| db       | Holds the parsed model and hands it to the renderer                            |
| renderer | Draws the SVG from what the db holds                                           |
| styles   | Maps theme variables to CSS for your diagram                                   |
| detector | A regex test that recognizes your diagram's first line. Lives in its own file  |

Two rules apply to everything in your folder:

Your diagram must be self-contained. Never import from another diagram's folder. You may import
from `diagrams/common/` and from `rendering-util/`, and that is the whole list. Cross-diagram
imports create coupling that breaks unrelated diagrams later, so a reviewer will block on this.

Your db gets a fresh instance for every render. Do not keep state in module scope, and make sure
`clear()` resets everything. Two diagrams of the same type on one page will otherwise leak into
each other.

## Step 1: Grammar and parsing

New diagram grammars should use [Chevrotain](https://chevrotain.io/docs/), co-located with the
diagram itself under `packages/mermaid/src/diagrams/<diagram>/parser/`. The use case diagram is
the reference implementation: a lexer, a `CstParser`, and a CST visitor that builds the diagram
model, sharing `diagrams/common/parser/runChevrotainParse.ts` to run the lexer/parser pair and
report failures with source positions.

Keeping the grammar next to the diagram mirrors the existing JISON layout, so a diagram stays
self-contained and the parser does not have to be released from a separate package.

Several existing diagrams (architecture, gitGraph, info, packet, pie, radar, treemap) instead use
[Langium](https://langium.org/docs/reference/grammar-language/) grammars in `packages/parser`, and
older diagrams use JISON. Both remain supported, so modify them in place for bug fixes rather than
rewriting, but neither is the target for new work. These PRs show the Langium approach:

- https://github.com/mermaid-js/mermaid/pull/4839
- https://github.com/mermaid-js/mermaid/pull/4751

Whichever you use, invalid input has to produce a parse error with a line and column, never a
stack trace. Mermaid runs inside other people's pages, and a thrown exception there is a broken
page rather than a broken diagram.

## Step 2: The database

The db collects what the parser found and exposes getters for the renderer. Look at
`usecaseDb.ts`. Alongside your own accessors, re-export the shared title and accessibility setters
from `diagrams/common/commonDb.ts` so that authors get the same `title`, `accTitle`, and
`accDescr` syntax they get everywhere else:

```js
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../common/commonDb.js';
```

Your own `clear()` should call `commonClear()` as well as resetting your own fields.

## Step 3: The renderer

Write a renderer that draws the diagram from what the db holds. `usecaseRenderer.ts` is a good
starting point, and `sequenceRenderer.js` is a more generic older example than the flowchart
renderer. The renderer belongs in your diagram folder.

Two things are easy to miss and both get flagged in review.

Apply the configured padding and hand the sizing to the shared helper, so your diagram scales like
every other diagram instead of rendering at some unrelated size:

```ts
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';

setupViewPortForSVG(svg, padding, 'usecaseDiagram', config.useMaxWidth);
```

Support handdrawn mode if your drawing approach allows it. The config carries a `look`, and
diagrams check it directly:

```ts
const isHandDrawn = look === 'handDrawn';
```

If a third party library makes handdrawn output impossible, that is an acceptable answer, but say
so in your diagram's documentation page so users are not left guessing.

## Step 4: Detection and registration

Detection lives in its own file next to the diagram, not in `detectType.ts`. A detector is a
regex test plus a lazy loader, and it exports an `ExternalDiagramDefinition`:

```ts
const id = 'usecase';

const detector: DiagramDetector = (txt) => {
  return /^\s*usecase-beta(?:\s|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./usecaseDiagram.js');
  return { id, diagram };
};

export const usecase: ExternalDiagramDefinition = { id, detector, loader };
```

Then import it in `diagram-api/diagram-orchestration.ts` and add it to the
`registerLazyLoadedDiagrams(...)` call. Order matters there: the first detector that returns true
wins, so a loose pattern placed early will swallow other diagrams. The loader is what keeps
Mermaid's bundle small, because your diagram is only fetched once someone writes one.

[The id becomes the aria roledescription](#aria-roledescription), so pick a word that describes
the diagram out loud. For a UML deployment diagram, "UMLDeploymentDiagram" works, because a screen
reader voices it as "U-M-L Deployment diagram", and so does "deploymentDiagram". "deployment" on
its own does not say enough.

The id does not have to match the keyword you chose in the
[grammar](#step-1-grammar-and-parsing), though it helps when they agree.

## Step 5: Theming

Mermaid has an integrated theming engine, described in more detail [in the docs](../config/theming.md).

Your diagram provides a `getStyles` function in `styles.ts` in your diagram folder. It is called
with the resolved theme options and returns CSS:

```js
const getStyles = (options) =>
  `
    .line {
      stroke-width: 1;
      stroke: ${options.lineColor};
      stroke-dasharray: 2;
    }
    // ...
    `;
```

There is nothing to wire up by hand. `registerDiagram()` passes your `styles` to
`addStylesForDiagram()`, and the styling engine picks it up from there.

Every color must come from `options`. A hardcoded hex value looks fine in the default theme and
then breaks in dark mode, so reviewers treat hardcoded colors as a defect. The values themselves
are defined in the theme files under `src/themes/`; if your diagram needs a variable that does not
exist yet, add it there so all five themes define it.

## Step 6: Configuration

If your diagram has options, add them to `src/schemas/config.schema.yaml`, both as an entry in the
list of diagram config keys and as its own config block. Then regenerate the types:

```bash
pnpm run --filter mermaid types:build-config
```

Never edit `config.type.ts` by hand. It is generated, CI verifies it against the schema, and a
manual edit is a blocking review finding.

## Accessibility

Mermaid automatically adds the following accessibility information for the diagram SVG HTML element:

- aria-roledescription
- accessible title
- accessible description

### aria-roledescription

The aria-roledescription is automatically set to
[the diagram type](#step-4-detection-and-registration) and inserted into the SVG element.

See [the definition of aria-roledescription](https://www.w3.org/TR/wai-aria-1.1/#aria-roledescription) in [the Accessible Rich Internet Applications W3 standard.](https://www.w3.org/WAI/standards-guidelines/aria/)

### accessible title and description

The syntax for accessible titles and descriptions is described in [the Accessibility documentation section.](../config/accessibility.md)

You get both for free once your db re-exports the setters shown in
[Step 2](#step-2-the-database). The values are inserted into the SVG element in the `render`
function in mermaidAPI.

## Step 7: Tests

A new diagram without tests will not be merged. There are three kinds, and none of them takes long.

Unit tests for the parser and db go next to the code as `*.spec.ts`. Cover the syntax you
documented, and cover invalid input too: a diagram that accepts nonsense silently is worse than
one that rejects it. Run them with `vitest run packages/mermaid/src/diagrams/<diagram>`.

Visual regression tests come from `.mmd` fixtures. Put one file per scenario in
`e2e/diagrams/<diagram>/`, and that is the whole job:
`e2e/rendering/mmd-snapshots.spec.ts` walks that directory, renders each fixture, and snapshots
it, grouping the results by folder. Screenshot names must be unique across the whole tree, and the
run fails fast if two fixtures collide. `e2e/sheet-order.json` holds the ordering. Run the suite
with `pnpm e2e`. Cover realistic diagrams rather than one minimal smoke test, and include a
fixture per theme if your styling is at all involved.

A documentation test keeps your examples honest. `usecase.docs.spec.ts` reads the published
`syntax/usecase.md`, extracts every ` ```mermaid-example ` block, and parses it. Copy that pattern
and your documentation cannot drift into examples that no longer work.

## Step 8: Documentation, demos, and examples

Write your syntax page as `packages/mermaid/src/docs/syntax/<diagram>.md`. Edit only the files
under `src/docs/`; the top-level `/docs` folder is generated and your changes there will be
overwritten. Mark the version with the placeholder, as `usecase.md` does with
`# Use case diagrams (<MERMAID_RELEASE_VERSION>+)`, and the release process substitutes the real
number.

Add the page to the sidebar in `.vitepress/config.ts` under `sidebarSyntax()`. A page with no
sidebar entry is reachable only by URL, which in practice means nobody reads it.

Add a demo page at `demos/<diagram>.html` and link it from `demos/index.html`, following any
of the existing demos.

Add at least one entry to the `@mermaid-js/examples` package, which is what tools like
mermaid.live use to help people get started. Duplicate an existing file such as
`packages/examples/src/examples/flowchart.ts`, adapt it, then import it in
`packages/examples/src/index.ts` and add it to the `examples` array. Mark one example as the
default, and add more to show off individual features.

If your syntax introduces new keywords, add them to `.cspell/mermaid-terms.txt`. The pre-commit
hook runs CSpell and will otherwise reject the commit.

## Step 9: Changeset and pull request

Run `pnpm changeset`, choose the `mermaid` package and a `minor` bump, and write a description
prefixed with `feat:`.

Open the PR against `develop` and link the issue it resolves. New diagram types are large by
nature, and that is fine, but keep unrelated refactors out of the same branch.

## Reviewer's checklist

This is what a reviewer checks. Going through it yourself first is the fastest way to a short
review.

- [ ] Parser uses Chevrotain, co-located under `diagrams/<diagram>/parser/`
- [ ] Invalid input produces a parse error with position, not a crash
- [ ] `DiagramDefinition` exports parser, db, renderer, and styles
- [ ] Detector in its own file, registered in `diagram-orchestration.ts`, ordered so it does not shadow other diagrams
- [ ] Diagram id reads well as an aria roledescription
- [ ] db holds no module-level state and `clear()` resets everything, including `commonClear()`
- [ ] No imports from other diagrams' folders
- [ ] Renderer applies padding and `useMaxWidth` through `setupViewPortForSVG`
- [ ] Handdrawn mode implemented, or its absence documented
- [ ] `styles.ts` takes theme options, with no hardcoded colors
- [ ] Config options added to `config.schema.yaml` and `config.type.ts` regenerated, never hand-edited
- [ ] Accessibility setters re-exported from `common/commonDb.ts`
- [ ] Unit tests for parser and db, covering invalid input
- [ ] `.mmd` fixtures in `e2e/diagrams/<diagram>/` for visual regression
- [ ] Documentation examples covered by a docs spec
- [ ] Syntax page under `src/docs/syntax/`, with `MERMAID_RELEASE_VERSION` and a sidebar entry
- [ ] Demo page and `demos/index.html` link
- [ ] Example added to `@mermaid-js/examples`, one marked default
- [ ] New keywords added to `.cspell/mermaid-terms.txt`
- [ ] Changeset created (`minor`, `feat:`)
- [ ] PR targets `develop` and links its issue
