# Render regression fixtures

Minimal, self-contained reproductions of rendering regressions found while doing
the large-diagram performance work (PRs #7871 / #7872). Each `.mmd` here renders a
single, specific visual bug so we can eyeball it in the dev explorer (and compare
against `develop`) without needing the full Cypress/Argos pipeline.

Drop new repros here as we find them — keep each one as small as possible and
record where it came from below.

## How to use

1. `pnpm dev`, open the dev explorer, pick a file from this folder.
2. Compare the same file on this branch vs `develop` (or against the Argos
   baseline) to confirm the regression.
3. Config that matters (look / htmlLabels) is set in each file's YAML frontmatter.
   The explorer's look/theme controls can also be used if frontmatter isn't applied.

## Fixtures

| File                                               | Symptom                                                                       | Source test                                                                                                                                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `class-notes-in-namespaces.mmd`                    | (#1) Note text now wraps to new lines where it used to fit on one line.       | `cypress/integration/rendering/class/classDiagram-v2.spec.js` → "should add notes in namespaces" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7320/339456142))                                                    |
| `hourglass-blank-label.mmd`                        | (#2) Hourglass shape renders its label text; it should render no label.       | `cypress/integration/rendering/newShapes.spec.ts` → "Test triangle, …, hourglass in handDrawn look and dir LR → with classDef" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7320/339457057))                      |
| `er-styles-from-style-statement.mmd`               | (#3) Entity labels changed and the entity title no longer shows.              | `cypress/integration/rendering/er/erDiagram-unified.spec.js` → "should render entities with styles applied from style statement" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7320/339458037))                    |
| `er-styles-from-class-statement-no-htmllabels.mmd` | (#4) Entity labels changed, title no longer shows, and the styling is lost.   | `cypress/integration/rendering/er/erDiagram-unified.spec.js` → "should render entities with styles applied from class statement without htmlLabels" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7320/339458034)) |
| `class-notes-simple-alignment.mmd`                 | (#5) Box labels are center-aligned; they used to be left-aligned.             | `cypress/integration/rendering/class/classDiagram.spec.js` → "19: should render a simple class diagram with notes" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7320/339457183))                                  |
| `flowchart-img-labels-4023.mmd`                    | (#6) `<img>` icons inside html labels don't show (node mis-sized).            | `cypress/integration/rendering/flowchart/flowchart-v2.spec.js` → "4023: Should render html labels with images and-or text correctly" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7320/339456632))                |
| `er-handdrawn-entity-background.mmd`               | (#7) handDrawn ER entities (no attributes) lose their background fill.        | `cypress/integration/rendering/er/erDiagram-unified.spec.js` → "HD: should render entities with and without attributes" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7324/339662375))                             |
| `imageshape-markdown-svg-wrap.mmd`                 | SVG (`htmlLabels:false`) markdown label wraps at different words than before. | `cypress/integration/rendering/imageShape.spec.ts` → "imageShape … handDrawn … dir TB … label position b … with markdown htmlLabels:false" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7309/338781725))          |
| `iconshape-classdef-label-color.mmd`               | `classDef … color:#fff` label text is no longer white.                        | `cypress/integration/rendering/iconShape.spec.ts` → "iconShape … rounded form, classic look … dir TB … label position t … with classDef" ([Argos](https://app.argos-ci.com/mermaid/mermaid/builds/7309/338779254))            |

> Note: `iconshape-classdef-label-color.mmd` uses `fa:bell`; the icon itself needs
> an icon pack registered, but the regression is the **label color**, which renders
> regardless of whether the icon resolves.

## Adding a new fixture

- One bug per file; smallest diagram that still shows it.
- Put any required `look` / `htmlLabels` / theme in YAML frontmatter so it's
  self-contained.
- Add a row to the table above with the symptom and the source test (+ Argos link
  if there is one).
