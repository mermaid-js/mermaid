grammar RailroadGrammar

terminal TITLE: /title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;
terminal ACC_TITLE: /accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal ACC_DESCR: /accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;

terminal RR_ID returns string: /[A-Z_a-z][\w-]*/;
terminal RR_STRING returns string: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;
// Special sequence: `? … ?` delimiters.
// Lookahead requires at least one non-whitespace char between delimiters.
// Semicolons are excluded so a special sequence cannot span rule boundaries
// and the postfix `?` operator does not collide with the opening delimiter.
terminal RR_SPECIAL_SEQUENCE returns string: /\?(?=[^?;]*[^?\s;][^?;]*\?)[^?;]*\?/;

hidden terminal RR_WHITESPACE: /[\t \r\n]+/;
hidden terminal RR_YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal RR_DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal RR_SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
hidden terminal RR_BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal RR_ISO_COMMENT: /\(\*[\s\S]*?\*\)/;

interface Railroad {
    title?: string
    accTitle?: string
    accDescr?: string
    rules: RailroadRule[]
}

interface RailroadRule {
    name: string
    definition: RailroadChoice
}

interface RailroadChoice {
    alternatives: RailroadSequence[]
}

interface RailroadSequence {
    elements: RailroadTerm[]
}

interface RailroadTerm {
    base: RailroadPrimary
    postfixes: RailroadPostfix[]
}

interface RailroadPrimary {}
interface RailroadPostfix {}

interface RailroadTerminal extends RailroadPrimary {
    value: string
}

interface RailroadNonTerminal extends RailroadPrimary {
    name: string
}

interface RailroadSpecial extends RailroadPrimary {
    text: string
}

interface RailroadGroup extends RailroadPrimary {
    element: RailroadChoice
}

interface RailroadOptional extends RailroadPrimary {
    element: RailroadChoice
}

interface RailroadRepetition extends RailroadPrimary {
    element: RailroadChoice
}

interface RailroadOptionalPostfix extends RailroadPostfix {
    operator: string
}

interface RailroadZeroOrMorePostfix extends RailroadPostfix {
    operator: string
}

interface RailroadOneOrMorePostfix extends RailroadPostfix {
    operator: string
}

interface RailroadExceptionPostfix extends RailroadPostfix {
    except: RailroadPrimary
}

entry Railroad returns Railroad:
    'railroad-diagram'
    ((title=TITLE | accTitle=ACC_TITLE | accDescr=ACC_DESCR))*
    rules+=RailroadRule*
;

RailroadRule returns RailroadRule:
    name=RR_ID ('=' | '::=') definition=RailroadChoice ';'
;

RailroadChoice returns RailroadChoice:
    alternatives+=RailroadSequence ('|' alternatives+=RailroadSequence)*
;

RailroadSequence returns RailroadSequence:
    elements+=RailroadTerm (','? elements+=RailroadTerm)*
;

RailroadTerm returns RailroadTerm:
    base=RailroadPrimary postfixes+=RailroadPostfix*
;

RailroadPrimary returns RailroadPrimary:
    RailroadTerminal
    | RailroadSpecial
    | RailroadNonTerminal
    | RailroadGroup
    | RailroadOptional
    | RailroadRepetition
;

RailroadTerminal returns RailroadTerminal:
    value=RR_STRING
;

RailroadNonTerminal returns RailroadNonTerminal:
    name=RR_ID
;

RailroadSpecial returns RailroadSpecial:
    text=RR_SPECIAL_SEQUENCE
;

RailroadGroup returns RailroadGroup:
    '(' element=RailroadChoice ')'
;

RailroadOptional returns RailroadOptional:
    '[' element=RailroadChoice ']'
;

RailroadRepetition returns RailroadRepetition:
    '{' element=RailroadChoice '}'
;

RailroadPostfix returns RailroadPostfix:
    RailroadOptionalPostfix
    | RailroadZeroOrMorePostfix
    | RailroadOneOrMorePostfix
    | RailroadExceptionPostfix
;

RailroadOptionalPostfix returns RailroadOptionalPostfix:
    operator='?'
;

RailroadZeroOrMorePostfix returns RailroadZeroOrMorePostfix:
    operator='*'
;

RailroadOneOrMorePostfix returns RailroadOneOrMorePostfix:
    operator='+'
;

RailroadExceptionPostfix returns RailroadExceptionPostfix:
    '-' except=RailroadPrimary
;
