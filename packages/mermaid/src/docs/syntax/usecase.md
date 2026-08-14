# Use case diagrams (<MERMAID_RELEASE_VERSION>+)

Use case diagrams show how actors interact with a system and its use cases. Start a diagram with the `usecase-beta` keyword. Put each statement on its own physical line.

In UML prose, **use case** is two words. Mermaid's exact syntax keyword is the single token `usecase-beta`; this page uses the two-word form everywhere else.

```mermaid-example
usecase-beta
direction LR
actor Customer("Customer")
systemBoundary "Order system"
  Checkout("Place order")
end
Customer --> Checkout
```

Use `direction` with `TD`, `TB`, `BT`, `LR`, or `RL` to choose the layout direction.

## Actors and use cases

Actor and use case identifiers match `[A-Za-z0-9_]+`, so they may start with a digit — `1`, `1mg`, and `3rd` are all valid. Identifiers are diagram-wide and are shared by actors, use cases, boundaries, JSON nodes, and explicit edges.

A bare actor uses its identifier as its label. An actor can also have an explicit identifier and display label. Use cases use parentheses for an ellipse and square brackets for a rectangle.

```mermaid-example
usecase-beta
Customer --> Login
actor Customer
actor Admin("Main administrator")
Login("Sign in")
Report[Generate report]
"Reset password"
Admin --> Report
```

`Login("Sign in")` has the stable identifier `Login` and the display label `Sign in`. A quoted declaration such as `"Reset password"` gets a deterministic identifier by replacing each non-word character with `_`. Use an explicit identifier when other statements need a readable, stable reference.

A relationship endpoint can appear before its declaration. Final declaration order does not affect the resolved kind, shape, or label. An endpoint that has no explicit declaration becomes an ellipse use case. Actors are never inferred from their position in a relationship and require an `actor` declaration somewhere in the diagram.

### Actor variants

Actors support four variants. The normal stick actor is the default. Set `type` to `hollow` or `awesome` for the other built-in variants. Set `icon` to an icon name for an icon actor.

```mermaid-example
usecase-beta
actor Normal("Normal actor")
actor Hollow("Hollow actor")@{ type: hollow }
actor Awesome("Awesome actor")@{ type: awesome }
actor Icon("Registered icon")@{ icon: "fa:user" }
actor Fallback("Missing icon fallback")@{ icon: "not-registered:user" }
Normal --> Manage
Hollow --> Manage
Awesome --> Manage
Icon --> Manage
Fallback --> Manage
```

Icon actors use Mermaid's icon registry. [Register the required icon pack](../config/icons.md) before using an icon name from that pack. If an icon is not available, Mermaid renders the standard unknown-icon fallback instead of failing the diagram.

Actor metadata accepts only `type`, `icon`, and `business`. An icon cannot be combined with a non-normal `type` or with `business: true`.

### Business elements and stereotypes

Set `business: true` to add the conventional business slash to a normal or hollow actor or to an ellipse use case. Rectangular use cases, awesome actors, and icon actors cannot be business elements.

An actor or use case can have one visible stereotype. Put `<<...>>` after metadata and before a `:::` class suffix. The stereotype keeps its case and appears above the main label.

```mermaid-example
usecase-beta
actor SalesAgent("Sales agent")@{ business: true } <<Employee>>
actor Broker@{ type: hollow, business: true }
Quote("Prepare quote")@{ business: true } <<Core>>
Archive[Archive quote] <<Record>>
SalesAgent --> Quote
Broker --> Quote
Quote --> Archive
```

Stereotypes provide visible semantics but do not create CSS classes or automatic stereotype selectors. Use classes or direct styles to control their appearance.

## Labels

Labels can be unquoted text inside parentheses or brackets, a single-line plain string, or a Mermaid Markdown string. The same forms apply to actor labels, use case labels, boundary titles, relationship labels, and notes.

Plain strings remain plain text. Markdown markers in a plain string are displayed literally. Mermaid Markdown strings use an outer pair of double quotes and an inner pair of backticks. Markdown strings can contain physical newlines.

```mermaid-example
usecase-beta
actor Reviewer("`*Reviewer*`")
Literal("**Literal markers**")
Formatted("`**Formatted label**
with a physical line break`")
Quoted("Show #quot;quoted#quot; text")
Reviewer -- "`opens **form**`" --> Formatted
Reviewer --> Literal
Reviewer --> Quoted
```

