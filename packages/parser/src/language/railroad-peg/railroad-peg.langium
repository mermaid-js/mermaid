grammar RailroadPegGrammar

terminal TITLE: /title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;
terminal ACC_TITLE: /accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal ACC_DESCR: /accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;

terminal PEG_ID returns string: /[A-Z_a-z][\w-]*/;
terminal PEG_STRING returns string: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;

hidden terminal PEG_WHITESPACE: /[\t \r\n]+/;
hidden terminal PEG_YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal PEG_DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal PEG_SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
hidden terminal PEG_LINE_COMMENT: /#[^\n\r]*/;

interface RailroadPeg {
    title?: string
    accTitle?: string
    accDescr?: string
    rules: PegRule[]
}

interface PegRule {
    name: string
    definition: PegOrderedChoice
}

interface PegOrderedChoice {
    alternatives: PegSequence[]
}

interface PegSequence {
    elements: PegPrefix[]
}

interface PegPrefix {
    operator?: string
    suffix: PegSuffix
}

interface PegSuffix {
    primary: PegPrimary
    operator?: string
}

interface PegPrimary {}

interface PegLiteral extends PegPrimary {
    value: string
}

interface PegIdentifier extends PegPrimary {
    name: string
}

interface PegGroup extends PegPrimary {
    element: PegOrderedChoice
}

interface PegAny extends PegPrimary {
    dot: string
}

entry RailroadPeg returns RailroadPeg:
    'railroad-peg'
    ((title=TITLE | accTitle=ACC_TITLE | accDescr=ACC_DESCR))*
    rules+=PegRule*
;

PegRule returns PegRule:
    name=PEG_ID '<-' definition=PegOrderedChoice ';'
;

PegOrderedChoice returns PegOrderedChoice:
    alternatives+=PegSequence ('/' alternatives+=PegSequence)*
;

PegSequence returns PegSequence:
    elements+=PegPrefix+
;

PegPrefix returns PegPrefix:
    (operator='&' | operator='!')? suffix=PegSuffix
;

PegSuffix returns PegSuffix:
    primary=PegPrimary (operator='?' | operator='*' | operator='+')?
;

PegPrimary returns PegPrimary:
    PegLiteral
    | PegIdentifier
    | PegGroup
    | PegAny
;

PegLiteral returns PegLiteral:
    value=PEG_STRING
;

PegIdentifier returns PegIdentifier:
    name=PEG_ID
;

PegGroup returns PegGroup:
    '(' element=PegOrderedChoice ')'
;

PegAny returns PegAny:
    dot='.'
;
