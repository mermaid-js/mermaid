# mermaid

[![Build Status](https://travis-ci.org/knsv/mermaid.svg?branch=master)](https://travis-ci.org/knsv/mermaid)
[![Code Climate](https://codeclimate.com/github/knsv/mermaid/badges/gpa.svg)](https://codeclimate.com/github/knsv/mermaid)
[![Join the chat at https://gitter.im/knsv/mermaid](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/knsv/mermaid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![banner](./img/header.png)

Generation of diagrams and flowcharts from text in a similar manner as markdown.

Ever wanted to simplify documentation and avoid heavy tools like Visio when explaining your code?

This is why mermaid was born, a simple markdown-like script language for generating charts from text via javascript.


### Flowchart

```
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
![Flowchart](./img/flow.png)


### Sequence diagram

```
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail...
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```
![Sequence diagram](./img/sequence.png)


### Gantt diagram

```
gantt
dateFormat  YYYY-MM-DD
title Adding GANTT diagram to mermaid

section A section
Completed task            :done,    des1, 2014-01-06,2014-01-08
Active task               :active,  des2, 2014-01-09, 3d
Future task               :         des3, after des2, 5d
Future task2               :         des4, after des3, 5d
```
![Gantt diagram](./img/gantt.png)


### Class diagram - :exclamation: experimental

```
classDiagram
Class01 <|-- AveryLongClass : Cool
Class03 *-- Class04
Class05 o-- Class06
Class07 .. Class08
Class09 --> C2 : Where am i?
Class09 --* C3
Class09 --|> Class07
Class07 : equals()
Class07 : Object[] elementData
Class01 : size()
Class01 : int chimp
Class01 : int gorilla
Class08 <--> C2: Cool label
```
![Class diagram](./img/class.png)


### Git graph - :exclamation: experimental

```
gitGraph:
options
{
    "nodeSpacing": 150,
    "nodeRadius": 10
}
end
commit
branch newbranch
checkout newbranch
commit
commit
checkout master
commit
commit
merge newbranch

```

![Git graph](./img/git.png)


## Installation

### CDN

```
https://unpkg.com/mermaid@<version>/dist/
```

Replace `<version>` with expected version number.

Example: https://unpkg.com/mermaid@7.1.0/dist/

### Node.js

```
yarn add mermaid
```


## Documentation

https://mermaidjs.github.io


## Sibling projects

- [mermaid CLI](https://github.com/mermaidjs/mermaid.cli)
- [mermaid live editor](https://github.com/mermaidjs/mermaid-live-editor)
- [mermaid webpack demo](https://github.com/mermaidjs/mermaid-webpack-demo)
- [mermaid Parcel demo](https://github.com/mermaidjs/mermaid-parcel-demo)


# Request for assistance

Things are piling up and I have hard time keeping up. To remedy this
it would be great if we could form a core team of developers to cooperate
with the future development mermaid.

As part of this team you would get write access to the repository and would
represent the project when answering questions and issues.

Together we could continue the work with things like:
* adding more typers of diagrams like mindmaps, ert digrams etc
* improving existing diagrams

Don't hesitate to contact me if you want to get involved.


# For contributors

## Setup

Make sure you have Chrome browser installed, this project uses Chrome headless to running tests.

    yarn install


## Build

    yarn build:watch


## Lint

    yarn lint

We use [JavaScript Standard Style](https://github.com/feross/standard).
We recommend you installing [editor plugins](https://github.com/feross/standard#are-there-text-editor-plugins) so you can get real time lint result.


## Test

    yarn test

Manual test in browser:

    open dist/index.html


## Release

For those who have the permission to do so:

Update version number in `package.json`.

    npm publish

Command above generates files into the `dist` folder and publishes them to npmjs.org.


# Credits

Many thanks to the [d3](http://d3js.org/) and [dagre-d3](https://github.com/cpettitt/dagre-d3) projects for providing the graphical layout and drawing libraries!

Thanks also to the [js-sequence-diagram](http://bramp.github.io/js-sequence-diagrams) project for usage of the grammar for the sequence diagrams. Thanks to Jessica Peter for inspiration and starting point for gantt rendering.

*Mermaid was created by Knut Sveidqvist for easier documentation.*

*[Tyler Long](https://github.com/tylerlong) has became a collaborator since April 2017.*

Here is the full list of the projects [contributors](https://github.com/knsv/mermaid/graphs/contributors).
