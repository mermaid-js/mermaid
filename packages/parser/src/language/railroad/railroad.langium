grammar RailroadGrammar

terminal TITLE: /title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;
terminal ACC_TITLE: /accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal ACC_DESCR: /accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;

terminal RR_ID returns string: /[A-Z_a-z][\w-]*/;
terminal RR_STRING returns string: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;

hidden terminal RR_WHITESPACE: /[\t \r\n]+/;
hidden terminal RR_YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal RR_DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal RR_SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
hidden terminal RR_BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;

interface Railroad {
    title?: string
    accTitle?: string
    accDescr?: string
    rules: RailroadRule[]
}

interface RailroadRule {
    name: string
    definition: RailroadExpression
}

interface RailroadExpression {}

interface RailroadSequenceExpr extends RailroadExpression {
    elements: RailroadExpression[]
}

interface RailroadChoiceExpr extends RailroadExpression {
    alternatives: RailroadExpression[]
}

interface RailroadOptionalExpr extends RailroadExpression {
    element: RailroadExpression
}

interface RailroadOneOrMoreExpr extends RailroadExpression {
    element: RailroadExpression
}

interface RailroadZeroOrMoreExpr extends RailroadExpression {
    element: RailroadExpression
}

interface RailroadTerminalExpr extends RailroadExpression {
    value: string
}

interface RailroadNonTerminalExpr extends RailroadExpression {
    name: string
}

interface RailroadSpecialExpr extends RailroadExpression {
    text: string
}

entry Railroad returns Railroad:
    'railroad-diagram'
    ((title=TITLE | accTitle=ACC_TITLE | accDescr=ACC_DESCR))*
    rules+=RailroadRule*
;

RailroadRule returns RailroadRule:
    name=RR_ID '=' definition=RailroadExpression ';'
;

RailroadExpression returns RailroadExpression:
    RailroadSequenceExpr
    | RailroadChoiceExpr
    | RailroadOptionalExpr
    | RailroadOneOrMoreExpr
    | RailroadZeroOrMoreExpr
    | RailroadTerminalExpr
    | RailroadNonTerminalExpr
    | RailroadSpecialExpr
;

RailroadSequenceExpr returns RailroadSequenceExpr:
    'sequence' '(' elements+=RailroadExpression (',' elements+=RailroadExpression)* ')'
;

RailroadChoiceExpr returns RailroadChoiceExpr:
    'choice' '(' alternatives+=RailroadExpression (',' alternatives+=RailroadExpression)* ')'
;

RailroadOptionalExpr returns RailroadOptionalExpr:
    'optional' '(' element=RailroadExpression ')'
;

RailroadOneOrMoreExpr returns RailroadOneOrMoreExpr:
    'oneOrMore' '(' element=RailroadExpression ')'
;

RailroadZeroOrMoreExpr returns RailroadZeroOrMoreExpr:
    'zeroOrMore' '(' element=RailroadExpression ')'
;

RailroadTerminalExpr returns RailroadTerminalExpr:
    'terminal' '(' value=RR_STRING ')'
;

RailroadNonTerminalExpr returns RailroadNonTerminalExpr:
    'nonterminal' '(' name=RR_STRING ')'
;

RailroadSpecialExpr returns RailroadSpecialExpr:
    'special' '(' text=RR_STRING ')'
;