Use Mermaid entity codes when a delimiter must appear in a label. Common codes include `#quot;`, `#39;`, `#40;`, `#41;`, `#91;`, `#93;`, and `#96;`. Plain strings do not process backslash escapes. For example, `"First\nSecond"` displays the backslash and `n`; use a physical newline inside a Markdown string for multiline content.

## Lines and comments

Each statement occupies one physical line unless it contains a Markdown string, multiline metadata block, JSON object, accessibility description block, or system boundary block. The final statement does not need a trailing newline.

After optional indentation, `%%` starts a whole-line comment. Blank lines and comments retain their source order in the public AST.

```mermaid-example
usecase-beta
%% Actors are declared explicitly.
actor User

%% Each relationship is a separate statement.
User --> Login
Login --> Dashboard
```

`%%` inside a string is label data. `//` and `#` are not comments. A semicolon is not a statement separator. Any token after a complete statement on the same physical line is an error.

## System boundaries

A `systemBoundary` block groups actor and use case declarations. A quoted title gets a deterministic identifier. In this example the title `Payment service` produces the boundary identifier `Payment_service`, which is used for the metadata assignment after the block.

```mermaid-example
usecase-beta
systemBoundary "Payment service":::system
  actor Clerk("Payment clerk")
  Authorize("Authorize payment")
  Receipt[Create receipt]
end
Payment_service@{ type: package }
Clerk --> Authorize
Authorize --> Receipt
classDef system fill:#f8f8ff,stroke:#4b4b7a
```

The default boundary type is `rect`. Set `type: package` at the top level to render a package title tab. Boundary IDs are diagram-wide, while their titles are display labels.

Boundaries are one level deep. Their contents can contain only actor and use case declarations, blank lines, and `%%` comments. Relationships, notes, JSON nodes, direction statements, class and style statements, boundary metadata, and nested boundaries remain at the top level. An actor or use case can belong to at most one boundary. Contained elements can be referenced by top-level relationships, notes, classes, and styles.

## Relationships

### Associations

Seven solid association operators are supported. The marker direction and type are preserved.

```mermaid-example
usecase-beta
actor User
actor Support
Start
Finish
User --> Start
Start <-- Support
Start -- Finish
User --o Start
Start o-- Support
User --x Finish
Finish x-- Support
```

Solid associations can have a label. A label containing `include` or `extend` is still an ordinary association.

```mermaid-example
usecase-beta
actor User
Login
User -- "include account details" --> Login
```

JSON nodes can use only point, reversed-point, or markerless solid associations. Circle, cross, include, extend, and generalization relationships cannot connect to JSON nodes.

### Include, extend, and generalization

Use explicit operators for UML relationship semantics.

```mermaid-example
usecase-beta
actor Admin
actor Person
Checkout
Payment
ApplyCoupon
Admin --|> Person
Checkout ..> : include Payment
ApplyCoupon ..> : extend Checkout
ApplyCoupon --|> Checkout
```

For include, the source use case includes the target use case. For extend, the source use case extends the target base use case. Generalization points from the specialized actor or use case to the general actor or use case. Include and extend require use case endpoints. Generalization requires two actors or two use cases.

### Edge IDs, styles, animation, and length

Place an explicit edge ID followed by `@` immediately before an operator. Explicit edge IDs share the diagram-wide ID namespace and can be targeted by `class`, `style`, and metadata statements.

```mermaid-example
usecase-beta
actor Customer
Checkout
Payment
Customer opens@-- "starts checkout" ---> Checkout
Checkout payment@..> : include Payment
classDef emphasized stroke:#d33,stroke-width:3px
class opens,payment emphasized
style opens stroke:#06c,stroke-width:4px
opens@{ animation: fast }
payment@{ animate: false }
```

Anonymous edges receive internal IDs but cannot be styled or configured by ID. Use `animate: true` for the default speed, `animation: fast` or `animation: slow` to select a speed and enable animation, and `animate: false` to disable it.

Extra dashes request greater minimum layout length on point, reversed-point, and markerless solid associations. The two-dash form has `minlen = 1`; three dashes give `minlen = 2`, and each additional dash adds one. For example, `A --> B`, `A ---> B`, and `A ----> B` request progressively longer edges. In a labelled association, put the extra dashes on the right side of the label, as in `A -- "longer" ----> B`. Circle, cross, include, extend, and generalization operators have fixed length and reject extra dashes.

