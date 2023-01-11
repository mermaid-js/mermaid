# Interaction width

Interaction width, in the most simple scenario, is defined by the distance of two participants -
`from` and `to`.

## Simple case

### Width

In the following
Each '◻' is a pixel

```
  |   A   |       |   B   |
1 2 3 4 5 6 7 8 9 a b c d e f g h
◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻
```

#### 1. Interaction width

Interaction will overlap the left lifeline but not the right.
A has left as 2, center as 4 and right as 6; B has a/c/e. For Interaction `m2` in (A.m1{B.m2}),
the width should be 4 to c (inclusive) that is 9 (`c - 4 + 1`). This is `distance(from, to)`.

#### 2. Message width

Message width should be 100% content + interactionBorderWidthx2 - ((OccurrenceWidth - 1)/2)x2 - interactionBorderWidth.

### Left

#### 1. Message left

```
100% // content width of interaction
+ InteractionBorderWidth x 2
- ((OccurrenceWidth-1)/2) x 2
```

#### 2. Self Occurrence Left

```
left: width of InteractionBorderWidth
```

### Offset

There are a few ways to implement offset, we have to combine them.

#### 1. Padding of occurance

> Suppose the width of an occurance is 5 (border width 1x2, content 3)

To aligh Occurance's center, we need to set its left. An occurance
at `left: 100%` will be from c to g. Note that the 100% only consider
the content width.

To align its center to c, we
have to move back by 3 (`(occuranceWidth-1)/2 - interactionBorderWidth - LifelineWidth`).

occurance must have a padding of 1 that is (width - boarder x 2 - 1) / 2.

## Self call indent
