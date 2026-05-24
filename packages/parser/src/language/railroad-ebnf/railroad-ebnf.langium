grammar RailroadEbnfGrammar

terminal TITLE: /title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;
terminal ACC_TITLE: /accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal ACC_DESCR: /accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;

terminal EBNF_ID returns string: /[A-Z_a-z][\w-]*/;
terminal EBNF_STRING returns string: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;
// Special sequence: `? ... ?` delimiters.
// Lookahead requires at least one non-whitespace char between delimiters.
// Semicolons are excluded so a special sequence cannot span rule boundaries
// and the postfix `?` operator does not collide with the opening delimiter.
terminal EBNF_SPECIAL_SEQUENCE returns string: /\?(?=[^?;]*[^?\s;][^?;]*\?)[^?;]*\?/;

hidden terminal EBNF_WHITESPACE: /[\t \r\n]+/;
hidden terminal EBNF_YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal EBNF_DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal EBNF_SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
hidden terminal EBNF_BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal EBNF_ISO_COMMENT: /\(\*[\s\S]*?\*\)/;

interface RailroadEbnf {
    title?: string
    accTitle?: string
    accDescr?: string
    rules: EbnfRule[]
}

interface EbnfRule {
    name: string
    definition: EbnfChoice
}

interface EbnfChoice {
    alternatives: EbnfSequence[]
}

interface EbnfSequence {
    elements: EbnfTerm[]
}

interface EbnfTerm {
    base: EbnfPrimary
    postfixes: EbnfPostfix[]
}

interface EbnfPrimary {}
interface EbnfPostfix {}

interface EbnfTerminal extends EbnfPrimary {
    value: string
}

interface EbnfNonTerminal extends EbnfPrimary {
    name: string
}

interface EbnfSpecial extends EbnfPrimary {
    text: string
}

interface EbnfGroup extends EbnfPrimary {
    element: EbnfChoice
}

interface EbnfOptional extends EbnfPrimary {
    element: EbnfChoice
}

interface EbnfRepetition extends EbnfPrimary {
    element: EbnfChoice
}

interface EbnfOptionalPostfix extends EbnfPostfix {
    operator: string
}

interface EbnfZeroOrMorePostfix extends EbnfPostfix {
    operator: string
}

interface EbnfOneOrMorePostfix extends EbnfPostfix {
    operator: string
}

interface EbnfExceptionPostfix extends EbnfPostfix {
    except: EbnfPrimary
}

entry RailroadEbnf returns RailroadEbnf:
    'railroad-ebnf'
    ((title=TITLE | accTitle=ACC_TITLE | accDescr=ACC_DESCR))*
    rules+=EbnfRule*
;

EbnfRule returns EbnfRule:
    name=EBNF_ID ('=' | '::=') definition=EbnfChoice ';'
;

EbnfChoice returns EbnfChoice:
    alternatives+=EbnfSequence ('|' alternatives+=EbnfSequence)*
;

EbnfSequence returns EbnfSequence:
    elements+=EbnfTerm (','? elements+=EbnfTerm)*
;

EbnfTerm returns EbnfTerm:
    base=EbnfPrimary postfixes+=EbnfPostfix*
;

EbnfPrimary returns EbnfPrimary:
    EbnfTerminal
    | EbnfSpecial
    | EbnfNonTerminal
    | EbnfGroup
    | EbnfOptional
    | EbnfRepetition
;

EbnfTerminal returns EbnfTerminal:
    value=EBNF_STRING
;

EbnfNonTerminal returns EbnfNonTerminal:
    name=EBNF_ID
;

EbnfSpecial returns EbnfSpecial:
    text=EBNF_SPECIAL_SEQUENCE
;

EbnfGroup returns EbnfGroup:
    '(' element=EbnfChoice ')'
;

EbnfOptional returns EbnfOptional:
    '[' element=EbnfChoice ']'
;

EbnfRepetition returns EbnfRepetition:
    '{' element=EbnfChoice '}'
;

EbnfPostfix returns EbnfPostfix:
    EbnfOptionalPostfix
    | EbnfZeroOrMorePostfix
    | EbnfOneOrMorePostfix
    | EbnfExceptionPostfix
;

EbnfOptionalPostfix returns EbnfOptionalPostfix:
    operator='?'
;

EbnfZeroOrMorePostfix returns EbnfZeroOrMorePostfix:
    operator='*'
;

EbnfOneOrMorePostfix returns EbnfOneOrMorePostfix:
    operator='+'
;

EbnfExceptionPostfix returns EbnfExceptionPostfix:
    '-' except=EbnfPrimary
;
