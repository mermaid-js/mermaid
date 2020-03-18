# Entity Relationship Diagrams

> An entity–relationship model (or ER model) describes interrelated things of interest in a specific domain of knowledge. A basic ER model is composed of entity types (which classify the things of interest) and specifies relationships that can exist between entities (instances of those entity types). Wikipedia.

Mermaid can render ER diagrams
```
erDiagram
    CUSTOMER !-?< ORDER : places
    ORDER !-!< LINE-ITEM : contains
```
```mermaid
erDiagram
    CUSTOMER !-?< ORDER : places
    ORDER !-!< LINE-ITEM : contains
```

## Syntax

### Entities and Relationships

To be completed
