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
    'evolution' stages+=EvolutionStage ('->' stages+=EvolutionStage)+ EOL
;

EvolutionStage:
    name=EVOLUTION_NAME ('@' boundary=FLOAT)? ('/' secondName=EVOLUTION_NAME)?
;

Anchor:
    'anchor' name=COMPONENT_NAME '[' visibility=FLOAT ',' evolution=FLOAT ']' EOL
;

Component:
    'component' name=COMPONENT_NAME '[' visibility=FLOAT ',' evolution=FLOAT ']'
    label=Label? decorator=Decorator? inertia?='inertia'? EOL
;

Label:
    'label' '[' offsetX=NUMBER ',' offsetY=NUMBER ']'
;

Decorator:
    '(' strategy=STRATEGY ')'
;

Link:
    from=COMPONENT_NAME fromPort=LINK_PORT? arrow=LINK_ARROW to=COMPONENT_NAME toPort=LINK_PORT?
    (';' linkLabel=STRING)? EOL
;

Evolve:
    'evolve' component=COMPONENT_NAME target=FLOAT EOL
;

Pipeline:
    'pipeline' parent=COMPONENT_NAME '{' NEWLINE+
    components+=PipelineComponent+
    '}' EOL
;

PipelineComponent:
    'component' name=COMPONENT_NAME '[' evolution=FLOAT ']' label=Label? EOL
;

Area:
    'area' name=COMPONENT_NAME '[' visibility=FLOAT ',' evolution=FLOAT ']' EOL
;

Note:
    'note' text=STRING '[' visibility=FLOAT ',' evolution=FLOAT ']' EOL
;

Annotations:
    'annotations' '[' x=FLOAT ',' y=FLOAT ']' EOL
;

Annotation:
    'annotation' number=INT ',' '[' x=FLOAT ',' y=FLOAT ']' text=STRING EOL
;

Accelerator:
    'accelerator' name=COMPONENT_NAME '[' x=FLOAT ',' y=FLOAT ']' EOL
;

Deaccelerator:
    'deaccelerator' name=COMPONENT_NAME '[' x=FLOAT ',' y=FLOAT ']' EOL
;

// Specific terminals first
terminal LINK_PORT: '+>' | '+<' | '+<>';
terminal LINK_ARROW: '->' | /\+?'[^']*'?>/ | '>';
terminal STRATEGY: 'build' | 'buy' | 'outsource' | 'market' | 'inertia';
terminal QUOTED_STRING: /'[^']*'/;
terminal EVOLUTION_NAME: /[A-Za-z][A-Za-z0-9 ]*/;
terminal COMPONENT_NAME: /[A-Za-z0-9][A-Za-z0-9 _\-()&]*/;
// Catch-all terminals - must be last and after all other rules
// These are problematic because they can shadow keywords
// Solution: Don't use them, use ID or QUOTED_STRING instead
// But for now, commenting them out to see if that fixes the issue
// terminal TEXT_UNTIL_BRACKET: /[^\[\n\r]+/;
// terminal TEXT_LINE: /[^\n\r]+/;

hidden terminal WS: /[ \t]+/;
