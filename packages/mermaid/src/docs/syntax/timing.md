# Timing diagrams (v<MERMAID_RELEASE_VERSION>+)

Timing diagrams show how digital, state, bus, and analog signals change over a shared time axis.
They are useful for documenting hardware interfaces, embedded systems, protocols, and
time-dependent software behavior.

> **Warning**
> Timing diagrams are in **beta**. Select this diagram type with the
> `timingDiagram-beta` keyword. Its syntax may change before it is declared stable.

## Basic example

```mermaid-example
timingDiagram-beta
  title Synchronous bus read
  timeUnit ns

  clock  CLK as "Clock" : period 2
  binary RST as "Reset"
  binary EN  as "Enable"
  bus    DATA as "Data bus"
  state  S as "Controller" : Idle, Waiting, Reading
  analog V as "Voltage" : min 0, max 5, interpolation linear

  RST  : 1 x2, 0 x6
  EN   : 0 x2, 1 x4, 0 x2
  DATA : Z x2, "D0", "D1", "D2", "D3", Z x2

  at 0
    S is Idle
    V is 0
  at 2
    S is Waiting
    V is 3.3
  at 4
    S is Reading
    V is 5
```

## Signal declarations

Declare signals before assigning values to them. An optional quoted alias controls the lane label.

| Type   | Declaration                                           | Rendering                                  |
| ------ | ----------------------------------------------------- | ------------------------------------------ |
| Clock  | `clock CLK as "Clock" : period 8, duty 50%, offset 0` | Repeating square wave                      |
| Binary | `binary EN as "Enable"`                               | High, low, unknown, or high-impedance line |
| State  | `state S as "Controller" : Idle, Waiting, Processing` | Labeled state segments                     |
| Bus    | `bus DATA as "Data bus"`                              | Labeled data segments                      |
| Analog | `analog V : min 0, max 5, interpolation linear`       | Scaled numeric line                        |

Signal identifiers use letters, numbers, and underscores and must begin with a letter or
underscore. Aliases and values containing spaces must be quoted.

### Clock options

Clock options are named and comma-separated:

- `period` is required and must be greater than zero.
- `duty` is the percentage of each period spent high. It defaults to `50%`.
- `offset` delays the first rising edge. It defaults to `0`.

To keep generated SVGs bounded, a clock can render at most 10,000 cycles. Increase its period or
shorten the overall timeline if that limit is exceeded.

```mermaid-example
timingDiagram-beta
  clock CLK : period 10, duty 30%, offset 2
```

### Binary values

Binary lanes accept these equivalent values:

| Meaning        | Values              |
| -------------- | ------------------- |
| Low            | `0`, `low`, `false` |
| High           | `1`, `high`, `true` |
| Unknown        | `X`, `unknown`      |
| High impedance | `Z`                 |

`X` and `Z` segments use a dashed line.

### State values

The optional list on a state declaration documents the expected states and their preferred order.
It does not restrict later values, so a state discovered while documenting a system can be used
without rewriting the declaration.

```mermaid-example
timingDiagram-beta
  state MODE : Idle, Starting, Running
  MODE : Idle x2, Starting, Running x3, Fault
```

### Analog options

Analog values must be numbers. The optional `min` and `max` parameters fix the vertical scale; when
omitted, Mermaid derives the range from the signal values. `interpolation` can be `linear` (the
default) or `step`.

```mermaid-example
timingDiagram-beta
  analog TEMP as "Temperature" : min -20, max 100, interpolation step
  TEMP : 20 x2, 35 x2, 55 x2, 40 x2
```

## Signal-major value sequences

Assign a comma-separated value sequence with `SIGNAL : values`. Each value lasts one time unit by
default. Add `xN` to use run-length encoding and hold a value for `N` units.

```mermaid-example
timingDiagram-beta
  binary CS
  bus DATA
  CS   : 1 x2, 0 x4, 1 x2
  DATA : Z x2, "0x2A" x2, "0x7F" x2, Z x2
```

Run lengths must be positive integers. Values hold for their full segment and transitions happen at
segment boundaries.

## Absolute-time transitions

Use an `at` block when several lanes change at the same absolute time. A signal holds its last value
until its next transition.

```mermaid-example
timingDiagram-beta
  state SERVICE : Offline, Starting, Ready
  binary HEALTHY

  at 0
    SERVICE is Offline
    HEALTHY is 0
  at 5
    SERVICE is Starting
  at 12
    SERVICE is Ready
    HEALTHY is 1
```

A lane cannot mix a signal-major sequence with `at` transitions. Other lanes in the same diagram may
use either form.

## Time axis

Use `timeUnit` to label the shared axis. Mermaid does not convert between units; every period,
offset, run length, and `at` time uses the unit you declare.

```text
timeUnit ns
```

The diagram ends after the longest sequence or clock span. For absolute-time transitions, Mermaid
adds one final hold interval so the last value remains visible. The axis automatically chooses
readable tick spacing for both short and long timelines.

## Titles, accessibility, and comments

Timing diagrams support Mermaid's standard title, accessibility, frontmatter, and comment syntax.

<!--- cspell:ignore SCLK --->

```mermaid-example
---
title: SPI transfer
---
timingDiagram-beta
  accTitle: SPI transfer timing
  accDescr: Chip select goes low while eight clock pulses transfer one byte.
  %% The clock is generated from its declaration.
  clock SCLK : period 2
  binary CS
  CS : 1, 0 x8, 1
```

## Configuration

Timing diagram geometry can be adjusted through the `timing` configuration namespace.

| Option        | Default | Description                                         |
| ------------- | ------- | --------------------------------------------------- |
| `width`       | `900`   | Width of the timeline, excluding labels and padding |
| `rowHeight`   | `48`    | Height of each signal lane                          |
| `labelWidth`  | `120`   | Width reserved for signal labels                    |
| `padding`     | `16`    | Padding around the diagram                          |
| `axisHeight`  | `36`    | Height reserved for the time axis                   |
| `useMaxWidth` | `true`  | Scale the SVG to its available container width      |

```mermaid-example
---
config:
  timing:
    width: 650
    rowHeight: 56
---
timingDiagram-beta
  clock CLK : period 4
  binary READY
  READY : 0 x2, 1 x4, 0 x2
```

Timing diagrams use the active Mermaid theme's standard `lineColor`, `textColor`, `titleColor`,
`primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryColor`, and `tertiaryColor`
variables. Override those variables in frontmatter to coordinate timing diagrams with other diagram
types.

Cross-lane arrows and duration or setup/hold constraints are not part of the beta v1 syntax. The
arrow forms `-->` and `<-->` remain available for a future timing annotation syntax.
