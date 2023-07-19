grammar Timeline
import "../common/common";

entry Timeline:
  NEWLINE*
  "timeline"
  (
    NEWLINE* TitleAndAccessibilities TimelineSectionAndPeriod
    | NEWLINE+ TimelineSectionAndPeriod
    | NEWLINE*
  )
;

fragment TimelineSectionAndPeriod:
  sections+=TimelineSection* | periods+=TimelinePeriod*
;

TimelineSection:
  title=TIMELINE_SECTION_TITLE NEWLINE*
  periods+=TimelinePeriod*
;

TimelinePeriod:
  title=TIMELINE_PERIOD_TITLE NEWLINE*
  (":" events+=(TIMELINE_PERIOD_EVENT | TIMELINE_PERIOD_TITLE) NEWLINE*)*
;

terminal TIMELINE_SECTION_TITLE: /timeline-section-title/;
// TODO: figue out how to prevent `TIMELINE_PERIOD_TITLE` from consuming `TIMELINE_EVENT`
terminal TIMELINE_PERIOD_TITLE: /timeline-period-title/;
terminal TIMELINE_PERIOD_EVENT: /timeline-period-event/;
