# About Mermaid

**Mermaid lets you create diagrams and visualizations using text and code.**

It is a Javascript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically.

>If you are familiar with Markdown you should have no problem learning [Mermaid's Syntax](./n00b-syntaxReference.md).


![banner](img/header.png)

**Edit this Page** [![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/README.md)

[![Build Status](https://travis-ci.org/mermaid-js/mermaid.svg?branch=master)](https://travis-ci.org/mermaid-js/mermaid) [![NPM](https://img.shields.io/npm/v/mermaid)](https://www.npmjs.com/package/mermaid) [![Coverage Status](https://coveralls.io/repos/github/mermaid-js/mermaid/badge.svg?branch=master)](https://coveralls.io/github/mermaid-js/mermaid?branch=master) [![Join our Slack!](https://img.shields.io/static/v1?message=join%20chat&color=9cf&logo=slack&label=slack)](https://join.slack.com/t/mermaid-talk/shared_invite/enQtNzc4NDIyNzk4OTAyLWVhYjQxOTI2OTg4YmE1ZmJkY2Y4MTU3ODliYmIwOTY3NDJlYjA0YjIyZTdkMDMyZTUwOGI0NjEzYmEwODcwOTE) [![This project is using Percy.io for visual regression testing.](https://percy.io/static/images/percy-badge.svg)](https://percy.io/Mermaid/mermaid)

<!-- <Main description> -->
The main purpose of Mermaid is to help with Visualizing Documentation, and helping it catch up with Development.
> Documentation-Rot is a Catch-22 that Mermaid helps to solve.

Diagramming and Documentation costs precious developer time and gets outdated quickly.
But not having diagrams or docs ruins productivity and hurts organizational learning.

Mermaid addresses this Catch-22 by cutting the time, effort and tooling that is required to create modifiable diagrams and charts, for smarter and more reusable content.
Mermaid, as a text-based diagramming tool allows for quick and easy updates, it can also be made part of production scripts (and other pieces of code), to make documentation much easier.

> Mermaid is a Diagramming tool for everyone.

Even non-programmers can create diagrams through the [Mermaid Live Editor](https://github.com/mermaid-js/mermaid-live-editor), Visit the [Tutorials Page](./Tutorials.md) for the Live Editor video tutorials.

Many editors, wikis and other tools also have mermaid integrations and plugins, making it easy to start using mermaid. A few of those are described in [Simple start to write diagrams](./n00b-gettingStarted.md).

For a more detailed introduction to Mermaid and some of it's more basic uses, look to the [Overview for Beginners](./n00b-overview.md) and [Usage](./usage.md).

🌐 [CDN](https://unpkg.com/mermaid/) | 📖 [Documentation](https://mermaidjs.github.io) | 🙌 [Contribution](https://github.com/mermaid-js/mermaid/blob/develop/docs/development.md) | 📜 [Version Log](./CHANGELOG.md) | 🔌 [Plug-Ins](./integrations.md)

> 🖖 Keep a steady pulse: mermaid needs more Collaborators, [Read More](https://github.com/knsv/mermaid/issues/866).

:trophy: **Mermaid was nominated and won the [JS Open Source Awards (2019)](https://osawards.com/javascript/#nominees) in the category "The most exciting use of technology"!!!**

**Thanks to all involved, people committing pull requests, people answering questions and special thanks to Tyler Long who is helping me maintain the project 🙏**


# Diagram Types

### [Flowchart](./flowchart.md?id=flowcharts-basic-syntax)

```
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

![Flowchart](img/flow.png)

### [Sequence diagram](./sequenceDiagram.md)

```
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

![Sequence diagram](img/sequence.png)

### [Gantt diagram](./gantt.md)

```
gantt
dateFormat  YYYY-MM-DD
title Adding GANTT diagram to mermaid
excludes weekdays 2014-01-10

section A section
Completed task            :done,    des1, 2014-01-06,2014-01-08
Active task               :active,  des2, 2014-01-09, 3d
Future task               :         des3, after des2, 5d
Future task2               :         des4, after des3, 5d
```

![Gantt diagram](img/gantt.png)

### [Class diagram](./classDiagram.md)

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

![Class diagram](img/class.png)

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
![Git graph](img/git.png)

### [Entity Relationship Diagram - :exclamation: experimental](./entityRelationshipDiagram.md)

```
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses

```

![ER diagram](img/simple-er.png)

### [User Journey Diagram](./user-journey.md)

```markdown
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```
![Journey diagram](img/user-journey.png)

# Installation

**In depth guides and examples can be found in [Getting Started](/n00b-gettingStarted) and [Usage](/usage).**

**It would also be helpful to learn more about mermaid's [Syntax](/n00b-syntaxReference).**

### CDN

```
https://unpkg.com/mermaid@<version>/dist/
```

To select a version:

Replace `<version>` with the desired version number.

Latest Version: [https://unpkg.com/browse/mermaid@8.8.0/](https://unpkg.com/browse/mermaid@8.8.0/)

## Deploying Mermaid
To Deploy Mermaid:

1. You will need to install node v16, which would have npm
2. Download yarn using npm
3. Enter the following command: `yarn add mermaid`
4. You can then add mermaid as a dev dependency using this command:
    `yarn add --dev mermaid`

## [Mermaid API](./Setup.md):

**To deploy mermaid without a bundler, one can insert a `script` tag with an absolute address and a `mermaidAPI` call into the HTML like so:**

```html
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>
```
**Doing so will command the mermaid parser to look for the `<div>` tags with `class="mermaid"`. From these tags mermaid will try to read the diagram/chart definitons and render them into svg charts.**

 **Examples can be found in** [Other examples](/examples)

# Sibling projects

- [Mermaid Live Editor](https://github.com/mermaid-js/mermaid-live-editor)
- [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli)
- [Mermaid Webpack Demo](https://github.com/mermaidjs/mermaid-webpack-demo)
- [Mermaid Parcel Demo](https://github.com/mermaidjs/mermaid-parcel-demo)

## Request for Assistance

Things are piling up and I have a hard time keeping up. To remedy this
it would be great if we could form a core team of developers to cooperate
with the future development of mermaid.

As part of this team you would get write access to the repository and would
represent the project when answering questions and issues.

Together we could continue the work with things like:

- Adding more types of diagrams like mindmaps, ert diagrams, etc.
- Improving existing diagrams

Don't hesitate to contact me if you want to get involved!

## For contributors

### Setup

```
yarn install
```

### Build

```
yarn build:watch
```

### Lint

```
yarn lint
```

We use [eslint](https://eslint.org/).
We recommend you installing [editor plugins](https://eslint.org/docs/user-guide/integrations) so you can get real time lint result.

### Test

```
yarn test
```
Manual test in browser: open `dist/index.html`

### Release

For those who have the permission to do so:

Update version number in `package.json`.

```
npm publish
```

Command above generates files into the `dist` folder and publishes them to npmjs.org.

## Credits

Many thanks to the [d3](http://d3js.org/) and [dagre-d3](https://github.com/cpettitt/dagre-d3) projects for providing the graphical layout and drawing libraries!

Thanks also to the [js-sequence-diagram](http://bramp.github.io/js-sequence-diagrams) project for usage of the grammar for the sequence diagrams. Thanks to Jessica Peter for inspiration and starting point for gantt rendering.

_Mermaid was created by Knut Sveidqvist for easier documentation._

Here is the full list of the projects [contributors](https://github.com/knsv/mermaid/graphs/contributors).
