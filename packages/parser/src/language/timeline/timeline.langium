grammar Timeline
import "../common/common";

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
terminal TIMELINE_PERIOD_EVENT: /:[\t ]+[^\n\r:]+/;
terminal TIMELINE_PERIOD_TITLE: /timeline-period-title/;
