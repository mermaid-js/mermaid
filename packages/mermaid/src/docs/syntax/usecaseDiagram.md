# Use Case Diagram (v<MERMAID_RELEASE_VERSION>+)

Mermaid can render Use Case Diagrams using the `usecaseDiagram` keyword.

## Syntax
```
usecaseDiagram
    actor "Customer" as C
    system "Shop" {
        usecase "Login" as UC1
        usecase "Checkout" as UC2
    }
    C --> UC1; UC2
    include: UC2 --> UC1
```

## Elements

| Keyword                      | Description                 |
| ---------------------------- | --------------------------- |
| `actor "Label" as A`         | Stick figure actor          |
| `system "Label" { }`         | System boundary rectangle   |
| `usecase "Label" as UC`      | Oval use case inside system |
| `external "Label" as E`      | External system rectangle   |
| `collaboration "Label" as C` | Dashed oval collaboration   |
| `note "Label" as N`          | Dog-ear note                |

## Relationships

| Syntax                     | Type           | Description                            |
| -------------------------- | -------------- | -------------------------------------- |
| `A --> UC`                 | association    | Actor to use case                      |
| `include: UC1 --> UC2`     | include        | UC1 always includes UC2                |
| `extend: UC1 --> UC2`      | extend         | UC1 optionally extends UC2             |
| `generalization: A --> B`  | generalization | A inherits B                           |
| `dependency: UC --> E`     | dependency     | UC depends on external                 |
| `realization: UC1 --> UC2` | realization    | UC1 realizes UC2                       |
| `anchor: N --> UC`         | anchor         | Attaches note to element               |
| `constraint: N1 --> N2`    | constraint     | Connects notes or constrained elements |
| `containment: UC1 --> UC2` | containment    | UC1 structurally contains UC2          |

## Theming
```
%%{init: { 'themeVariables': {
    'primaryColor': '#b3e5fc',
    'primaryBorderColor': '#01579b',
    'primaryTextColor': '#000000',
    'secondaryColor': '#e3f2fd',
    'tertiaryColor': '#fff9c4',
    'lineColor': '#01579b'
}}}%%
usecaseDiagram
    actor "Admin" as A
    system "Portal" {
        usecase "View Logs" as UC1
    }
    A --> UC1
```