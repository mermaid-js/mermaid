---
description: 'Draw RxJS-style marble diagrams: lanes of events over time, written in RxJS marble syntax, with spans, subscriptions, cancellations, errors, completions, and breaks in the time axis.'
---

# Marble Diagrams (v<MERMAID_RELEASE_VERSION>+)

```warning
Marble diagrams are in beta. Diagrams start with the `marble-beta` keyword, and the syntax may still change in a backwards-incompatible way before it is declared stable.
```

A marble diagram shows how things happen over time. Each lane is a timeline, read left to right, and each marble on it is an event at a moment in time. They are best known from [RxJS](https://rxjs.dev/guide/testing/marble-testing), where they explain how operators transform streams, but they suit any story about timing: timers and debouncing, retries and timeouts, a request racing a cancellation.

Lanes are written as ASCII art in [RxJS marble syntax](https://rxjs.dev/guide/testing/marble-testing): any marble string from an RxJS test can be pasted as a lane. Every character in a lane is one unit of time, so lanes that line up in your source line up in the diagram.

```mermaid-example
marble-beta
  title debounceTime(3)
  input  : -a-b-c-----d---|
  output : --------c-----d|
```

## Syntax

A marble diagram starts with `marble-beta`. After that, each statement is on its own line:

| Statement                 | Meaning                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `title Some text`         | Optional diagram title                                          |
| `name : marbles`          | A lane called `name`; the marbles follow the colon              |
| `"some name" : marbles`   | A lane whose name contains spaces                               |
| `axis : 0   5   10`       | Optional time axis; each label is placed at its column          |
| `label a "Some text"`     | Names what a marble character means; it also gets its own color |
| `accTitle:` / `accDescr:` | Accessible title and description, as in other diagrams          |

`title`, `axis`, `label` and `marble` are keywords; quote a lane name to use one of them as a name.

### Marbles

Every character after the colon is one column, and every column is the same amount of time, as a frame is in RxJS.

| Character        | Meaning                                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| `-`              | Time passes                                                                           |
| `a`, `1`, `x`, … | A value (an event). Any character without another meaning below is a value            |
| `\|`             | The lane completes                                                                    |
| `#`              | The lane errors                                                                       |
| `(abc)`          | A synchronous group: its values happen in the same frame, drawn stacked in one column |
| `^`              | The subscription point                                                                |
| `!`              | Unsubscription: drawn as a cross. It also cancels an open span, and the lane goes on  |
| `9ms`, `1.4s`    | Time progression: a number and `ms`, `s` or `m`, with whitespace around it            |
| (space)          | Leading spaces start a lane later; any other whitespace takes no time, as in RxJS     |
| `[` + `=` or `~` | Opens a span: something that lasts, such as a timer or a request in flight            |
| `=` or `~`       | Fills a span. Use both to tell two kinds of span apart                                |
| `]`              | Closes a span                                                                         |
| `>`              | Ends a span that is still running when the diagram ends                               |
| `/`              | A break in time: time passes off-scale here, on every lane                            |

The last five rows are additions to RxJS syntax. An event also closes a span that is open, and it opens a new one when a fill character follows it, so `S~~~E` is an event `S`, a span, and an event `E` that ends it. Where no span can open or close, `[`, `]`, `>`, `=` and `~` are ordinary values, as they are in RxJS.

A group takes as many columns as it has characters, parentheses included, just as it takes that many frames in RxJS, so `(abc)` is five columns wide and the lanes below it stay lined up. A completion or error inside a group, as in `(a|)`, happens in the same frame as the group's values. After a lane completes or errors nothing more is drawn on it, but the characters that follow still take time.

A lane of only `-`, `^`, `!` and time progressions, such as `--^---!`, is an RxJS subscription marble. It is drawn as one span from the subscription point to the unsubscription.

A time progression is drawn as a break in that lane, like `/`, labelled with its duration. It takes one column, so the lane after it is compressed: `a 9ms b` puts `b` two columns after `a`, not ten. Tabs before a marble string are rejected, because they make columns ambiguous.

```mermaid-example
marble-beta
  title concat(first, of(1, 2, 3))
  first  : --a--|
  second :      (123|)
  result : --a--(123|)
  label | "complete"
```

```mermaid-example
marble-beta
  title Two subscribers to a hot source
  source : --a--a--a--a--a--a--a--
  sub1   : --^-----------!
  sub2   : ---------^--------!
  first  : --a--a--a--a--
  second : -----------a--a--a-
  label ^ "subscribed"
  label ! "unsubscribed"
```

```mermaid-example
marble-beta
  title concatMap(d => of(d).pipe(delay(10)))
  input    : -a-b-c|
  expected : -- 9ms a 9ms b 9ms (c|)
```

#### Differences from RxJS

- Leading spaces start a lane later, so lanes aligned in your source stay aligned. RxJS ignores all whitespace; trim a marble string if its leading spaces were only there to line up code.
- A time progression takes one column instead of its full duration, so frames after it no longer line up with other lanes. Use the axis or `/` when exact alignment matters.
- `/`, and spans written with `[`, `=`, `~`, `]` and `>`, mean something here, where RxJS would read those characters as values.
- RxJS allows `!` only in subscription marbles and `^` only in hot observables; here both can appear in any lane.

### Lining lanes up

All lanes share one time origin: the leftmost marble of any lane or of the axis. Put the colons in one column and the marbles line up exactly as they look in your source:

```mermaid-example
marble-beta
  title takeUntil(stop)
  axis   : 0    5    10
  source : -a-b-c-d-e-|
  stop   : ------s
  result : -a-b-c|
```

### Labels

A `label` statement says what a marble character means. Each label is shown next to every marble with that character, and each labelled character takes the next color of the theme's palette, in the order the labels are written. Labels work for event characters, for the span fills `=` and `~`, and for `^`, `!`, `#` and `|`.

A span label is written inside the span when it fits, and next to it when it does not. Labels that would overlap move to a row above or further below the lane.

```mermaid-example
marble-beta
  title switchMap: a new search cancels the one in flight
  axis       : 0    5    10   15
  input      : -a-----b--c--------|
  "search a" :  [=====!
  "search b" :        [==!
  "search c" :           [=====]
  output     : ----------------r--|
  label = "request"
  label ! "cancelled"
  label r "results for c"
```

### Breaks in time

When a long, uneventful stretch would make a diagram too wide, write `/` where time is skipped. The column is drawn as a break on every active lane, so a single character can stand for minutes or hours:

```mermaid-example
marble-beta
  title timeout(5) then retry once after 1h
  axis    : 0    5    /  1h
  request : -[====!---/--[====#
  result  : ----------/-------#
  label = "attempt"
  label ! "timed out"
  label # "TimeoutError"
```

### Errors and cancellations

```mermaid-example
marble-beta
  title retry(2)
  "try 1" : -a-#
  "try 2" :    -a-#
  "try 3" :       -a-#
  result  : -a--a--a-#
  label # "error"
```

## Configuration

Marble diagrams take these options under the `marble` key:

| Option            | Type    | Default | Description                                                                    |
| ----------------- | ------- | ------- | ------------------------------------------------------------------------------ |
| `columnWidth`     | number  | `24`    | Horizontal distance, in pixels, between two columns                            |
| `laneHeight`      | number  | `56`    | Minimum height of a lane; all lanes grow together when labels need more room   |
| `marbleRadius`    | number  | `10`    | Radius of an event marble                                                      |
| `laneLabelGap`    | number  | `16`    | Space between a lane's name and its timeline                                   |
| `padding`         | number  | `16`    | Padding around the diagram                                                     |
| `showEventLabels` | boolean | `true`  | Show label text next to marbles. Span labels that fit inside a span still show |
| `useMaxWidth`     | boolean | `true`  | Scale the diagram to the width of its container                                |

```mermaid-example
---
config:
  marble:
    columnWidth: 16
    showEventLabels: false
---
marble-beta
  title filter(x => x % 2 === 1)
  source : -1-2-3-4-5-|
  result : -1---3---5-|
  label 1 "odd"
```

## Theming

Marble diagrams follow the theme, and every color can be overridden with these theme variables. Each defaults to one of the theme's core colors, shown on the right.

| Variable               | Used for                            | Default              |
| ---------------------- | ----------------------------------- | -------------------- |
| `marbleTitleColor`     | Title                               | `titleColor`         |
| `marbleLaneColor`      | Lane lines                          | `lineColor`          |
| `marbleLaneLabelColor` | Lane names                          | `textColor`          |
| `marbleAxisTextColor`  | Axis labels                         | `textColor`          |
| `marbleGridColor`      | Grid lines and label leader lines   | `lineColor`          |
| `marbleEventFill`      | Fill of unlabelled event marbles    | `primaryColor`       |
| `marbleEventStroke`    | Outline of unlabelled event marbles | `lineColor`          |
| `marbleEventTextColor` | Character inside unlabelled marbles | `primaryTextColor`   |
| `marbleLabelColor`     | Label text next to marbles          | `textColor`          |
| `marbleSpanFill`       | Fill of unlabelled spans            | `secondaryColor`     |
| `marbleSpanStroke`     | Outline of unlabelled spans         | `lineColor`          |
| `marbleSpanTextColor`  | Text inside unlabelled spans        | `secondaryTextColor` |
| `marbleCompleteColor`  | Completion bar `\|`                 | `lineColor`          |
| `marbleErrorColor`     | Error cross `#`                     | `critBkgColor`       |
| `marbleCancelColor`    | Unsubscription cross `!`            | `lineColor`          |
| `marbleBreakColor`     | Break marks `/`                     | `lineColor`          |
| `marbleBreakBkg`       | Gap behind break marks              | `background`         |

On a dark background, spans are outlined in `marbleSpanStroke` and labelled marbles in `marbleEventStroke`, and a fill that is close to black is mixed towards that outline, so spans and marbles stay visible against the background.

Labelled characters are colored from the theme's palette: the n-th label uses `cScale<n>` for its fill, `cScalePeer<n>` for its outline and `cScaleLabel<n>` for the character inside it, cycling after twelve.

```mermaid-example
---
config:
  theme: base
  themeVariables:
    marbleLaneColor: '#7a7a7a'
    marbleEventFill: '#ffd54f'
    marbleErrorColor: '#c62828'
---
marble-beta
  title map(x => 2 * x)
  source : -1-2-3-#
  mapped : -2-4-6-#
```

Hand-drawn mode is supported: set `look: handDrawn` to draw lanes, marbles and spans in a sketched style.

## Accessibility

Marble diagrams support the standard accessibility statements:

```mermaid-example
marble-beta
  accTitle: Debounced search
  accDescr: debounceTime(3) - keystrokes a, b and c arrive close together, so only c is emitted, three ticks after it.
  input  : -a-b-c-----|
  output : --------c--|
```