## Notes

A note attaches to one actor or use case. The target can be declared after the note. Mermaid places the shared folded-corner note shape automatically and connects it to the target with a dotted, markerless line.

```mermaid-example
usecase-beta
note for Login "`Requires an **active session**`"
note for User "Starts the workflow"
actor User
Login("Sign in")
User --> Login
```

Notes cannot target JSON nodes, boundaries, edges, or other notes. Notes do not have placement keywords, aliases, direct links, standalone forms, or multiple attachments.

## JSON tables

A top-level JSON declaration creates a table whose title is its identifier. Its body must be a strict JSON object.

```mermaid-example
usecase-beta
Inspect("Inspect payload")
json Payload@{
  "2": "second in source",
  "1": "first after 2",
  "enabled": true,
  "count": 3,
  "missing": null,
  "colors": ["Red", "Green"],
  "address": { "city": "Oslo" },
  "items": [{ "name": "Book" }],
  "emptyObject": {},
  "emptyArray": []
}:::data
Inspect --> Payload
classDef data fill:#f6fbff,stroke:#3572a5
style Payload stroke-width:2px
```

Object properties appear in source order, including integer-like keys. Arrays keep index order. Nested leaves use paths such as `address.city` and `items[0].name`. Empty objects and arrays get one row. If a JSON object repeats a property, the last value wins while the property's first source position is retained. Strings render without JSON quote marks; numbers, booleans, and `null` use JSON spelling.

JSON declarations must stay at the top level. Arrays and scalar values are not valid roots. JSON strings and table cells use the shared text sanitization path.

## Styling

Actors, use cases, boundaries, JSON nodes, and explicit edges support Mermaid classes and direct styles. Use `classDef` to define one or more classes, `class` to assign them, `style` for direct declarations, or `:::` on an actor, use case, boundary, or JSON declaration.

```mermaid-example
usecase-beta
actor Customer:::external
Checkout("Checkout"):::critical
systemBoundary Account
  Profile[Edit profile]
end
json Session@{ "active": true }:::data
Customer --> Checkout
Checkout --> Profile
Profile --> Session
classDef default fill:#fff,stroke:#333
classDef external,critical stroke-width:3px
class Customer,Checkout external,critical
class Account,Session data
style Checkout fill:#fff0f0
style Account stroke:#536878
```

CSS declarations are comma-separated `property:value` items. Use `\,` for a literal comma in a value. Semicolons are rejected. Style precedence is theme variables, the `default` class, named classes in assignment order, then direct `style` declarations. Later declarations win per property within the same layer.

Actor metadata is typed and is not a style map. `fillColor`, `strokeColor`, `strokeWidth`, and arbitrary actor metadata keys are errors. Use `classDef`, `class`, or `style` instead.

## Configuration

Use case diagrams accept these diagram configuration keys:

| Key                 | Default                   | Purpose                                       |
| ------------------- | ------------------------- | --------------------------------------------- |
| `actorFontSize`     | `14`                      | Actor label font size                         |
| `actorFontFamily`   | `"Open Sans", sans-serif` | Actor label font family                       |
| `actorFontWeight`   | `normal`                  | Actor label font weight                       |
| `usecaseFontSize`   | `12`                      | Use case label font size                      |
| `usecaseFontFamily` | `"Open Sans", sans-serif` | Use case label font family                    |
| `usecaseFontWeight` | `normal`                  | Use case label font weight                    |
| `nodeSpacing`       | `50`                      | Spacing between nodes on the same level       |
| `rankSpacing`       | `50`                      | Spacing between layout ranks                  |
| `diagramPadding`    | `20`                      | Padding around the diagram                    |
| `useMaxWidth`       | `true`                    | Whether the SVG scales to the available width |

```mermaid-example
---
config:
  usecase:
    actorFontSize: 16
    actorFontFamily: Arial
    actorFontWeight: bold
    usecaseFontSize: 14
    usecaseFontFamily: Georgia
    usecaseFontWeight: normal
    nodeSpacing: 60
    rankSpacing: 70
    diagramPadding: 24
    useMaxWidth: false
---
usecase-beta
direction LR
actor Customer
Browse("Browse catalog")
Customer --> Browse
```

Classes and direct styles override theme and diagram font configuration for the properties they set. See [Mermaid configuration](../config/configuration.md) for global initialization and frontmatter configuration.

