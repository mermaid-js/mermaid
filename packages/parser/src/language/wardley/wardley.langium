grammar Wardley
import "../common/common";

entry Wardley:
    NEWLINE*
    KW_WARDLEY
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
    | notes+=Note
    | annotations+=Annotations
    | annotation+=Annotation
    | accelerators+=Accelerator
    | deaccelerators+=Deaccelerator
;

Size:
    KW_SIZE '[' width=INT ',' height=INT ']' EOL
;

Evolution:
    KW_EVOLUTION stages+=EvolutionStage (ARROW stages+=EvolutionStage)+ EOL
;

EvolutionStage:
    name=(ID | STRING | NAME_WITH_SPACES) ('@' boundary=WARDLEY_NUMBER)? ('/' secondName=(ID | STRING | NAME_WITH_SPACES))?
;

Anchor:
    KW_ANCHOR name=(STRING | ID | NAME_WITH_SPACES) '[' visibility=WARDLEY_NUMBER ',' evolution=WARDLEY_NUMBER ']' EOL
;

Component:
    KW_COMPONENT name=(STRING | ID | NAME_WITH_SPACES) '[' visibility=WARDLEY_NUMBER ',' evolution=WARDLEY_NUMBER ']'
    label=Label? decorator=Decorator?
    (
        inertia?=KW_INERTIA
      | '(' inertia?=KW_INERTIA ')'
    )?
    EOL
;

Label:
    KW_LABEL '[' negX?='-'? offsetX=INT ',' negY?='-'? offsetY=INT ']'
;

Decorator:
    '(' strategy=STRATEGY ')'
;

Link:
    from=(STRING | ID | NAME_WITH_SPACES) fromPort=LINK_PORT? arrow=(LINK_ARROW | ARROW)? to=(STRING | ID | NAME_WITH_SPACES) toPort=LINK_PORT?
    linkLabel=LINK_LABEL? EOL
;

Evolve:
    KW_EVOLVE component=(STRING | ID | NAME_WITH_SPACES) target=WARDLEY_NUMBER EOL
;

Pipeline:
    KW_PIPELINE parent=(STRING | ID | NAME_WITH_SPACES) '{' NEWLINE+
    components+=PipelineComponent+
    '}' EOL
;

PipelineComponent:
    KW_COMPONENT name=(STRING | ID | NAME_WITH_SPACES) '[' evolution=WARDLEY_NUMBER ']' label=Label? EOL
;

Note:
    KW_NOTE text=STRING '[' visibility=WARDLEY_NUMBER ',' evolution=WARDLEY_NUMBER ']' EOL
;

Annotations:
    KW_ANNOTATIONS '[' x=CoordinateValue ',' y=CoordinateValue ']' EOL
;

Annotation:
    KW_ANNOTATION number=INT ',' '[' x=CoordinateValue ',' y=CoordinateValue ']' text=STRING EOL
;

CoordinateValue returns number:
    WARDLEY_NUMBER | INT
;

Accelerator:
    KW_ACCELERATOR name=(STRING | ID | NAME_WITH_SPACES) '[' x=WARDLEY_NUMBER ',' y=WARDLEY_NUMBER ']' EOL
;

Deaccelerator:
    KW_DEACCELERATOR name=(STRING | ID | NAME_WITH_SPACES) '[' x=WARDLEY_NUMBER ',' y=WARDLEY_NUMBER ']' EOL
;

// Define decimal number terminal for coordinates
// This ONLY matches decimals like 0.5, not integers
// For accepting both decimals and integers, use the CoordinateValue rule
terminal WARDLEY_NUMBER returns number: /[0-9]+\.[0-9]+/;

terminal ARROW: '->';
terminal LINK_PORT: '+<>' | '+>' | '+<';
terminal LINK_ARROW: '-->' | '-.->' | '>' | /\+'[^']*'<>/ | /\+'[^']*'</ | /\+'[^']*'>/;
terminal LINK_LABEL: /;[^\n\r]+/;
terminal STRATEGY: 'build' | 'buy' | 'outsource' | 'market';

// Define keywords explicitly to ensure they take precedence over NAME_WITH_SPACES
terminal KW_WARDLEY: 'wardley-beta';
terminal KW_SIZE: 'size';
terminal KW_EVOLUTION: 'evolution';
terminal KW_ANCHOR: 'anchor';
terminal KW_COMPONENT: 'component';
terminal KW_LABEL: 'label';
terminal KW_INERTIA: 'inertia';
terminal KW_EVOLVE: 'evolve';
terminal KW_PIPELINE: 'pipeline';
terminal KW_NOTE: 'note';
terminal KW_ANNOTATIONS: 'annotations';
terminal KW_ANNOTATION: 'annotation';
terminal KW_ACCELERATOR: 'accelerator';
terminal KW_DEACCELERATOR: 'deaccelerator';

// NAME_WITH_SPACES must be defined LAST to avoid shadowing other terminals
// Uses negative lookahead to exclude matching content that starts with reserved keywords
// Matches names like "Campfire Kettle" and "byte pair encoding (BPE)"
// Pattern: letter, then any combo of letters/digits/_()&, then optionally (space/tab + letter OR open-paren, then more chars) repeating
// After a space, must start with letter [A-Za-z] or open paren [(] to allow both "Campfire Kettle" and "(BPE)"
// Uses [ \t]+ instead of \s+ to avoid matching newlines
terminal NAME_WITH_SPACES: /(?!title\s|accTitle|accDescr)[A-Za-z][A-Za-z0-9_()&]*(?:[ \t]+[A-Za-z(][A-Za-z0-9_()&]*)*/;
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
