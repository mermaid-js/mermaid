# Use Case Diagram

> Use case diagrams show the interactions between actors and system use cases.  
> Actors are represented with circles, and use cases with ellipses.

## Example

```mermaid-example
use-case
actor "User"
actor "Admin" right
"User" --> (Login)
"User" --> (View Profile)
"Admin" --> (Manage Users)
(View Profile) --> (Edit Info)
@end
