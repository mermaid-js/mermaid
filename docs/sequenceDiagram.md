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

```
[Actor][Arrow][Actor]:Message text
```
There are two types of arrows currently supported:

-> which will render a solid line

--> which will render a dotted line


### Notes
It is possible to add notes to a sequence diagram. This is done by the notation
Note [right|left] of [Actor]: Text in note content

See the example below:
```
%% Example of sequence diagram
sequenceDiagram
    participant John
    Note right of John: Text in note
```

Renders to the diagram below:

```
sequenceDiagram
    participant John
    Note right of John: Text in note
```

It is possible to break text into different rows by using &lt;br/> as a line breaker.
```
%% Example of sequence diagram
sequenceDiagram
    participant John
    Note right of John: Text in note&lt;br/>spanning several&lt;br/>rows.
```

```
sequenceDiagram
    participant John
    Note right of John: Text in note<br/>spanning several<br/>rows.
```

### Loops
It is possible to express loops in a sequence diagram. This is done by the notation
```
loop Loop text
... statements ...
end
```

See the example below
```
%% Example of sequence diagram
sequenceDiagram
    Alice->John: Hello John, how are you?
    loop Reply every minute
        John-->Alice: Great!
    end
```

```
sequenceDiagram
    Alice->John: Hello John, how are you?
    loop Every minute
        John-->Alice: Great!
    end
```

## Styling

Styling of the a sequence diagram is done by defining a number of css classes. These classes are during rendering extracted from the

### Classes used

Class | Description
---          | ---
actor        | Style for the actor box at the top of the diagram.
text.actor   | Styles for text in the actor box at the top of the diagram.
actor-line   | The vertical line for an actor.
messageLine0 | Styles for the solid message line.
messageLine1 | Styles for the dotted message line.
messageText  | Defines styles for the text on the message arrows.
labelBox     | Defines styles label to left in a loop.
labelText    | Styles for the text in label for loops.
loopText     | Styles for the text in the loop box.
loopLine     | Defines styles for the lines in the loop box.
note         | Styles for the note box.
noteText     | Styles for the text on in the note boxes.

### Sample stylesheet


```

body {
    background: white;
}

.actor {
    stroke: #CCCCFF;
    fill: #ECECFF;
}
text.actor {
    fill:black;
    stroke:none;
    font-family: Helvetica;
}

.actor-line {
    stroke:grey;
}

.messageLine0 {
    stroke-width:1.5;
    stroke-dasharray: "2 2";
    marker-end:"url(#arrowhead)";
    stroke:black;
}

.messageLine1 {
    stroke-width:1.5;
    stroke-dasharray: "2 2";
    stroke:black;
}

#arrowhead {
    fill:black;

}

.messageText {
    fill:black;
    stroke:none;
    font-family: 'trebuchet ms', verdana, arial;
    font-size:14px;
}

.labelBox {
    stroke: #CCCCFF;
    fill: #ECECFF;
}

.labelText {
    fill:black;
    stroke:none;
    font-family: 'trebuchet ms', verdana, arial;
}

.loopText {
    fill:black;
    stroke:none;
    font-family: 'trebuchet ms', verdana, arial;
}

.loopLine {
    stroke-width:2;
    stroke-dasharray: "2 2";
    marker-end:"url(#arrowhead)";
    stroke: #CCCCFF;
}

.note {
    stroke: #decc93;
    stroke: #CCCCFF;
    fill: #fff5ad;
}

.noteText {
    fill:black;
    stroke:none;
    font-family: 'trebuchet ms', verdana, arial;
    font-size:14px;
}

```