grammar XY
import "../common/common";

entry XY:
    NEWLINE*
    ('xy-beta' | 'xy-beta:' | 'xy-beta' ':' | 'xychart-beta' | 'xychart-beta:' | 'xychart-beta' ':')
    (orientation=ORIENTATION)?
    NEWLINE*
    (
        TitleAndAccessibilities
        | xAxis=XAxis
        | yAxis=YAxis
        | bar+=Bar
        | line+=Line
        | NEWLINE 
    )*
;

fragment Title:
    title=(STRING | ID)
;

XAxis:
    'x-axis' (Title)? (data=XAxisData)?
;

YAxis:
    'y-axis' (Title)? (data=YAxisData)?
;

Bar:
    'bar' (Title)? data=PlotData
;

Line:
    'line' (Title)? data=PlotData
;

PlotData:
    '[' values+=NUMBER (',' values+=NUMBER)* ']'
;

XAxisData:
    BandData | RangeData
;

YAxisData:
    RangeData
;

BandData:
    '[' labels+=(ID | STRING) (',' labels+=(ID | STRING))* ']'
;

RangeData:
    start=NUMBER '-->' end=NUMBER
;

terminal ORIENTATION returns string: 'vertical' | 'horizontal';