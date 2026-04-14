grammar UsecaseGrammar
import "../common/common";

entry Usecase:
    NEWLINE*
    ('usecaseDiagram' | 'useCase')
    NEWLINE*
    (
        TitleAndAccessibilities
        | statements+=Statement
        | NEWLINE
    )*
;

Statement:
    ActorStatement | ExternalStatement | SystemStatement |
    UsecaseStatement | CollaborationStatement | NoteStatement |
    RelationshipStatement | AssociationStatement
;

// ---- Actor ----

ActorStatement:
    'actor' items+=DefinitionItem (';' items+=DefinitionItem)* EOL
;

// ---- External System ----

ExternalStatement:
    'external' items+=DefinitionItem (';' items+=DefinitionItem)* EOL
;

// ---- System Boundary ----

SystemStatement:
    'system' (label=STRING | name=ID) '{' NEWLINE*
    (
        items+=SystemUsecase (';' items+=SystemUsecase)*
        | NEWLINE
    )*
    '}' EOL?
;

SystemUsecase:
    'usecase'? (label=STRING 'as' alias=ID | label=STRING | alias=ID)
;

// ---- Standalone Use Case ----

UsecaseStatement:
    'usecase' items+=DefinitionItem (';' items+=DefinitionItem)* EOL
;

// ---- Collaboration ----

CollaborationStatement:
    'collaboration' items+=DefinitionItem (';' items+=DefinitionItem)* EOL
;

// ---- Note ----

NoteStatement:
    'note' items+=DefinitionItem (';' items+=DefinitionItem)* EOL
;

// ---- Shared definition item ----

DefinitionItem:
    label=STRING 'as' alias=ID
    | label=STRING
    | alias=ID
;

// ---- Association: A --> B; C; D ----

AssociationStatement:
    from=ID '-->' targets+=AssocTarget (';' targets+=AssocTarget)* EOL
;

AssocTarget:
    to=ID (':' label=STRING)?
;

// ---- Typed Relationship: include: A-->B; C-->D ----

RelationshipStatement:
    (
        type='include' | type='extend' | type='generalization' |
        type='dependency' | type='realization' | type='anchor' |
        type='constraint' | type='containment'
    )
    ':' pairs+=RelPair (';' pairs+=RelPair)* EOL
;

RelPair:
    from=ID '-->' to=ID (':' label=STRING)?
;
