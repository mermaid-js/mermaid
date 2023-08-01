grammar Timeline

// common stuff in ../common/common.langium
// can't import directly because of TIMELINE_PERIOD_TITLE parse rule
fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /[\t ]*(?:accDescr(?:[\t ]*:[\t ]*[^\n\r]*?(?=%%)|\s*{[^}]*})|accDescr(?:[\t ]*:[\t ]*[^\n\r]*|\s*{[^}]*}))/;
terminal ACC_TITLE: /[\t ]*(?:accTitle[\t ]*:[\t ]*[^\n\r]*?(?=%%)|accTitle[\t ]*:[\t ]*[^\n\r]*)/;
terminal TITLE: /[\t ]*(?:title(?:[\t ]+[^\n\r]*?|)(?=%%)|title(?:[\t ]+[^\n\r]*|))/;

hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n[\s\S]*?---[\t ]*(?!.)/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*\n*/;

// actual grammar
entry Timeline:
  NEWLINE*
  "timeline"
  (
    NEWLINE* TitleAndAccessibilities TimelineSectionAndPeriod
    | NEWLINE* TitleAndAccessibilities
    | NEWLINE+ TimelineSectionAndPeriod
    | NEWLINE*
  )
;

fragment TimelineSectionAndPeriod:
  sections+=TimelineSection+ | periods+=TimelinePeriod+
;

TimelineSection:
  title=TIMELINE_SECTION_TITLE NEWLINE+
  periods+=TimelinePeriod*
;

TimelinePeriod:
  title=TIMELINE_PERIOD_TITLE NEWLINE*
  (events+=TIMELINE_PERIOD_EVENT NEWLINE*)*
;

terminal TIMELINE_SECTION_TITLE: /section[\t ]+[^\n\r]+/;
terminal TIMELINE_PERIOD_EVENT: /(?!%%.*):[\t ]+[^\n\r:]+/;
terminal TIMELINE_PERIOD_TITLE: /timeline-period-title/;
