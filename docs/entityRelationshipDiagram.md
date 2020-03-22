# Entity Relationship Diagrams

> An entity–relationship model (or ER model) describes interrelated things of interest in a specific domain of knowledge. A basic ER model is composed of entity types (which classify the things of interest) and specifies relationships that can exist between entities (instances of those entity types). Wikipedia.

Note that practitioners of ER modelling almost always refer to entity types simply as entities.  For example the CUSTOMER entity type would be referred to simply as the CUSTOMER entity.  This is so common it would be inadvisable to do anything else, but technically an entity is an abstract instance of an entity type, and this is what an ER diagram shows - abstract instances, and the relationships between them.  This is why entities are always named using singular nouns.

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

Entity names are often capitalised, although there is no accepted standard on this, and it is not required in Mermaid.

Relationships between entities are represented by lines with end markers representing cardinality.  Mermaid uses the most popular crow's foot notation. The crow's foot intuitively conveys the possibility of many instances of the entity that it connects to.

## Status

ER diagrams are a new feature in Mermaid and are **experimental**.  There are likely to be a few bugs and constraints, and enhancements will be made in due course.

## Syntax

### Entities and Relationships

To be completed
