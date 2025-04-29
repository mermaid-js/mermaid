# Use Case Diagram

> Use case diagrams show the interactions between actors and system use cases.  
> Actors are represented with circles, and use cases with ellipses.

## Example

```mermaid-example
use-case-beta
actor User
actor Admin position right
("Declare an UseCase")
User --> "UseCase 1"
User --> "UseCase 2"
Admin --> "UseCase 3"
"UseCase 1" -[include]-> "UseCase 2"
```
