grammar RailroadAbnfGrammar

terminal TITLE: /title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;
terminal ACC_TITLE: /accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal ACC_DESCR: /accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;

terminal ABNF_RULENAME returns string: /[A-Za-z][A-Za-z0-9-]*/;
terminal ABNF_STRING returns string: /"[^"]*"/;
terminal ABNF_NUMVAL returns string: /%[xXdDbB][0-9A-Fa-f]+(?:-[0-9A-Fa-f]+|\.[0-9A-Fa-f]+)*/;
terminal ABNF_REPEAT returns string: /[0-9]*\*[0-9]*/;
terminal ABNF_EXACT_REPEAT returns string: /[0-9]+/;

hidden terminal ABNF_WHITESPACE: /[\t \r\n]+/;
hidden terminal ABNF_YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal ABNF_DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal ABNF_SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
hidden terminal ABNF_COMMENT: /;[^\n\r]*/;

interface RailroadAbnf {
    title?: string
    accTitle?: string
    accDescr?: string
    rules: AbnfRule[]
}

interface AbnfRule {
    name: string
    definition: AbnfAlternation
}

interface AbnfAlternation {
    alternatives: AbnfConcatenation[]
}

interface AbnfConcatenation {
    elements: AbnfElement[]
}

interface AbnfElement {
    repeat?: string
    primary: AbnfPrimary
}

interface AbnfPrimary {}

interface AbnfStringLiteral extends AbnfPrimary {
    value: string
}

interface AbnfNumVal extends AbnfPrimary {
    value: string
}

interface AbnfRuleName extends AbnfPrimary {
    name: string
}

interface AbnfGroup extends AbnfPrimary {
    element: AbnfAlternation
}

interface AbnfOptionalGroup extends AbnfPrimary {
    element: AbnfAlternation
}

entry RailroadAbnf returns RailroadAbnf:
    'railroad-abnf'
    ((title=TITLE | accTitle=ACC_TITLE | accDescr=ACC_DESCR))*
    rules+=AbnfRule*
;

AbnfRule returns AbnfRule:
    name=ABNF_RULENAME '=' definition=AbnfAlternation ';'
;

AbnfAlternation returns AbnfAlternation:
    alternatives+=AbnfConcatenation ('/' alternatives+=AbnfConcatenation)*
;

AbnfConcatenation returns AbnfConcatenation:
    elements+=AbnfElement+
;

AbnfElement returns AbnfElement:
    (repeat=ABNF_REPEAT | repeat=ABNF_EXACT_REPEAT)? primary=AbnfPrimary
;

AbnfPrimary returns AbnfPrimary:
    AbnfStringLiteral
    | AbnfNumVal
    | AbnfRuleName
    | AbnfGroup
    | AbnfOptionalGroup
;

AbnfStringLiteral returns AbnfStringLiteral:
    value=ABNF_STRING
;

AbnfNumVal returns AbnfNumVal:
    value=ABNF_NUMVAL
;

AbnfRuleName returns AbnfRuleName:
    name=ABNF_RULENAME
;

AbnfGroup returns AbnfGroup:
    '(' element=AbnfAlternation ')'
;

AbnfOptionalGroup returns AbnfOptionalGroup:
    '[' element=AbnfAlternation ']'
;