## Accessibility

Use `accTitle` and `accDescr` to give the diagram an accessible title and description. `accDescr` accepts a single-line value after `:` or a multiline block.

```mermaid-example
usecase-beta
accTitle: Account access use cases
accDescr {
  A customer signs in and can reset a password.
  The diagram names the actor, use cases, and associations.
}
actor Customer
SignIn("Sign in")
Reset("Reset password")
Customer --> SignIn
Customer --> Reset
```

Rendered actors, use cases, boundaries, notes, JSON tables, and relationships include semantic accessible names. Actor variants, business roles, stereotypes, and relationship types are included in those names. See [Accessibility](../config/accessibility.md) for the diagram title and description syntax.

## Complete example

Features can be combined in one diagram. This example uses accessibility metadata, actor variants, a package boundary, stereotypes, classes, a JSON table, a note, a labelled long association, an include relationship, an animated edge, and a directly styled edge.

```mermaid-example
usecase-beta
direction LR
accTitle: Online ordering use cases
accDescr {
  A customer places an order through the storefront.
  Staff review the order and inspect its data.
}
actor Customer("Customer")
actor Staff("Order staff")@{ type: hollow, business: true } <<Employee>>
systemBoundary "Ordering System":::system
  Browse("Browse products")
  Checkout("Checkout") <<Core>>:::critical
  Payment("Process payment")
  Review[Review order]
end
Ordering_System@{ type: package }
json OrderData@{
  "status": "pending",
  "items": [{ "name": "Book", "quantity": 1 }],
  "total": 29.95
}:::data
note for Checkout "`Validates the **cart** before payment`"
Customer starts@-- "places order" ---> Checkout
Customer --> Browse
Checkout pays@..> : include Payment
Staff --> Review
Review --> OrderData
classDef system fill:#fffbea,stroke:#8a6d1d
classDef critical fill:#fff0f0,stroke:#c33,stroke-width:3px
classDef data fill:#eef8ff,stroke:#3572a5
starts@{ animation: fast }
style pays stroke:#6b46c1,stroke-width:2px
```

## Limitations

Use case diagrams have these limits:

- One Mermaid block produces one SVG. Page splitting is not supported, and `newpage` is an unknown statement.
- Boundaries cannot be nested and can contain only actor and use case declarations.
- A note has one actor or use case target and no manual placement syntax.
- A stereotype can be added only to an actor or use case. It does not create an automatic CSS selector.
- JSON is a top-level use case diagram node, not a generic cross-diagram data node.
- Raw `<style>` blocks are host HTML and are not part of the diagram grammar.
- There are no per-edge left, right, up, or down direction hints.
- Arbitrary actor style metadata is not supported.

PlantUML use case syntax is not accepted. This includes separators and titled separators, `as` aliases, colon actors, actor-position inference, standalone `package` and `rectangle` blocks, `skinparam`, `allowmixing`, backslash escaping, plain `\n` multiline text, link-direction hints, note placement keywords, standalone notes, multi-target notes, and `newpage`.

## Migration from permissive and PlantUML syntax

Existing diagrams that relied on permissive parsing or PlantUML forms need these changes:

- Put one statement on each physical line. Same-line statements and `newpage` no longer become accidental use cases.
- Undeclared relationship endpoints still become ellipse use cases. Declare every actor with `actor ID` somewhere in the document because source position does not imply an actor.
- An association label containing `include` or `extend` remains an association. Use `..> : include` or `..> : extend` for UML include and extend semantics.
- Replace actor `fillColor`, `strokeColor`, `strokeWidth`, and other arbitrary metadata with `classDef`, `class`, or `style`.
- Remove the unused `actorMargin` and `usecaseMargin` configuration keys. The actor and use case font keys, `nodeSpacing`, `rankSpacing`, `diagramPadding`, and `useMaxWidth` now affect the rendered output.
- Replace unsupported PlantUML syntax rather than carrying it into a Mermaid block. Plain `\n`, separators, titled separators, `as` aliases, colon actors, actor-position inference, standalone `package` and `rectangle` blocks, `skinparam`, `allowmixing`, left, right, up, or down link hints, note placement keywords, standalone notes, multi-target notes, and `newpage` are outside the grammar.

<!--- cspell:ignore markerless newpage skinparam allowmixing --->
