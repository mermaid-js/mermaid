grammar PieChart
import "./common";

entry PieChart:
    NEWLINE*
    PIE showData?=SHOWDATA? NEWLINE*
    TITLE_AND_ACCESSIBILITIES?
    (sections+=Section NEWLINE+)*
;

Section:
    label=STRING ":" value=NUMBER
;

terminal PIE: /pie(?!\S)/;
terminal SHOWDATA: /showData(?!\S)/;
