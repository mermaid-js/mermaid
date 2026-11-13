grammar WardleyGrammar
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
    | evolutions+=Evolution
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

// Keywords are matched only where the syntax expects them, so names such as `notebook`,
// `size guide`, `component library` or `inertia` still lex as NAME_WITH_SPACES. Each one:
// - is a whole word: `(?![A-Za-z0-9_&(]|-(?!>))` rejects the characters that would continue
//   a name, while `->` after it still ends the word;
// - for a statement keyword, starts its line: `(?<![^ \t\r\n][ \t]*)` rejects anything but
//   spaces or tabs before it on the line. (Chevrotain does not allow `^` in a pattern.);
// - where the statement has a fixed shape, is followed by it, so a link line that starts
//   with a name such as `size guide -> Shop` is not read as a statement. `evolution` must be
//   followed by a stage name, and its line must hold nothing a link has but an evolution
//   cannot: `+`, `;`, `-->`, `-.->` or a bare `>`, outside quotes and before any `%%`.
//   A line such as `evolution A -> B` still lexes as an evolution; the diagram reads it as a
//   link when a node named `evolution A` exists.
// - when its lookahead scans the rest of the line, skips quoted names (with the same escapes
//   as STRING) and stops at `;` (a link label) or `%%` (a comment), so `component "A; B" [...]`
//   is a component and `component library -> "Box [beta]"` is a link.
// `label` and `inertia` are matched only after the `]`, `(` or `)` that precedes them.
terminal KW_SIZE: /(?<![^ \t\r\n][ \t]*)size(?![A-Za-z0-9_&(]|-(?!>))(?=[ \t]*\[)/;
terminal KW_EVOLUTION: /(?<![^ \t\r\n][ \t]*)evolution(?![A-Za-z0-9_&(]|-(?!>))(?=[ \t]+[\w"'])(?!(?:[^\r\n"'%+;>-]|%(?!%)|-(?![->.])|->|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*(?:[+;>]|-->|-\.->))/;
terminal KW_ANCHOR: /(?<![^ \t\r\n][ \t]*)anchor(?![A-Za-z0-9_&(]|-(?!>))(?=(?:[^\r\n;"'%\[]|%(?!%)|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*\[)/;
terminal KW_COMPONENT: /(?<![^ \t\r\n][ \t]*)component(?![A-Za-z0-9_&(]|-(?!>))(?=(?:[^\r\n;"'%\[]|%(?!%)|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*\[)/;
terminal KW_LABEL: /(?<=\][ \t]*)label(?![A-Za-z0-9_&(]|-(?!>))/;
terminal KW_INERTIA: /(?<=[\]()][ \t]*)inertia(?![A-Za-z0-9_&(]|-(?!>))/;
terminal KW_EVOLVE: /(?<![^ \t\r\n][ \t]*)evolve(?![A-Za-z0-9_&(]|-(?!>))(?=(?:[^\r\n;"'%\[]|%(?!%)|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*[0-9]\.[0-9])/;
terminal KW_PIPELINE: /(?<![^ \t\r\n][ \t]*)pipeline(?![A-Za-z0-9_&(]|-(?!>))(?=(?:[^\r\n;"'%{]|%(?!%)|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*\{)/;
terminal KW_NOTE: /(?<![^ \t\r\n][ \t]*)note(?![A-Za-z0-9_&(]|-(?!>))(?=[ \t]*["'])/;
terminal KW_ANNOTATIONS: /(?<![^ \t\r\n][ \t]*)annotations(?![A-Za-z0-9_&(]|-(?!>))(?=[ \t]*\[)/;
terminal KW_ANNOTATION: /(?<![^ \t\r\n][ \t]*)annotation(?![A-Za-z0-9_&(]|-(?!>))(?=[ \t]*[0-9])/;
terminal KW_ACCELERATOR: /(?<![^ \t\r\n][ \t]*)accelerator(?![A-Za-z0-9_&(]|-(?!>))(?=(?:[^\r\n;"'%\[]|%(?!%)|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*\[)/;
terminal KW_DEACCELERATOR: /(?<![^ \t\r\n][ \t]*)deaccelerator(?![A-Za-z0-9_&(]|-(?!>))(?=(?:[^\r\n;"'%\[]|%(?!%)|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*\[)/;

// NAME_WITH_SPACES must be defined LAST to avoid shadowing other terminals
// Uses negative lookahead to exclude matching content that starts with reserved keywords
// Matches names like "Campfire Kettle" and "byte pair encoding (BPE)"
// Pattern: letter, then any combo of letters/digits/_()& or hyphen not followed by `>`,
// then optionally (space/tab + letter OR open-paren, then more chars) repeating.
// The `-(?!>)` negative lookahead lets names contain hyphens ("real-time processing")
// while preserving `->` as the ARROW terminal: in `A->B` the `-` is followed by `>`,
// the lookahead fails, the name stops at `A`, and `->` tokenises as ARROW.
// After a space, must start with letter [A-Za-z] or open paren [(] to allow both "Campfire Kettle" and "(BPE)"
// Uses [ \t]+ instead of \s+ to avoid matching newlines
terminal NAME_WITH_SPACES: /(?!title\s|accTitle|accDescr)[A-Za-z](?:[A-Za-z0-9_()&]|-(?!>))*(?:[ \t]+[A-Za-z(](?:[A-Za-z0-9_()&]|-(?!>))*)*/;
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
