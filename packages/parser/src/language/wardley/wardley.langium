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
    name=ID ('@' boundary=WARDLEY_NUMBER)? ('/' secondName=ID)?
;

Anchor:
    'anchor' name=(STRING | ID) '[' visibility=WARDLEY_NUMBER ',' evolution=WARDLEY_NUMBER ']' EOL
;

Component:
    'component' name=(STRING | ID) '[' visibility=WARDLEY_NUMBER ',' evolution=WARDLEY_NUMBER ']'
    label=Label? decorator=Decorator?
    (
        inertia?='inertia'
      | '(' inertia?='inertia' ')'
    )?
    EOL
;

Label:
    'label' '[' offsetX=WARDLEY_NUMBER ',' offsetY=WARDLEY_NUMBER ']'
;

Decorator:
    '(' strategy=STRATEGY ')'
;

Link:
    from=(STRING | ID) fromPort=LINK_PORT? arrow=(LINK_ARROW | ARROW) to=(STRING | ID) toPort=LINK_PORT?
    linkLabel=LINK_LABEL? EOL
;

Evolve:
    'evolve' component=STRING target=WARDLEY_NUMBER EOL
;

Pipeline:
    'pipeline' parent=STRING '{' NEWLINE+
    components+=PipelineComponent+
    '}' EOL
;

PipelineComponent:
    'component' name=(STRING | ID) '[' evolution=WARDLEY_NUMBER ']' label=Label? EOL
;

Area:
    'area' name=(STRING | ID) '[' visibility=WARDLEY_NUMBER ',' evolution=WARDLEY_NUMBER ']' EOL
;

Note:
    'note' text=STRING '[' visibility=WARDLEY_NUMBER ',' evolution=WARDLEY_NUMBER ']' EOL
;

Annotations:
    'annotations' '[' x=WARDLEY_NUMBER ',' y=WARDLEY_NUMBER ']' EOL
;

Annotation:
    'annotation' number=INT ',' '[' x=WARDLEY_NUMBER ',' y=WARDLEY_NUMBER ']' text=STRING EOL
;

Accelerator:
    'accelerator' name=(STRING | ID) '[' x=WARDLEY_NUMBER ',' y=WARDLEY_NUMBER ']' EOL
;

Deaccelerator:
    'deaccelerator' name=(STRING | ID) '[' x=WARDLEY_NUMBER ',' y=WARDLEY_NUMBER ']' EOL
;

// Terminals must be defined BEFORE imports to take highest precedence
// Define number terminals with explicit regex to avoid conflicts
terminal WARDLEY_NUMBER returns number: /[0-9]+\.[0-9]+|0|[1-9][0-9]*/;

terminal ARROW: '->';
terminal LINK_PORT: '+>' | '+<' | '+<>';
terminal LINK_ARROW: '-->' | '-.->' | '>' | /\+'[^']*'<>/ | /\+'[^']*'</ | /\+'[^']*'>/;
terminal LINK_LABEL: /;[^\n\r]+/;
terminal STRATEGY: 'build' | 'buy' | 'outsource' | 'market';
// Removed EVOLUTION_NAME and COMPONENT_NAME terminals - they were too greedy
// and shadowed imported terminals from common.langium (like TITLE)
// Now using ID for evolution names and STRING for component names
// Catch-all terminals - must be last and after all other rules
// These are problematic because they can shadow keywords
// Solution: Don't use them, use ID or QUOTED_STRING instead
// But for now, commenting them out to see if that fixes the issue
// terminal TEXT_UNTIL_BRACKET: /[^\[\n\r]+/;
// terminal TEXT_LINE: /[^\n\r]+/;

hidden terminal WS: /[ \t]+/;
