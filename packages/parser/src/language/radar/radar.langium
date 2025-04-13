grammar Radar
import "../common/common";

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
        | name='tickLabels' value=TickLabels
        | name='tickLabelsAxis' value=NUMBER
    )
;   

terminal GRATICULE returns string: 'circle' | 'polygon';

TickLabels:
    '{' NEWLINE* labels+=STRING (',' NEWLINE* labels+=STRING)* NEWLINE* '}'
;