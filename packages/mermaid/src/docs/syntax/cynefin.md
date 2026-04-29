# Cynefin Framework Diagram (v<MERMAID_RELEASE_VERSION>+)

> The Cynefin framework is a sense-making framework created by [Dave Snowden](https://en.wikipedia.org/wiki/Dave_Snowden) that categorizes problems into five complexity domains. It helps teams match their response to the nature of the situation they are facing. The name is Welsh for "place" or "habitat".

You can read more at [The Cynefin Co](https://thecynefin.co/about-us/about-cynefin-framework).

## Introduction

The Cynefin framework divides the world into five domains, each with its own decision-making approach:

- **Clear** (formerly Obvious/Simple): Cause and effect are obvious. Sense → Categorise → Respond. Apply **best practices**.
- **Complicated**: Cause and effect require analysis or expertise. Sense → Analyse → Respond. Apply **good practices**.
- **Complex**: Cause and effect can only be deduced in retrospect. Probe → Sense → Respond. Apply **emergent practices**.
- **Chaotic**: No perceivable cause and effect. Act → Sense → Respond. Apply **novel practices**.
- **Confusion** (or Disorder): You do not know which domain you are in. The goal is to move items out of this state into one of the other four.

The signature visual feature is the wavy, organic boundary between the ordered (Clear, Complicated) and unordered (Complex, Chaotic) halves, and the "cliff" between Clear and Chaotic representing the risk of complacency leading to crisis.

## Syntax

A Cynefin diagram is declared with `cynefin-beta` followed by domain blocks and optional transitions.

```md
cynefin-beta
title Optional Diagram Title

complex
"Item label"
"Another item"

complicated
"Expert analysis needed"

clear
"Known procedure"

chaotic
"Crisis response"

confusion
"Item of unknown domain"

complex --> complicated : "Pattern identified"
clear --> chaotic : "Complacency"
```

### Keywords

| Keyword        | Meaning                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `cynefin-beta` | Diagram type declaration (required, first line after any front matter) |
| `title`        | Optional diagram title                                                 |
| `complex`      | Opens the Complex domain block                                         |
| `complicated`  | Opens the Complicated domain block                                     |
| `clear`        | Opens the Clear domain block                                           |
| `chaotic`      | Opens the Chaotic domain block                                         |
| `confusion`    | Opens the Confusion / Disorder domain block                            |
| `-->`          | Declares a transition from one domain to another                       |

### Items

Items are quoted string labels placed on their own lines inside a domain block. Each item renders as a text badge within the domain region.

```
complex
  "Investigate root cause"
  "Run chaos experiment"
```

Keep per-domain item lists short — the quadrants have fixed layout and long lists can visually overflow their boxes. The confusion ellipse caps at three items and shows a `+N more` badge; the four quadrant domains do not clip, so prefer a handful of items each.

### Transitions

Transitions represent movement of items between domains over time. They are declared at the top level using `-->` between two domain names, with an optional label.

```
complex --> complicated : "Pattern identified"
clear --> chaotic : "Complacency"
chaotic --> complex : "Stabilized"
```

Common transitions:

- **Complex → Complicated**: An emerging pattern has become understood and can now be analyzed.
- **Chaotic → Complex**: A crisis has been stabilized enough to begin probing.
- **Clear → Chaotic**: Complacency or over-constraint has led to collapse (the "cliff").
- **Complicated → Clear**: Analysis has codified a solution into a standard practice.

## Examples

### Basic example

```mermaid-example
cynefin-beta
  title Incident Response

  complex
    "Investigate root cause"
    "Run chaos experiment"

  complicated
    "Analyze performance data"
    "Expert review needed"

  clear
    "Restart service"
    "Apply known fix"

  chaotic
    "Page on-call immediately"

  confusion
    "Unknown failure mode"
```

### With transitions

```mermaid-example
cynefin-beta
  title Strategy Categorization

  complex
    "Market research"

  complicated
    "Competitive analysis"

  clear
    "Standard pricing"

  chaotic
    "Crisis management"

  complex --> complicated : "Pattern identified"
  complicated --> clear : "Best practice codified"
  clear --> chaotic : "Complacency"
  chaotic --> complex : "Stabilized"
```

### Empty framework

The domains themselves render even with no items, useful as a teaching or worksheet template.

```mermaid-example
cynefin-beta
  title Cynefin Framework

  complex
  complicated
  clear
  chaotic
```

## Configuration

Cynefin diagrams accept the following configuration under the `cynefin` key in the mermaid config:

| Option                   | Type    | Default | Description                                                                       |
| ------------------------ | ------- | ------- | --------------------------------------------------------------------------------- |
| `width`                  | number  | `800`   | Width of the diagram in pixels                                                    |
| `height`                 | number  | `600`   | Height of the diagram in pixels                                                   |
| `padding`                | number  | `40`    | Padding around the diagram                                                        |
| `showDomainDescriptions` | boolean | `true`  | Show decision model and practice type subtitles per domain                        |
| `boundaryAmplitude`      | number  | `8`     | Waviness amplitude of domain boundaries in pixels (set to `0` for straight lines) |

Example:

```
%%{init: {'cynefin': {'width': 1000, 'showDomainDescriptions': false}}}%%
cynefin-beta
  complex
    "Adaptive work"
```

## Theming

Cynefin diagrams use the following theme variables, which can be overridden via `themeVariables.cynefin`:

| Variable         | Description                                      |
| ---------------- | ------------------------------------------------ |
| `complexBg`      | Background color for the Complex domain          |
| `complicatedBg`  | Background color for the Complicated domain      |
| `clearBg`        | Background color for the Clear domain            |
| `chaoticBg`      | Background color for the Chaotic domain          |
| `confusionBg`    | Background color for the Confusion center region |
| `boundaryColor`  | Color of the wavy domain boundaries              |
| `boundaryWidth`  | Stroke width of the boundaries                   |
| `cliffColor`     | Color of the Clear/Chaotic cliff                 |
| `cliffWidth`     | Stroke width of the cliff                        |
| `arrowColor`     | Color of transition arrows                       |
| `arrowWidth`     | Stroke width of transition arrows                |
| `labelColor`     | Color of domain name labels                      |
| `textColor`      | Color of item and subtitle text                  |
| `domainFontSize` | Font size of domain name labels                  |
| `itemFontSize`   | Font size of item badges and subtitles           |

## Notes

- Domain names are fixed keywords. Only `complex`, `complicated`, `clear`, `chaotic`, and `confusion` are recognized.
- Domains can be declared in any order; their position in the diagram is always the same (Complex top-left, Complicated top-right, Chaotic bottom-left, Clear bottom-right, Confusion center).
- The `confusion` domain has a compact center ellipse. Up to 3 items are shown inside it; if more are provided a `+N more` overflow badge is displayed. In practice, the confusion domain should contain very few items — its purpose is to surface unknowns so they can be moved to one of the four main domains.
- Self-loop transitions (e.g. `complex --> complex`) are silently ignored. Transitions must connect two different domains.
- Handdrawn mode is not currently supported.
- The wavy boundary rendering is deterministic: the same input always produces the same diagram, so diffs are stable across builds.

## Accessibility

Cynefin diagrams support the standard mermaid accessibility directives:

```
cynefin-beta
  accTitle: Cynefin framework for software delivery decisions
  accDescr: A Cynefin map categorizing software tasks by complexity domain

  complex
    "New feature discovery"
```
