Since 1.0.63

# Highlighting messages

The renderer will highlight an `Interaction` based on the value of `cursor` in the store.
For example, for DSL `A.x B.y`, if `cursor` is between [0, 3], `A.x` is highlighted in
the diagram; if `cursor` is between [4, 7], `B.y` is highlighted.

## What elements can be highlighted?

Theoretically, every element can be highlighted. The logic is different for
different types.

We will focus on messages: Creation and Messages (Sync & Async).

### Creation

Creations parser definition is:

```
creationBody (SCOL | braceBlock)?
```

We will highlight the creation call and assignment but NOT the `braceBlock`.
The triggering cursor must be in between `creationBody`.

### Message

Message parser definition is:

```
messageBody (SCOL | braceBlock)?
```

We will highlight the message call and assignment but NOT the `braceBlock`.
The triggering cursor must be in between `messageBody`.

### Async Message

Async message parser definition is:

```
source ARROW target COL content
```

We will highlight the whole message call.
The triggering curso must bee in between `source ARROW target COL content`.

## Implementation

The global store has a state `cursor`. Each component check whether this cursor
is in between the range that should set the `isCurrent` status of itself.
