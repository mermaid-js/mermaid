# Sequence diagrams

> A Sequence diagram is an interaction diagram that shows how processes operate with one another and in what order.

Mermaid can render sequence diagrams. The code snippet below:
```
%% Example of sequence diagram
sequenceDiagram
    Alice->John: Hello John, how are you?
    John-->Alice: Great!
```

Renders to the diagram below:

```
sequenceDiagram
    Alice->John: Hello John, how are you?
    John-->Alice: Great!
```

## Syntax

### Participants

The participants can be defined implicitly as in the first example in this page. The participants or actors are
rendered in order of appearance in the diagram source text. Sometimes you might want to show the participants in a
different order then when the first message from the actor appears. Then it is possible to introduce the actor
explicitly in by doing this decing the order of appearance.

```
%% Example of sequence diagram
sequenceDiagram
    participant John
    participant Alice
    Alice->John: Hello John, how are you?
    John-->Alice: Great!
```

Renders to the diagram below:

```
sequenceDiagram
    participant John
    participant Alice
    Alice->John: Hello John, how are you?
    John-->Alice: Great!
```

### Messages
Messages can be of two displayed either solid or with a dotted line.

### Notes
### Loops

## Styling

# Classes used