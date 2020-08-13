# Mermaid

[![Build Status](https://travis-ci.org/mermaid-js/mermaid.svg?branch=master)](https://travis-ci.org/mermaid-js/mermaid)
[![Coverage Status](https://coveralls.io/repos/github/knsv/mermaid/badge.svg?branch=master)](https://coveralls.io/github/knsv/mermaid?branch=master)
[![Join the chat at https://gitter.im/knsv/mermaid](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/knsv/mermaid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![banner](./img/header.png)
**Edit this Page** [![N|Solid](./img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/README.md)


**Mermaid was nominated and won the JS Open Source Awards (2019) in the category "The most exciting use of technology"!!! Thanks to all involved, people committing pull requests, people answering questions and special thanks to Tyler Long who is helping me maintain the project.**


# Doc-Rot is a Catch-22 that Mermaid helps to solve.

### Diagramming and Documentation costs precious developer time and gets outdated quickly. 
### But not having diagrams or Docs ruins productivity and hurts organizational learning. 

## mermaid addresses this problem by cutting the time, effort and tooling that is required to create modifiable diagrams and charts, for smarter and more reusable content.** 

The text definitions that create mermaid diagrams allows for easy updates, it can also be made part of production scripts (and other pieces of code). So less time needs be spent on documenting, as a separate and laborious task. 

## Even non-programmers can create diagrams through the [Mermaid Live Editor](https://github.com/mermaidjs/mermaid-live-editor).

## You can watch some popular mermaid Live Editor tutorials on  [mermaid Overview](./n00b-overview.md) for a quick intro. 

## To use mermaid with your favorite applications, check out the list of [Integrations and Usages of Mermaid](./integrations.md)**

## For a more detailed introduction to mermaid and some of it's more basic uses, look to the [Beginner's Guide](https://mermaid-js.github.io/mermaid/#/n00b-overview) and [Usage](./usage.md).

## [CDN](https://unpkg.com/mermaid/)

## [Documentation](https://mermaidjs.github.io)

## [Contribution](https://github.com/mermaid-js/mermaid/blob/develop/CONTRIBUTING.md)

## [Recent Mermaid Versions](./versionUpdates.md).

# Most Recent Version News: Version 8.7.0

## [New and Expanded Mermaid Theme and Styling Configurations](./theming.md)

## [New Mermaid Live-Editor Beta](https://mermaid-js.github.io/docs/mermaid-live-editor-beta/#/edit/eyJjb2RlIjoiJSV7aW5pdDoge1widGhlbWVcIjogXCJmb3Jlc3RcIiwgXCJsb2dMZXZlbFwiOiAxIH19JSVcbmdyYXBoIFREXG4gIEFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuICBCIC0tPiBDe0xldCBtZSB0aGlua31cbiAgQyAtLT58T25lfCBEW0xhcHRvcF1cbiAgQyAtLT58VHdvfCBFW2lQaG9uZV1cbiAgQyAtLT58VGhyZWV8IEZbZmE6ZmEtY2FyIENhcl1cblx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGFyayJ9fQ)

## [New Configuration Protocols in version 8.6.0](./8.6.0_docs.md)


## [Version Record](./versionUpdates.md)

**🖖 Keep a steady pulse: mermaid needs more Collaborators [#866](https://github.com/knsv/mermaid/issues/866)**

# Diagrams that mermaid can render:

### [Flowchart](https://mermaid-js.github.io/mermaid/#/flowchart)

```
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

![Flowchart](./img/flow.png)

### [Sequence diagram](https://mermaid-js.github.io/mermaid/#/sequenceDiagram)

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

![Sequence diagram](./img/sequence.png)

### [Gantt diagram](https://mermaid-js.github.io/mermaid/#/gantt)

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

![Gantt diagram](./img/gantt.png)

### [Class diagram - :exclamation: experimental](https://mermaid-js.github.io/mermaid/#/classDiagram)

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

### [Entity Relationship Diagram - :exclamation: experimental](https://mermaid-js.github.io/mermaid/#/entityRelationshipDiagram)

```
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses

```

![ER diagram](./img/simple-er.png)

### [User Journey Diagram](https://mermaid-js.github.io/mermaid/#/user-journey)

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
![Journey diagram](./img/user-journey.png)

# Installation
## In depth guides and examples can be found in [Getting Started](./n00b-gettingStarted.md) and [Usage](./usage.md).

## It would also be helpful to learn more about mermaid's [Syntax](./n00b-syntaxReference.md).

### CDN

```
https://unpkg.com/mermaid@<version>/dist/
```

To select a version:

Replace `<version>` with the desired version number.

Alternatively, you can also adjust the version number in the page itself. 

Latest Version: https://unpkg.com/browse/mermaid@8.6.0/

## Incorporating mermaid to a website 
To support mermaid on your website, all you have to do is add Mermaid’s JavaScript package 

```
1.You will need to isntall node v10 or 12, which would have npm

2. download yarn using npm.

3. enter the following command:
    yarn add mermaid

4. You can then add mermaid as a dev dependency using this command: 
    yarn add --dev mermaid
   
```

## To deploy mermaid without a bundler, one can insert a `script` tag with an absolute address and a `mermaidAPI` call into the HTML like so:
```
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>
```
## doing so will command the mermaid parser to look for the `<div>` tags with `class="mermaid"` in your HTML Document. From these tags mermaid will try to read the diagram/chart definitons and render them as svg charts.

## Examples can be found in [Getting Started](./n00b-gettingStarted.md)

# Sibling projects
- [mermaid live editor](https://github.com/mermaidjs/mermaid-live-editor)
- [mermaid CLI](https://github.com/mermaidjs/mermaid.cli)
- [mermaid webpack demo](https://github.com/mermaidjs/mermaid-webpack-demo)
- [mermaid Parcel demo](https://github.com/mermaidjs/mermaid-parcel-demo)

## Request for assistance

Things are piling up and I have a hard time keeping up. To remedy this
it would be great if we could form a core team of developers to cooperate
with the future development of mermaid.

As part of this team you would get write access to the repository and would
represent the project when answering questions and issues.

Together we could continue the work with things like:

- Adding more types of diagrams like mindmaps, ert diagrams, etc.
- Improving existing diagrams

Don't hesitate to contact me if you want to get involved.

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

_[Tyler Long](https://github.com/tylerlong) has became a collaborator since April 2017._

Here is the full list of the projects [contributors](https://github.com/knsv/mermaid/graphs/contributors).
