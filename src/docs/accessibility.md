# Accessibility Options

**Edit this Page** [![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/accessibility.md)

## Accessibility
Now with Mermaid library in much wider use, we have started to work towards more accessible features, based on the feedback from the community.

To begin with, we have added a new feature to Mermaid library, which is to support accessibility options, **Accessibility Title** and **Accessibility Description**.

This support for accessibility options is available for all the diagrams/chart types. Also, we have tired to keep the same format for the accessibility options, so that it is easy to understand and maintain.


## Defining Accessibility Options

### Single line accessibility values
The diagram authors can now add the accessibility options in the diagram definition, using the `accTitle` and `accDescr` keywords, where each keyword is followed by `:` and the string value for title and description like:
-  `accTitle: "Your Accessibility Title"` or
-  `accDescr: "Your Accessibility Description"`

**When these two options are defined, they will  add a coressponding  `<title>` and `<desc>` tag in the SVG.**

Let us take a look at the following example with a flowchart diagram:

```mermaid-example
   graph LR
      accTitle: Big decisions
      accDescr: Flow chart of the decision making process
      A[Hard] -->|Text| B(Round)
      B --> C{Decision}
      C -->|One| D[Result 1]

```
See in the code snippet above, the `accTitle` and `accDescr` are defined in the diagram definition. They result in the following tags in SVG code:

![Accessibility options rendered inside SVG](img/accessibility-div-example.png)


### Multi-line Accessibility title/description
You can also define the accessibility options in a multi-line format, where the keyword is followed by opening curly bracket `{` and then mutltile lines, followed by a closing `}`.

`accTitle: My single line title value` (***single line format***)

vs

`accDescr: {
  My multi-line description
  of the diagram
}` (***multi-line format***)

Let us look at it in the following example, with same flowchart:
```mermaid-example
   graph LR
      accTitle: Big decisions

      accDescr {
        My multi-line description
        of the diagram
      }

      A[Hard] -->|Text| B(Round)
      B --> C{Decision}
      C -->|One| D[Result 1]

```
See in the code snippet above, the `accTitle` and `accDescr` are defined in the diagram definition. They result in the following tags in SVG code:

![Accessibility options rendered inside SVG](img/accessibility-div-example-2.png)

### Sample Code Snippet for other diagram types

#### Sequence Diagram

```mermaid-example
   sequenceDiagram
      accTitle: My Sequence Diagram
      accDescr: My Sequence Diagram Description

      Alice->>John: Hello John, how are you?
      John-->>Alice: Great!
      Alice-)John: See you later!
```

#### Class Diagram

```mermaid-example
   classDiagram
      accTitle: My Class Diagram
      accDescr: My Class Diagram Description

      Vehicle <|-- Car
```

#### State Diagram

```mermaid-example
   stateDiagram
      accTitle: My State Diagram
      accDescr: My State Diagram Description

       s1 --> s2

```

#### Entity Relationship Diagram

```mermaid-example
   erDiagram
      accTitle: My Entity Relationship Diagram
      accDescr: My Entity Relationship Diagram Description

    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses

```

#### User Journey Diagram

  ```mermaid-example
    journey
        accTitle: My User Journey Diagram
        accDescr: My User Journey Diagram Description

        title My working day
        section Go to work
          Make tea: 5: Me
          Go upstairs: 3: Me
          Do work: 1: Me, Cat
        section Go home
          Go downstairs: 5: Me
          Sit down: 5: Me

  ```

#### Gantt Chart

```mermaid-example
   gantt
      accTitle: My Gantt Chart Accessibility Title
      accDescr: My Gantt Chart Accessibility Description

    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d

```

#### Pie Chart

```mermaid-example
   pie
      accTitle: My Pie Chart Accessibility Title
      accDescr: My Pie Chart Accessibility Description

    title Key elements in Product X
    "Calcium" : 42.96
    "Potassium" : 50.05
    "Magnesium" : 10.01
    "Iron" :  5

```
#### Requirement Diagram

  ```mermaid-example
    requirementDiagram
        accTitle: My Requirement Diagram
        accDescr: My Requirement Diagram Description

         requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req

  ```

#### Gitgraph

  ```mermaid-example
    gitGraph
        accTitle: My Gitgraph Accessibility Title
        accDescr: My Gitgraph Accessibility Description

       commit
       commit
       branch develop
       checkout develop
       commit
       commit
       checkout main
       merge develop
       commit
       commit

  ```







