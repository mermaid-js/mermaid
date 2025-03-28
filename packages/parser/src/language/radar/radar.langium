grammar Radar
// import "../common/common";
// Note: The import statement breaks TitleAndAccessibilities probably because of terminal order definition
// TODO: May need to change the common.langium to fix this

interface Common {
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) EOL)+
;

fragment EOL returns string:
  NEWLINE+ | EOF
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;

entry Radar:
    NEWLINE*
    ('radar-beta' | 'radar-beta:' | 'radar-beta' ':')
    NEWLINE*
    (
        TitleAndAccessibilities
        | 'axis' axes+=Axis (',' axes+=Axis)*
        | 'curve' curves+=Curve (',' curves+=Curve)*
        | options+=Option (',' options+=Option)*
        | NEWLINE
    )*
;

fragment Label:
    '[' label=STRING ']'
;

Axis:
    name=ID (Label)? 
;

Curve:
    name=ID (Label)? '{' Entries '}'
;

fragment Entries:
    NEWLINE* entries+=NumberEntry (',' NEWLINE* entries+=NumberEntry)* NEWLINE* |
    NEWLINE* entries+=DetailedEntry (',' NEWLINE* entries+=DetailedEntry)* NEWLINE*
;

interface Entry {
    axis?: @Axis;
    value: number;
}
DetailedEntry returns Entry:
    axis=[Axis:ID] ':'? value=NUMBER
;
NumberEntry returns Entry:
    value=NUMBER
;

Option:
    (
        name='showLegend' value=BOOLEAN
        | name='ticks' value=NUMBER
        | name='max' value=NUMBER
        | name='min' value=NUMBER
        | name='graticule' value=GRATICULE
    )
;


terminal NUMBER returns number: /(0|[1-9][0-9]*)(\.[0-9]+)?/;

terminal BOOLEAN returns boolean: 'true' | 'false';    

terminal GRATICULE returns string: 'circle' | 'polygon';

terminal ID returns string: /[a-zA-Z_][a-zA-Z0-9\-_]*/; 
terminal STRING: /"[^"]*"|'[^']*'/;