grammar Wardley
import "../common/common";

entry Wardley:
    NEWLINE*
    "wardley-beta"
    (
        NEWLINE
        | TitleAndAccessibilities
        | Statement
    )*
;

fragment Statement:
    size=Size
    | evolution=Evolution
    | anchors+=Anchor
    | components+=Component
    | links+=Link
    | evolves+=Evolve
    | pipelines+=Pipeline
    | areas+=Area
    | notes+=Note
    | annotations+=Annotations
    | annotation+=Annotation
    | accelerators+=Accelerator
    | deaccelerators+=Deaccelerator
;

Size:
    'size' '[' width=INT ',' height=INT ']' EOL
;

Evolution:
    'evolution' stages+=EvolutionStage (ARROW stages+=EvolutionStage)+ EOL
;

EvolutionStage:
    name=EVOLUTION_NAME ('@' boundary=NUMBER)? ('/' secondName=EVOLUTION_NAME)?
;

Anchor:
    'anchor' name=(STRING | COMPONENT_NAME) '[' visibility=NUMBER ',' evolution=NUMBER ']' EOL
;

Component:
    'component' name=(STRING | COMPONENT_NAME) '[' visibility=NUMBER ',' evolution=NUMBER ']'
    label=Label? decorator=Decorator?
    (
        inertia?='inertia'
      | '(' inertia?='inertia' ')'
    )?
    EOL
;

Label:
    'label' '[' offsetX=NUMBER ',' offsetY=NUMBER ']'
;

Decorator:
    '(' strategy=STRATEGY ')'
;

Link:
    from=(STRING | COMPONENT_NAME) fromPort=LINK_PORT? (arrow=LINK_ARROW | ARROW) to=(STRING | COMPONENT_NAME) toPort=LINK_PORT?
    linkLabel=LINK_LABEL? EOL
;

Evolve:
    'evolve' component=(STRING | COMPONENT_NAME) target=NUMBER EOL
;

Pipeline:
    'pipeline' parent=(STRING | COMPONENT_NAME) '{' NEWLINE+
    components+=PipelineComponent+
    '}' EOL
;

PipelineComponent:
    'component' name=(STRING | COMPONENT_NAME) '[' evolution=NUMBER ']' label=Label? EOL
;

Area:
    'area' name=(STRING | COMPONENT_NAME) '[' visibility=NUMBER ',' evolution=NUMBER ']' EOL
;

Note:
    'note' text=STRING '[' visibility=NUMBER ',' evolution=NUMBER ']' EOL
;

Annotations:
    'annotations' '[' x=NUMBER ',' y=NUMBER ']' EOL
;

Annotation:
    'annotation' number=INT ',' '[' x=NUMBER ',' y=NUMBER ']' text=STRING EOL
;

Accelerator:
    'accelerator' name=(STRING | COMPONENT_NAME) '[' x=NUMBER ',' y=NUMBER ']' EOL
;

Deaccelerator:
    'deaccelerator' name=(STRING | COMPONENT_NAME) '[' x=NUMBER ',' y=NUMBER ']' EOL
;

// Specific terminals first
terminal ARROW: '->';
terminal LINK_PORT: '+>' | '+<' | '+<>';
terminal LINK_ARROW: '-->' | '-.->' | '>' | /\+'[^']*'<>/ | /\+'[^']*'</ | /\+'[^']*'>/;
terminal LINK_LABEL: /;[^\n\r]+/;
terminal STRATEGY: 'build' | 'buy' | 'outsource' | 'market';
terminal EVOLUTION_NAME: /[A-Za-z][A-Za-z0-9 ]*/;
terminal COMPONENT_NAME: /[A-Za-z][A-Za-z0-9 _\-()&]*/;
// Catch-all terminals - must be last and after all other rules
// These are problematic because they can shadow keywords
// Solution: Don't use them, use ID or QUOTED_STRING instead
// But for now, commenting them out to see if that fixes the issue
// terminal TEXT_UNTIL_BRACKET: /[^\[\n\r]+/;
// terminal TEXT_LINE: /[^\n\r]+/;

hidden terminal WS: /[ \t]+/;
